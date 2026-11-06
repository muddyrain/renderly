import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
const moduleAt = (name) =>
  import(
    pathToFileURL(
      path.join(process.env.RENDERLY_STUDIO_TEST_BUILD, `lib/demo/${name}.js`),
    ).href
  );
const { WorkspaceStore, filteredAssets, assetArtwork, comparisonArtwork } =
  await moduleAt("workspace-store");
const { initialWorkspace } = await moduleAt("workspace-fixtures");
const { effectiveReducedMotion } = await moduleAt("workspace-defaults");
function harness(empty = false) {
  const runs = [];
  const store = new WorkspaceStore(initialWorkspace(empty), {
    start(snapshot, publish) {
      const run = { snapshot, publish, cancelled: false };
      runs.push(run);
      return () => {
        run.cancelled = true;
      };
    },
  });
  return { store, agent: store.agent, runs };
}
const filters = { query: "", projectId: "", category: "", favorites: false };
test("project validation, rename, Chinese/long names and repeat operations are deterministic", () => {
  const { store } = harness();
  assert.equal(store.createProject(" ", ""), false);
  assert.equal(store.createProject("字".repeat(121), ""), false);
  const id = store.createProject("中文" + "a".repeat(118), "新项目");
  assert.equal(
    store.getSnapshot().assets.filter((a) => a.projectId === id).length,
    0,
  );
  assert.equal(store.renameProject(id, "更名", "新的描述"), true);
  assert.equal(
    store.getSnapshot().projects.find((p) => p.id === id).name,
    "更名",
  );
  assert.equal(store.deleteProject(id), true);
  assert.equal(store.deleteProject(id), false);
  assert.equal(store.renameProject(id, "已删除", ""), false);
});
test("deleting active project orphans assets, retains characters and rejects late completion", () => {
  const { store, agent, runs } = harness();
  store.selectProject("woodland");
  agent.setDraft("未发送草稿");
  agent.approve();
  store.deleteProject("woodland");
  runs[0].publish({ type: "complete" });
  const state = store.getSnapshot();
  assert.equal(state.activeProjectId, null);
  assert.equal(
    state.assets.find((a) => a.id === "sample-forest").projectId,
    null,
  );
  assert.deepEqual(state.characters[0].projectIds, []);
  assert.equal(agent.getSnapshot().draft, "未发送草稿");
  assert.equal(state.assets.length, 3);
  assert.equal(runs[0].cancelled, true);
});
test("gallery combines filters and favorites by stable asset ID; versions change pixels and prompt", () => {
  const { store } = harness();
  store.toggleFavorite("sample-ridge");
  assert.equal(
    filteredAssets(store.getSnapshot(), {
      ...filters,
      query: "自然光景",
      category: "风景",
      projectId: "nature",
      favorites: true,
    }).length,
    1,
  );
  assert.equal(
    filteredAssets(store.getSnapshot(), {
      ...filters,
      query: "自然光景",
      category: "风景",
      projectId: "woodland",
      favorites: true,
    }).length,
    0,
  );
  const old = assetArtwork(store.getSnapshot().assets[0]);
  assert.equal(store.selectAssetVersion("sample-ridge", "missing"), false);
  assert.equal(store.selectAssetVersion("sample-ridge", "v2"), true);
  const next = assetArtwork(store.getSnapshot().assets[0]);
  assert.notEqual(old.image.src, next.image.src);
  assert.notEqual(old.version.prompt, next.version.prompt);
  assert.equal(store.getSnapshot().assets[0].favorite, true);
});
test("completed runs append once, with approval-time project/model/ratio/artwork, even after observer updates", () => {
  const { store, agent, runs } = harness();
  agent.approve();
  const snapshot = runs[0].snapshot;
  agent.selectVersion("v2");
  store.renameProject("nature", "项目后来更名", "");
  runs[0].publish({ type: "complete" });
  runs[0].publish({ type: "complete" });
  agent.setDraft("后续草稿");
  agent.activate();
  const results = store.getSnapshot().assets.filter((a) => a.source === "demo");
  assert.equal(results.length, 1);
  assert.equal(results[0].snapshot, snapshot);
  assert.equal(results[0].selection.imageId, "mountain");
  assert.equal(agent.getSnapshot().assetId, snapshot.artwork.assetId);
  assert.equal(
    agent.getSnapshot().selections[snapshot.artwork.assetId].variantId,
    snapshot.artwork.variantId,
  );
  assert.equal(results[0].projectId, "nature");
  assert.equal(snapshot.context.project.name, "自然光景提案");
  assert.equal(Object.isFrozen(snapshot.context.model), true);
  assert.equal(Object.isFrozen(snapshot.artwork), true);
  store.removeAsset(results[0].id);
  agent.setDraft("不会复活删除结果");
  assert.equal(
    store.getSnapshot().assets.filter((a) => a.source === "demo").length,
    0,
  );
});
test("asset intent is one-shot, preserves draft, imports exact selection and project, invalidates approval", () => {
  const { store, agent, runs } = harness();
  agent.setDraft("保留我的草稿");
  agent.approve();
  const asset = store.getSnapshot().assets[1];
  assert.equal(
    store.queueIntent({
      kind: "asset",
      id: asset.id,
      selection: { ...asset.selection },
    }),
    true,
  );
  assert.equal(store.consumeIntent(), true);
  assert.equal(store.consumeIntent(), false);
  runs[0].publish({ type: "complete" });
  assert.equal(store.getSnapshot().assets.length, 3);
  assert.equal(agent.getSnapshot().draft, "保留我的草稿");
  assert.deepEqual(agent.getSnapshot().brief.references, ["meadow"]);
  assert.equal(
    agent.getSnapshot().selections["landscape-study"].versionId,
    "v2",
  );
  assert.equal(agent.getSnapshot().phase, "awaiting_approval");
  assert.equal(store.getSnapshot().pendingIntent, null);
});
test("character copies are detached from later edits/deletion and project links are cleaned", () => {
  const { store, agent, runs } = harness();
  const character = store.getSnapshot().characters[0];
  store.queueIntent({ kind: "character", id: character.id });
  store.consumeIntent();
  agent.approve();
  const approved = runs[0].snapshot;
  assert.match(approved.brief.subject, /林间旅人/);
  assert.deepEqual(approved.brief.references, ["forest"]);
  store.saveCharacter(character.id, {
    ...character,
    appearance: "全新的外观",
    references: [],
  });
  store.deleteCharacter(character.id);
  runs[0].publish({ type: "complete" });
  assert.match(approved.brief.subject, /深灰外套/);
  assert.deepEqual(approved.brief.references, ["forest"]);
  assert.equal(store.deleteCharacter(character.id), false);
  assert.equal(
    store.queueIntent({ kind: "character", id: character.id }),
    false,
  );
});
test("removed references cannot remain queued, and invalid selections are rejected", () => {
  const { store } = harness();
  const asset = store.getSnapshot().assets[0];
  assert.equal(
    store.queueIntent({
      kind: "asset",
      id: asset.id,
      selection: { ...asset.selection, versionId: "bad" },
    }),
    false,
  );
  store.queueIntent({
    kind: "asset",
    id: asset.id,
    selection: asset.selection,
  });
  store.removeAsset(asset.id);
  assert.equal(store.consumeIntent(), false);
  assert.equal(store.toggleFavorite(asset.id), false);
  assert.equal(store.selectAssetVersion(asset.id, "v1"), false);
});
test("new Studio session keeps workspace but uses current ratio, with unique result IDs", () => {
  const { store, agent, runs } = harness();
  agent.approve();
  runs[0].publish({ type: "complete" });
  const first = store.getSnapshot().assets.at(-1).id;
  store.toggleFavorite("sample-ridge");
  store.applyPreferences({
    ratio: "1:1",
    density: "compact",
    motion: "reduce",
  });
  assert.equal(agent.getSnapshot().brief.ratio, "3:2");
  agent.reset(false);
  assert.equal(agent.getSnapshot().brief, null);
  agent.setDraft("新会话目标");
  agent.send();
  assert.equal(agent.getSnapshot().brief.ratio, "1:1");
  agent.approve();
  runs[1].publish({ type: "complete" });
  assert.notEqual(first, store.getSnapshot().assets.at(-1).id);
  assert.equal(store.getSnapshot().assets[0].favorite, true);
  assert.equal(store.getSnapshot().projects.length, 2);
  assert.equal(runs[0].snapshot.brief.ratio, "3:2");
});
test("model config validates, affects subsequent plans, and leaves immutable historical snapshots", () => {
  const { store, agent, runs } = harness();
  agent.approve();
  runs[0].publish({ type: "complete" });
  const old = runs[0].snapshot;
  for (const detail of [0, 11, 2.2, NaN])
    assert.equal(store.applyModel({ modelId: "study", detail }), false);
  assert.equal(store.applyModel({ modelId: "bad", detail: 5 }), false);
  assert.equal(store.applyModel({ modelId: "study", detail: 8 }), true);
  agent.approve();
  assert.equal(runs[1].snapshot.context.model.modelId, "study");
  assert.equal(runs[1].snapshot.context.model.detail, 8);
  assert.equal(old.context.model.modelId, "scenic");
  assert.equal(old.context.model.detail, 5);
});
test("empty workspace and model recovery are executable, and fixture reset silences previous runs", () => {
  const { store, agent, runs } = harness();
  agent.approve();
  store.loadFixture(true);
  runs[0].publish({ type: "complete" });
  assert.equal(store.getSnapshot().assets.length, 0);
  assert.equal(store.getSnapshot().models.length, 0);
  agent.setDraft("空模型计划");
  agent.send();
  assert.equal(agent.approve(), false);
  store.resetModels();
  assert.equal(agent.approve(), true);
  runs[1].publish({ type: "complete" });
  assert.equal(store.getSnapshot().assets.length, 1);
  assert.equal(store.getSnapshot().assets[0].projectId, null);
  store.loadFixture(false);
  assert.equal(store.getSnapshot().assets.length, 3);
});
test("preferences validate and effective motion always respects system reduce", () => {
  const { store } = harness();
  const before = store.getSnapshot().preferences;
  assert.equal(store.applyPreferences({ ...before, ratio: "invalid" }), false);
  assert.equal(store.getSnapshot().preferences, before);
  assert.equal(effectiveReducedMotion(false, "system"), false);
  assert.equal(effectiveReducedMotion(false, "reduce"), true);
  assert.equal(effectiveReducedMotion(true, "system"), true);
  assert.equal(effectiveReducedMotion(true, "reduce"), true);
  store.applyPreferences({
    ratio: "9:16",
    density: "compact",
    motion: "reduce",
  });
  store.resetPreferences();
  assert.deepEqual(store.getSnapshot().preferences, {
    ratio: "3:2",
    density: "comfortable",
    motion: "system",
  });
});
test("a fresh store restores fixtures without sharing mutable arrays with seed or previous sessions", () => {
  const seed = initialWorkspace();
  const store = new WorkspaceStore(seed);
  store.toggleFavorite("sample-ridge");
  assert.equal(seed.assets[0].favorite, false);
  assert.equal(new WorkspaceStore().getSnapshot().assets[0].favorite, false);
  assert.equal(
    store.saveCharacter(null, {
      name: "",
      appearance: "",
      constraints: "",
      references: [],
      projectIds: [],
    }),
    false,
  );
});

