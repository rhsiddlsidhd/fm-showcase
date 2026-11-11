import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

// 외부 API 대역을 이 테스트 파일에만 연다. 핸들러는 각 테스트가 server.use()로 등록한다.
// 처리되지 않은 요청은 실제 네트워크로 나가지 않고 실패하며, 그 테스트도 실패시킨다.
export const setupTestServer = () => {
  const server = setupServer();
  const unhandledRequests: string[] = [];

  beforeAll(() => {
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
  });

  return server;
};
