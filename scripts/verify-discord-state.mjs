import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

const repository = process.env.GITHUB_REPOSITORY;
const run = process.env.GITHUB_RUN_ID;
const branch = `ci/verify-discord-state-${run}`;
const token = process.env.GH_TOKEN;
if (!repository || !run || !token)
  throw new Error("Missing GitHub verification environment");

async function request(path, method = "GET", body) {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  return { status: response.status, data: await response.json() };
}

const base = await request("git/ref/heads/main");
assert.equal(base.status, 200);
const created = await request("git/refs", "POST", {
  ref: `refs/heads/${branch}`,
  sha: base.data.object.sha,
});
assert.equal(
  created.status,
  201,
  "Use a fresh verification branch; do not automatically repeat old claims",
);

async function claimEvent(event, owner) {
  const path = `_verification/${event}.json`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const existing = await request(
      `contents/${path}?ref=${encodeURIComponent(branch)}`,
    );
    if (existing.status === 200) return false;
    assert.equal(existing.status, 404);
    const saved = await request(`contents/${path}`, "PUT", {
      branch,
      message:
        "ci: verify atomic report claims\n\nCo-Authored-By: Codex <noreply@openai.com>",
      content: Buffer.from(
        JSON.stringify({
          event,
          owner,
          status: "sending",
          verification_only: true,
        }),
      ).toString("base64"),
    });
    if (saved.status === 201) return true;
    if (![409, 422].includes(saved.status))
      throw new Error(`Claim failed before confirmation: HTTP ${saved.status}`);
    // Only definite API conflicts are retried, with a fresh read before writing.
    // Transport failures are not retried because ownership is then uncertain.
    await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
  }
  throw new Error("Claim conflict retry limit reached");
}

const duplicate = await Promise.all(
  ["a", "b", "c"].map((owner) => claimEvent("same-event", owner)),
);
assert.equal(
  duplicate.filter(Boolean).length,
  1,
  "Exactly one execution must acquire the same event",
);
const separate = await Promise.all(
  ["event-one", "event-two"].map((event) => claimEvent(event, event)),
);
assert.deepEqual(
  separate,
  [true, true],
  "Different event files must both survive concurrent branch updates",
);
assert.equal(
  await claimEvent("same-event", "rerun"),
  false,
  "Existing sending records block automatic retransmission",
);
for (const event of ["same-event", "event-one", "event-two"])
  assert.equal(
    (
      await request(
        `contents/_verification/${event}.json?ref=${encodeURIComponent(branch)}`,
      )
    ).status,
    200,
  );
const evidence = {
  branch,
  verification_only: true,
  duplicate_claim_winners: duplicate.filter(Boolean).length,
  separate_events_saved: separate.length,
  sending_record_blocks_rerun: true,
  passed: true,
};
writeFileSync(
  "state-verification-evidence.json",
  JSON.stringify(evidence, null, 2),
);
console.log(JSON.stringify(evidence, null, 2));
