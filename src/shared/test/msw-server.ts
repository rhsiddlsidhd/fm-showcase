// @ts-expect-error -- tsconfig.app.json은 브라우저 코드 기준이라 Node 타입을 싣지 않는다.
import nodeDns from "node:dns";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

// msw는 요청을 쓰기 전에 읽기부터 시작한 연결을 onUnhandledFrame을 거치지 않고 실제 네트워크로 넘긴다.
// Undici는 요청이 중단된 뒤 keep-alive 풀에 요청 없는 연결을 하나 더 열기도 해서, 그 연결이 실제 서버로 나간다.
// 대역이 켜져 있는 동안 실제 이름 조회를 실패시켜, 넘어간 연결이 외부에 닿기 전에 끊기게 한다.
const dns: { lookup: unknown } = nodeDns;

const failLookup = (hostname: string, ...args: unknown[]) => {
  const callback = args[args.length - 1] as (error: Error) => void;
  const error = Object.assign(
    new Error(`테스트 중 실제 네트워크 연결을 막았다: ${hostname}`),
    { code: "ENOTFOUND" },
  );
  queueMicrotask(() => callback(error));
};

// 외부 API 대역을 이 테스트 파일에만 연다. 핸들러는 각 테스트가 server.use()로 등록한다.
// 처리되지 않은 요청은 실제 네트워크로 나가지 않고 실패하며, 그 테스트도 실패시킨다.
export const setupTestServer = () => {
  const server = setupServer();
  const unhandledRequests: string[] = [];
  const realLookup = dns.lookup;

  beforeAll(() => {
    dns.lookup = failLookup;
    server.listen({
      onUnhandledFrame({ frame, defaults }) {
        const data = frame.data as { request?: Request } | undefined;
        unhandledRequests.push(
          data?.request
            ? `${data.request.method} ${data.request.url}`
            : String(frame.protocol),
        );
        defaults.error();
      },
    });
  });

  afterEach(() => {
    server.resetHandlers();
    const unhandled = unhandledRequests.splice(0);
    if (unhandled.length > 0) {
      throw new Error(`처리되지 않은 요청: ${unhandled.join(", ")}`);
    }
  });

  afterAll(() => {
    server.close();
    dns.lookup = realLookup;
  });

  return server;
};
