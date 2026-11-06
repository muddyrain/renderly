import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { DemoAgent, createDemoAdapter, canSendPrompt } = await import(
  pathToFileURL(
    path.join(process.env.RENDERLY_STUDIO_TEST_BUILD, "lib/demo/demo-agent.js"),
  ).href
);
const { selectedArtwork } = await import(
  pathToFileURL(
    path.join(
      process.env.RENDERLY_STUDIO_TEST_BUILD,
      "lib/demo/studio-fixtures.js",
    ),
  ).href
);

function harness(preset = true) {
  const runs = [];
  const agent = new DemoAgent(
    {
      start(snapshot, publish) {
        const run = { snapshot, publish, cancelled: false };
        runs.push(run);
        return () => {
          run.cancelled = true;
        };
      },
    },
    preset,
  );
  return { agent, runs };
}

test("sending only prepares a revision; double approval starts one execution", () => {
  const { agent, runs } = harness(false);
  agent.setDraft("建立一组自然风景方向");
  assert.equal(agent.send(), true);
  assert.equal(agent.send(), false);
  assert.equal(runs.length, 0);
  assert.equal(agent.getSnapshot().phase, "awaiting_approval");
  assert.equal(agent.approve(), true);
  assert.equal(agent.approve(), false);
  agent.setDraft("第二个需求");
  assert.equal(agent.send(), false);
  assert.equal(runs.length, 1);
});

test("revision changes invalidate approval; execution captures immutable current brief, ratio and references", () => {
  const { agent, runs } = harness();
  const brief = {
    ...agent.getSnapshot().brief,
    goal: "新的目标",
    ratio: "16:9",
    references: ["mountain"],
  };
  agent.applyBrief(brief);
  assert.equal(agent.getSnapshot().revision, 2);
  assert.equal(agent.getSnapshot().phase, "awaiting_approval");
  assert.equal(runs.length, 0);
  agent.approve();
  brief.references.push("forest");
  assert.deepEqual(runs[0].snapshot.brief.references, ["mountain"]);
  assert.equal(runs[0].snapshot.brief.goal, "新的目标");
  assert.equal(runs[0].snapshot.brief.ratio, "16:9");
  assert.equal(Object.isFrozen(runs[0].snapshot.brief), true);
  assert.equal(agent.applyBrief({ ...brief, goal: "运行中修改" }), false);
});

test("queued completion after cancellation cannot publish success; retry requires approval", () => {
  const { agent, runs } = harness();
  agent.approve();
  agent.cancel();
  runs[0].publish({ type: "complete" });
  assert.equal(runs[0].cancelled, true);
  assert.equal(agent.getSnapshot().phase, "cancelled");
  assert.equal(agent.getSnapshot().result.source, "preset");
  agent.review();
  assert.equal(runs.length, 1);
  agent.approve();
  runs[0].publish({ type: "failure", message: "late old failure" });
  runs[1].publish({ type: "complete" });
  assert.equal(agent.getSnapshot().phase, "completed");
  assert.equal(agent.getSnapshot().result.snapshot.id, runs[1].snapshot.id);
});

test("new session atomically clears draft, references, result, choices and old execution", () => {
  const { agent, runs } = harness();
  agent.selectVersion("v2");
  agent.selectVariant("clear-ridge");
  agent.setDraft("unfinished draft");
  agent.approve();
  agent.reset();
  runs[0].publish({ type: "step", index: 2 });
  runs[0].publish({ type: "complete" });
  const state = agent.getSnapshot();
  assert.equal(state.session, 2);
  assert.equal(state.phase, "idle");
  assert.equal(state.draft, "");
  assert.equal(state.brief, null);
  assert.equal(state.result, null);
  assert.equal(state.error, null);
  assert.deepEqual(state.messages, []);
  assert.deepEqual(state.selections, {});
});

