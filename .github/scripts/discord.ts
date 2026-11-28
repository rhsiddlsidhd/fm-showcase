export async function sendToDiscord(webhookUrl: string, content: string) {
  // wait 없이 보내면 저장되지 않은 메시지도 오류 없이 성공으로 끝난다.
  const url = new URL(webhookUrl);
  url.searchParams.set("wait", "true");

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // 제목은 외부 입력이라 @everyone 같은 멘션이 알림으로 가지 않게 막는다.
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
  if (!response.ok) {
    throw new Error(`Discord 전송 실패: HTTP ${response.status}`);
  }
}
