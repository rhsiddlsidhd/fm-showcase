import { PREFIX_PATTERN } from "../git-hooks/naming.ts";

// Discord가 한 메시지에 허용하는 길이다.
const MAX_LENGTH = 2000;
const TITLE_PREFIX = new RegExp(
  `^(?:${PREFIX_PATTERN})(?:\\([^)]*\\))?!?:\\s*`,
);

export type ClosedIssue = {
  number: number;
  title: string;
  url: string;
  closedAt: string;
};

export type MergedPullRequest = {
  number: number;
  title: string;
  url: string;
};

type ClosedMessageInput = {
  repo: string;
  issue: ClosedIssue;
  pullRequests: MergedPullRequest[];
};

function kstDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    new Date(iso),
  );
}

function render(
  { repo, issue }: ClosedMessageInput,
  pullRequests: MergedPullRequest[],
  hidden: number,
): string {
  const lines = [
    `## ✅ ${repo} · ${kstDate(issue.closedAt)} KST`,
    "",
    `- [#${issue.number}](<${issue.url}>) **${issue.title.replace(TITLE_PREFIX, "")}**`,
  ];

  if (pullRequests.length > 0 || hidden > 0) {
    lines.push("", "**PR**", "");
    for (const { number, title, url } of pullRequests) {
      lines.push(`- [#${number}](<${url}>) ${title}`);
    }
    if (hidden > 0) lines.push(`- 외 ${hidden}건`);
  }

  return lines.join("\n");
}

export function buildClosedMessage(input: ClosedMessageInput): string {
  const sorted = [...input.pullRequests].sort((a, b) => a.number - b.number);

  for (let shown = sorted.length; shown > 0; shown--) {
    const message = render(
      input,
      sorted.slice(0, shown),
      sorted.length - shown,
    );
    if (message.length <= MAX_LENGTH) return message;
  }

  return render(input, [], sorted.length);
}