test("failure never publishes completed; an old failed run cannot overwrite a new run", () => {
  const { agent, runs } = harness();
  agent.approve();
  runs[0].publish({ type: "failure", message: "controlled failure" });
  runs[0].publish({ type: "complete" });
  assert.equal(agent.getSnapshot().phase, "failed");
  assert.equal(agent.getSnapshot().result.source, "preset");
  agent.review();
  agent.approve();
  runs[1].publish({ type: "complete" });
  runs[0].publish({ type: "failure", message: "late" });
  assert.equal(agent.getSnapshot().phase, "completed");
  assert.equal(agent.getSnapshot().error, null);
});

test("real demo adapter uses cancellable deterministic clock and dispose silences queued callbacks", () => {
  const jobs = [];
  const clock = {
    schedule(callback, delay) {
      const job = { callback, delay, cancelled: false };
      jobs.push(job);
      return () => {
        job.cancelled = true;
      };
    },
  };
  const agent = new DemoAgent(createDemoAdapter(clock));
  let notifications = 0;
  agent.subscribe(() => notifications++);
  agent.approve();
  assert.deepEqual(
    jobs.map((job) => job.delay),
    [600, 1200, 2100],
  );
  jobs[0].callback();
  assert.equal(agent.getSnapshot().steps[1], "active");
  agent.dispose();
  const before = notifications;
  jobs[2].callback();
  assert.equal(notifications, before);
  assert.equal(
    jobs.every((job) => job.cancelled),
    true,
  );
});

test("real adapter deterministic failure cancels pending success", () => {
  const jobs = [];
  const agent = new DemoAgent(
    createDemoAdapter({
      schedule(callback) {
        const job = { callback, cancelled: false };
        jobs.push(job);
        return () => {
          job.cancelled = true;
        };
      },
    }),
  );
  agent.setScenario("failure");
  agent.approve();
  jobs[1].callback();
  jobs[2].callback();
  assert.equal(agent.getSnapshot().phase, "failed");
  assert.equal(
    jobs.every((job) => job.cancelled),
    true,
  );
});

test("composer guard handles whitespace, boundary, composition, 229 and running equally", () => {
  assert.equal(canSendPrompt("  \n", "idle"), false);
  assert.equal(canSendPrompt("字".repeat(4000), "idle"), true);
  assert.equal(canSendPrompt("字".repeat(4001), "idle"), false);
  assert.equal(canSendPrompt("中文", "idle", true), false);
  assert.equal(canSendPrompt("中文", "idle", false, 229), false);
  assert.equal(canSendPrompt("中文", "running"), false);
  const { agent } = harness(false);
  agent.setDraft("确认中文");
  assert.equal(agent.send(true), false);
  assert.equal(agent.send(false, 229), false);
  assert.equal(agent.getSnapshot().messages.length, 0);
});

test("versions actually change image/parameters and selections stay scoped to asset", () => {
  const { agent } = harness();
  const v1 = selectedArtwork(agent.getSnapshot());
  agent.selectVersion("v2");
  const v2 = selectedArtwork(agent.getSnapshot());
  assert.notEqual(v1.image.src, v2.image.src);
  assert.notEqual(v1.version.prompt, v2.version.prompt);
  agent.selectAsset("forest-study");
  assert.equal(selectedArtwork(agent.getSnapshot()).image.id, "forest");
  agent.selectAsset("landscape-study");
  assert.equal(selectedArtwork(agent.getSnapshot()).version.id, "v2");
});

test("adapter startup errors become readable failures rather than escaping the UI", () => {
  const agent = new DemoAgent({
    start() {
      throw new Error("adapter unavailable");
    },
  });
  assert.doesNotThrow(() => agent.approve());
  assert.equal(agent.getSnapshot().phase, "failed");
  assert.match(agent.getSnapshot().error, /本地演示/);
});

test("synchronously completed adapters still have their returned cleanup invoked", () => {
  let cleaned = false;
  const agent = new DemoAgent({
    start(_, publish) {
      publish({ type: "complete" });
      return () => {
        cleaned = true;
      };
    },
  });
  agent.approve();
  assert.equal(agent.getSnapshot().phase, "completed");
  assert.equal(cleaned, true);
});
