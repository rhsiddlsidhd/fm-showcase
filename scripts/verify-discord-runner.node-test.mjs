import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Worker } from "node:worker_threads";
import {
  claim,
  classify,
  preflight,
  validateAuthToken,
} from "./verify-discord-runner.mjs";

test("malformed authentication fails before starting a sender", () => {
  validateAuthToken("synthetic-single-line-token");
  for (const value of [
    "",
    undefined,
    "synthetic\nwrapped",
    "synthetic\rwrapped",
  ])
    assert.throws(() => validateAuthToken(value));
});

// Real response formats: installed Discord 0.0.4 server.ts:648,651-655,690,717.
test("only exact successful MCP responses carry a message ID", () => {
  for (const operation of ["sent", "edited"])
    assert.deepEqual(
      classify({
        content: [
          { type: "text", text: `${operation} (id: 123456789012345678)` },
        ],
      }),
      { status: "success", operation, message_id: "123456789012345678" },
    );
  assert.equal(
    classify({
      isError: true,
      content: [{ type: "text", text: "sent (id: 123)" }],
    }).status,
    "uncertain",
  );
  assert.equal(classify("The message was sent (id: 123)").status, "uncertain");
});

test("definite pre-send errors and ambiguous outcomes remain distinct", () => {
  assert.equal(
    classify("reply failed: channel 123 is not allowlisted").status,
    "not_sent",
  );
  for (const response of [
    "reply failed: reply failed after 0 of 1 chunk(s) sent: timeout",
    "sent 2 parts (ids: 123, 456)",
    "edit_message failed: connection reset",
    "",
    undefined,
  ])
    assert.equal(classify(response).status, "uncertain");
});

test("concurrent attempts have exactly one successful durable claim", async () => {
  const directory = mkdtempSync(join(tmpdir(), "fm-claim-"));
  const path = join(directory, "attempt.json");
  const moduleUrl = new URL("./verify-discord-runner.mjs", import.meta.url)
    .href;
  const outcomes = await Promise.all(
    Array.from(
      { length: 8 },
      () =>
        new Promise((resolve, reject) => {
          const worker = new Worker(
            `const {parentPort}=require('node:worker_threads'); import(${JSON.stringify(moduleUrl)}).then(m=>parentPort.postMessage(m.claim(${JSON.stringify(path)}, {status:'sending'})));`,
            { eval: true },
          );
          worker.once("message", resolve);
          worker.once("error", reject);
        }),
    ),
  );
  assert.equal(outcomes.filter(Boolean).length, 1);
  assert.equal(claim(path, { status: "retry" }), false);
});

test("wrong channel, unapproved tool and altered text cannot reach Discord", () => {
  const directory = mkdtempSync(join(tmpdir(), "fm-guard-"));
  const request = {
    channel: "123",
    send_text: "probe",
    edit_text: "edited probe",
  };
  const event = {
    tool_name: "mcp__plugin_discord_discord__reply",
    tool_input: { chat_id: "123", text: "probe" },
    tool_use_id: "send",
  };
  assert.throws(() =>
    preflight(
      { ...event, tool_input: { ...event.tool_input, chat_id: "other" } },
      request,
      directory,
      process.cwd(),
    ),
  );
  assert.throws(() =>
    preflight(
      { ...event, tool_name: "Bash" },
      request,
      directory,
      process.cwd(),
    ),
  );
  assert.throws(() =>
    preflight(
      { ...event, tool_input: { ...event.tool_input, text: "other" } },
      request,
      directory,
      process.cwd(),
    ),
  );
  preflight(event, request, directory, process.cwd());
  assert.throws(() => preflight(event, request, directory, process.cwd()));
});

test("only the confirmed new message can be edited, and at most once", () => {
  const directory = mkdtempSync(join(tmpdir(), "fm-edit-"));
  const request = {
    channel: "123",
    send_text: "probe",
    edit_text: "edited probe",
  };
  const event = {
    tool_name: "mcp__plugin_discord_discord__edit_message",
    tool_input: { chat_id: "123", text: "edited probe", message_id: "456" },
  };
  assert.throws(() => preflight(event, request, directory, process.cwd()));
  writeFileSync(
    join(directory, "reply-result.json"),
    JSON.stringify({ status: "success", operation: "sent", message_id: "456" }),
  );
  assert.throws(() =>
    preflight(
      { ...event, tool_input: { ...event.tool_input, message_id: "789" } },
      request,
      directory,
      process.cwd(),
    ),
  );
  preflight(event, request, directory, process.cwd());
  assert.throws(() => preflight(event, request, directory, process.cwd()));
});