test("renaming a project synchronizes current plan metadata without rewriting approved snapshots", () => {
  const { store, agent, runs } = harness();
  store.renameProject("nature", "新的项目名", "");
  assert.equal(agent.getSnapshot().context.project.name, "新的项目名");
  agent.approve();
  const approved = runs[0].snapshot;
  store.renameProject("nature", "再次更名", "");
  assert.equal(agent.getSnapshot().phase, "running");
  assert.equal(agent.getSnapshot().context.project.name, "再次更名");
  assert.equal(approved.context.project.name, "新的项目名");
  runs[0].publish({ type: "complete" });
  assert.equal(
    store.getSnapshot().assets.at(-1).snapshot.context.project.name,
    "新的项目名",
  );
});

test("comparison uses a different preset version of the same asset, and single-version assets have no comparison", () => {
  const { store } = harness();
  const asset = store.getSnapshot().assets[0];
  const before = comparisonArtwork(asset);
  assert.notEqual(before.version.id, asset.selection.versionId);
  assert.notEqual(before.image.id, asset.selection.imageId);
  assert.equal(comparisonArtwork(store.getSnapshot().assets[2]), null);
});

test("changing/resetting default model during a run affects only the next plan", () => {
  const { store, agent, runs } = harness();
  store.applyModel({ modelId: "study", detail: 8 });
  agent.approve();
  const approved = runs[0].snapshot;
  store.applyModel({ modelId: "scenic", detail: 2 });
  store.resetModels();
  assert.equal(agent.getSnapshot().phase, "running");
  assert.equal(runs[0].cancelled, false);
  assert.equal(approved.context.model.modelId, "study");
  assert.equal(approved.context.model.detail, 8);
  runs[0].publish({ type: "complete" });
  assert.equal(
    store.getSnapshot().assets.filter((a) => a.source === "demo").length,
    1,
  );
  agent.setDraft("下一份计划");
  agent.send();
  assert.equal(agent.getSnapshot().context.model.modelId, "scenic");
  assert.equal(agent.getSnapshot().context.model.detail, 5);
});

test("changing context after failure removes the obsolete alert and preserves the draft", () => {
  const { store, agent, runs } = harness();
  agent.setDraft("保留草稿");
  agent.approve();
  runs[0].publish({ type: "failure", message: "受控的旧错误" });
  assert.equal(agent.getSnapshot().error, "受控的旧错误");
  store.selectProject("woodland");
  assert.equal(agent.getSnapshot().phase, "awaiting_approval");
  assert.equal(agent.getSnapshot().error, null);
  assert.equal(agent.getSnapshot().draft, "保留草稿");
});
