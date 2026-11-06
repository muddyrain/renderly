import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
const at = (name) =>
  import(
    pathToFileURL(
      path.join(process.env.RENDERLY_STUDIO_TEST_BUILD, `lib/${name}.js`),
    ).href
  );
const { ProjectSync } = await at("projects/project-sync");
const { createProjectAPI, ProjectRequestError, validProject, trimProjectText } =
  await at("projects/project-api");
const { WorkspaceStore } = await at("demo/workspace-store");
const { proxyProjects } = await at("server/project-proxy");
const workspace = "22222222-2222-4222-8222-222222222222";
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const saved = (projectId = id, name = "真实项目") => ({
  id: projectId,
  name,
  description: "line1\nline2",
  workspace_id: workspace,
  created_by: "11111111-1111-4111-8111-111111111111",
  created_at: "2026-11-06T00:00:00Z",
  updated_at: "2026-11-06T00:00:00Z",
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
function harness(overrides = {}) {
  let rows = [saved()];
  const calls = [];
  const api = {
    list: async () => rows,
    create: async (values) => {
      const row = { ...saved(), ...values };
      rows = [row];
      return row;
    },
    update: async (_, values) => {
      rows = [{ ...rows[0], ...values }];
      return rows[0];
    },
    remove: async () => {
      rows = [];
    },
    ...overrides,
  };
  const store = new WorkspaceStore(undefined, undefined, true);
  const sync = new ProjectSync(api, (projects, notice) => {
    calls.push(projects);
    store.replaceProjects(projects, notice);
  });
  return { sync, store, calls, api };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
test("connected state begins empty/unassigned and cannot use local CRUD or upload fixtures", () => {
  const { store } = harness();
  assert.deepEqual(store.getSnapshot().projects, []);
  assert.equal(store.getSnapshot().activeProjectId, null);
  assert(store.getSnapshot().assets.every((a) => a.projectId === null));
  assert(
    store.getSnapshot().characters.every((c) => c.projectIds.length === 0),
  );
  assert.equal(store.createProject("不允许本地冒充保存", ""), false);
  store.loadFixture(false);
  assert.deepEqual(store.getSnapshot().projects, []);
});
test("Unicode project validation matches Go code points and White_Space trimming", () => {
  assert(
    validProject({ name: "😀".repeat(120), description: "汉".repeat(1000) }),
  );
  assert(!validProject({ name: "😀".repeat(121), description: "" }));
  assert(!validProject({ name: "汉", description: "😀".repeat(1001) }));
  assert(!validProject({ name: "\u0085\t ", description: "" }));
  assert(!validProject({ name: "a\0", description: "" }));
  assert.equal(trimProjectText("\u0085汉😀\u0085"), "汉😀");
  assert.equal(trimProjectText("第一行\n第二行"), "第一行\n第二行");
});
test("save updates shared state only after acknowledgment; duplicate writes are blocked", async () => {
  const pending = deferred();
  let writes = 0;
  const { sync, store, api } = harness({
    create: () => {
      writes++;
      return pending.promise;
    },
  });
  await sync.load();
  const promise = sync.save(null, { name: "保存后的项目", description: "" });
  assert.equal(sync.getSnapshot().pending, true);
  assert.equal(store.getSnapshot().projects[0].name, "真实项目");
  assert.equal(await sync.save(null, { name: "重复", description: "" }), false);
  assert.equal(writes, 1);
  api.list = async () => [saved(id, "保存后的项目")];
  pending.resolve(saved(id, "保存后的项目"));
  assert.equal(await promise, true);
  assert.equal(store.getSnapshot().projects[0].name, "保存后的项目");
  sync.dispose();
});
test("failed deletion retains project, active context and temporary associations", async () => {
  const { sync, store } = harness({
    remove: async () => {
      throw new ProjectRequestError("unavailable", 503);
    },
  });
  await sync.load();
  store.selectProject(id);
  store.saveCharacter(null, {
    name: "角色",
    appearance: "外观",
    constraints: "约束",
    references: [],
    projectIds: [id],
  });
  assert.equal(await sync.remove(id), false);
  assert.equal(store.getSnapshot().activeProjectId, id);
  assert.equal(store.getSnapshot().characters.at(-1).projectIds[0], id);
  assert.equal(sync.getSnapshot().uncertain, true);
  assert.equal(await sync.remove(id), false);
  await sync.load();
  assert.equal(sync.getSnapshot().uncertain, true);
  sync.acknowledgeUncertain();
  assert.equal(sync.getSnapshot().uncertain, false);
  sync.dispose();
});
test("old list cannot overwrite a saved project even if an adapter ignores abort", async () => {
  const old = deferred();
  let loads = 0;
  const { sync, store } = harness({
    list: () =>
      ++loads === 1 ? old.promise : Promise.resolve([saved(id, "新保存")]),
    create: async () => saved(id, "新保存"),
  });
  const first = sync.load();
  assert.equal(
    await sync.save(null, { name: "新保存", description: "" }),
    true,
  );
  await tick();
  old.resolve([saved(id, "旧列表")]);
  await first;
  assert.equal(store.getSnapshot().projects[0].name, "新保存");
  sync.dispose();
});
test("out-of-order lists and dispose/reactivate reject old workspace updates", async () => {
  const a = deferred(),
    b = deferred();
  let n = 0;
  const { sync, store } = harness({
    list: () => (++n === 1 ? a.promise : b.promise),
  });
  const first = sync.load(),
    second = sync.load();
  b.resolve([saved(id, "第二次读取")]);
  await second;
  a.resolve([saved(id, "旧读取")]);
  await first;
  assert.equal(store.getSnapshot().projects[0].name, "第二次读取");
  const write = deferred();
  const h = harness({ create: () => write.promise });
  const pending = h.sync.save(null, { name: "未确认", description: "" });
  h.sync.dispose();
  write.resolve(saved());
  assert.equal(await pending, false);
  assert.equal(h.store.getSnapshot().projects.length, 0);
  assert.equal(h.sync.getSnapshot().pending, false);
  assert.equal(h.sync.getSnapshot().uncertain, true);
  sync.dispose();
});
test("remote removal clears temporary relations, cancels active run and preserves unsent draft", async () => {
  const runs = [];
  const store = new WorkspaceStore(
    undefined,
    {
      start(snapshot, publish) {
        runs.push({ snapshot, publish });
        return () => {};
      },
    },
    true,
  );
  store.replaceProjects([saved()]);
  store.selectProject(id);
  store.agent.setDraft("保留草稿");
  store.saveCharacter(null, {
    name: "引用角色",
    appearance: "外观",
    constraints: "约束",
    references: [],
    projectIds: [id],
  });
  store.agent.approve();
  store.replaceProjects([]);
  runs[0].publish({ type: "complete" });
  assert.equal(store.getSnapshot().activeProjectId, null);
  assert.equal(store.getSnapshot().characters.at(-1).projectIds.length, 0);
  assert.equal(store.getSnapshot().assets.length, 3);
  assert.equal(store.agent.getSnapshot().draft, "保留草稿");
});
test("load error does not publish fixtures or a false empty authoritative list", async () => {
  const { sync, store, calls } = harness({
    list: async () => {
      throw new ProjectRequestError("数据库不可用", 503);
    },
  });
  assert.equal(await sync.load(), false);
  assert.equal(sync.getSnapshot().status, "error");
  assert.equal(calls.length, 0);
  assert.equal(store.getSnapshot().projects.length, 0);
  sync.dispose();
});
test("project client loads every page and keeps cancellation/no-store contracts", async () => {
  const rows = Array.from({ length: 105 }, (_, i) =>
    saved(`00000000-0000-4000-8000-${String(i).padStart(12, "0")}`),
  );
  const calls = [];
  const api = createProjectAPI(workspace, async (url, options) => {
    calls.push({ url, options });
    const offset = Number(
      new URL(url, "http://localhost").searchParams.get("offset"),
    );
    return Response.json({
      items: rows.slice(offset, offset + 100),
      total: 105,
      limit: 100,
      offset,
    });
  });
  const signal = new AbortController().signal;
  assert.equal((await api.list(signal)).length, 105);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.signal, signal);
  assert.equal(calls[0].options.cache, "no-store");
});
test("changing pagination totals is an error, never a partial successful list", async () => {
  let n = 0;
  const api = createProjectAPI(workspace, async () =>
    Response.json({
      items: [saved()],
      total: ++n === 1 ? 2 : 3,
      limit: 100,
      offset: n - 1,
    }),
  );
  await assert.rejects(
    () => api.list(new AbortController().signal),
    /列表已变化/,
  );
});
const config = {
  mode: "api",
  workspaceId: workspace,
  origin: "http://127.0.0.1:8080",
};
const proxyRequest = (method = "GET", options = {}) =>
  new Request(`http://localhost:3000/api/v1/workspaces/${workspace}/projects`, {
    method,
    ...options,
  });
test("proxy preserves upstream body/status/request ID and strips browser identity headers", async () => {
  let seen;
  const response = await proxyProjects(
    proxyRequest("POST", {
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": "forged",
        Authorization: "secret",
        Cookie: "secret",
      },
      body: '{"name":"项目"}',
    }),
    workspace,
    [],
    config,
    async (url, options) => {
      seen = { url, options };
      return Response.json(saved(), {
        status: 201,
        headers: { "X-Request-ID": "upstream-id" },
      });
    },
  );
  assert.equal(response.status, 201);
  assert.equal((await response.json()).id, id);
  assert.equal(response.headers.get("X-Request-ID"), "upstream-id");
  assert.equal(seen.options.headers.Authorization, undefined);
  assert.equal(seen.options.headers["X-User-ID"], undefined);
  assert.equal(seen.options.cache, "no-store");
  assert.equal(seen.url.pathname, `/api/v1/workspaces/${workspace}/projects`);
});
test("proxy same-origin uses incoming loopback Host rather than Next internal hostname", async () => {
  const r = proxyRequest("POST", {
    headers: { Host: "127.0.0.1:3000", Origin: "http://127.0.0.1:3000" },
    body: '{"name":"a"}',
  });
  assert.equal(
    (
      await proxyProjects(r, workspace, [], config, async () =>
        Response.json(saved(), { status: 201 }),
      )
    ).status,
    201,
  );
});
test("proxy rejects arbitrary origins, workspaces, paths, large bodies and demo forwarding", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return Response.json({});
  };
  for (const origin of [
    "https://evil.example",
    "http://user:password@127.0.0.1:8080",
    "http://127.0.0.1:8080/arbitrary",
  ]) {
    assert.equal(
      (
        await proxyProjects(
          proxyRequest(),
          workspace,
          [],
          { ...config, origin },
          fetcher,
        )
      ).status,
      503,
    );
  }
  assert.equal(
    (await proxyProjects(proxyRequest(), workspace, ["bad"], config, fetcher))
      .status,
    400,
  );
  assert.equal(
    (await proxyProjects(proxyRequest(), id, [], config, fetcher)).status,
    404,
  );
  assert.equal(
    (
      await proxyProjects(
        proxyRequest("POST", {
          headers: { Origin: "http://evil.example" },
          body: "{}",
        }),
        workspace,
        [],
        config,
        fetcher,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await proxyProjects(
        proxyRequest("GET", { headers: { Host: "evil.example" } }),
        workspace,
        [],
        config,
        fetcher,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await proxyProjects(
        proxyRequest("POST", { body: "x".repeat(16385) }),
        workspace,
        [],
        config,
        fetcher,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await proxyProjects(
        proxyRequest(),
        workspace,
        [],
        { ...config, mode: "demo" },
        fetcher,
      )
    ).status,
    503,
  );
  assert.equal(calls, 0);
});
test("proxy forwards upstream errors and normalizes connection failure without secrets", async () => {
  for (const status of [400, 404, 503, 500]) {
    const r = await proxyProjects(
      proxyRequest(),
      workspace,
      [],
      config,
      async () =>
        Response.json(
          { code: "safe_error", request_id: "request" },
          { status },
        ),
    );
    assert.equal(r.status, status);
    assert.equal((await r.json()).code, "safe_error");
  }
  const r = await proxyProjects(
    proxyRequest(),
    workspace,
    [],
    config,
    async () => {
      throw new Error("secret-dsn");
    },
  );
  assert.equal(r.status, 503);
  assert(!(await r.text()).includes("secret-dsn"));
});
