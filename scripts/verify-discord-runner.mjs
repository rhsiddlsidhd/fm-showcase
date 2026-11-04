import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function classify(response) {
  if (typeof response === "string") {
    try {
      return classify(JSON.parse(response));
    } catch {
      /* Text response. */
    }
  }
  const text =
    typeof response === "string"
      ? response
      : (response?.content ?? [])
          .filter((x) => x.type === "text")
          .map((x) => x.text)
          .join("\n");
  const success = /^(sent|edited) \(id: (\d+)\)$/.exec(text);
  if (success && !response?.isError)
    return { status: "success", operation: success[1], message_id: success[2] };
  if (/after \d+ of \d+|sent \d+ parts/.test(text))
    return { status: "uncertain" };
  if (
    /not allowlisted|DISCORD_BOT_TOKEN required|channel .* not found or not text-based|channel is not sendable/.test(
      text,
    )
  )
    return { status: "not_sent" };
  return { status: "uncertain" };
}

export function claim(path, value) {
  try {
    const fd = openSync(path, "wx", 0o600);
    try {
      writeFileSync(fd, JSON.stringify(value));
    } finally {
      closeSync(fd);
    }
    return true;
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
}

export function preflight(event, request, directory, cwd) {
  const input = event.tool_input ?? {};
  if (event.tool_name === "Read") {
    const allowed = [
      join(directory, "request.json"),
      "AGENTS.md",
      "CLAUDE.md",
      "README.md",
      ".claude/skills/discord-message/SKILL.md",
      ".claude/skills/discord-message/references/tools.md",
      ".claude/skills/discord-message/references/formats.md",
    ].map((p) => resolve(cwd, p));
    if (!allowed.includes(resolve(cwd, input.file_path ?? "")))
      throw new Error(
        "Read is restricted to the verification request and report instructions",
      );
    return;
  }
  const operation =
    /^mcp__(?:plugin_discord_discord|discord)__(reply|edit_message)$/.exec(
      event.tool_name,
    )?.[1];
  if (!operation || input.chat_id !== request.channel)
    throw new Error(
      "Only the configured Discord channel and report tools are allowed",
    );
  if ((input.files?.length ?? 0) || input.reply_to)
    throw new Error(
      "Attachments and threaded replies are not part of this verification",
    );
  const expected =
    operation === "reply" ? request.send_text : request.edit_text;
  if (input.text !== expected || input.text.length > 2000)
    throw new Error("Tool text must match the fixed verification request");
  if (operation === "edit_message") {
    const sent = JSON.parse(
      readFileSync(join(directory, "reply-result.json"), "utf8"),
    );
    if (
      sent.status !== "success" ||
      sent.operation !== "sent" ||
      input.message_id !== sent.message_id
    )
      throw new Error(
        "Only the message created by this verification may be edited",
      );
  }
  if (
    !claim(join(directory, `${operation}-attempt.json`), {
      status: "sending",
      tool_use_id: event.tool_use_id,
    })
  )
    throw new Error(
      "This operation was already attempted; automatic retry is blocked",
    );
}

function main(mode) {
  const directory = process.env.FM_VERIFY_DIR ?? "/tmp/fm-discord-verification";
  const load = (name) =>
    JSON.parse(readFileSync(join(directory, name), "utf8"));
  if (mode === "init") {
    if (process.env.GITHUB_RUN_ATTEMPT !== "1")
      throw new Error(
        "A rerun must first reconcile the previous Discord result; automatic resend is blocked",
      );
    for (const key of [
      "CLAUDE_AUTH_PRESENT",
      "DISCORD_BOT_TOKEN",
      "DISCORD_REPORT_CHANNEL_ID",
    ])
      if (!process.env[key])
        throw new Error(`Missing runner prerequisite: ${key}`);
    if (!/^\d{17,20}$/.test(process.env.DISCORD_REPORT_CHANNEL_ID))
      throw new Error("Invalid report channel");
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const discord = join(directory, "discord");
    mkdirSync(discord, { recursive: true, mode: 0o700 });
    writeFileSync(
      join(discord, ".env"),
      `DISCORD_BOT_TOKEN=${process.env.DISCORD_BOT_TOKEN}\n`,
      { mode: 0o600 },
    );
    writeFileSync(
      join(discord, "access.json"),
      JSON.stringify({
        dmPolicy: "disabled",
        allowFrom: [],
        groups: {
          [process.env.DISCORD_REPORT_CHANNEL_ID]: {
            requireMention: true,
            allowFrom: [],
          },
        },
        textChunkLimit: 2000,
        chunkMode: "length",
        ackReaction: "",
      }),
      { mode: 0o600 },
    );
    const date = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Seoul",
    }).format(new Date());
    const base = `## 🧪 러너 연결 검증 · fm-showcase · ${date} KST\n\nClaude Code Action → 기존 Discord MCP 경로의 검증 메시지입니다.\n기능 작업의 완료 보고가 아닙니다.\n실행: https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
    if (
      !claim(join(directory, "request.json"), {
        channel: process.env.DISCORD_REPORT_CHANNEL_ID,
        send_text: `${base}\n\n새 메시지 전송 검증`,
        edit_text: `${base}\n\n동일 메시지 수정 검증`,
      })
    )
      throw new Error("Verification request already exists");
    console.log(
      "Runner prerequisites and private Discord configuration are ready",
    );
    return;
  }
  if (mode === "pre") {
    preflight(
      JSON.parse(readFileSync(0, "utf8")),
      load("request.json"),
      directory,
      process.cwd(),
    );
    return;
  }
  if (mode === "post" || mode === "failure") {
    const event = JSON.parse(readFileSync(0, "utf8"));
    const operation = /__(reply|edit_message)$/.exec(event.tool_name)?.[1];
    if (!operation) return;
    const result =
      mode === "post" ? classify(event.tool_response) : { status: "uncertain" };
    writeFileSync(
      join(directory, `${operation}-result.json`),
      JSON.stringify({
        ...result,
        tool: event.tool_name,
        tool_use_id: event.tool_use_id,
      }),
      { mode: 0o600 },
    );
    return;
  }
  if (mode === "verify") {
    const result = {};
    for (const operation of ["reply", "edit_message"])
      result[operation] = existsSync(
        join(directory, `${operation}-result.json`),
      )
        ? load(`${operation}-result.json`)
        : {
            status: existsSync(join(directory, `${operation}-attempt.json`))
              ? "uncertain"
              : "not_sent",
          };
    result.passed =
      result.reply.status === "success" &&
      result.reply.operation === "sent" &&
      result.edit_message.status === "success" &&
      result.edit_message.operation === "edited" &&
      result.reply.message_id === result.edit_message.message_id;
    writeFileSync(
      join(directory, "evidence.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
    return;
  }
  throw new Error("Unknown verification command");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    main(process.argv[2]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = process.argv[2] === "pre" ? 2 : 1;
  }
}
