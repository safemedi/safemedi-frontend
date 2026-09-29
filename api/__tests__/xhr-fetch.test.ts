import { createXhrFetch } from "@/api/xhr-fetch";

type XhrListener = (() => void) | null;

class MockXMLHttpRequest {
  method = "GET";
  url = "";
  async = true;
  responseType = "text";
  responseText = '{"ok":true}';
  status = 200;
  statusText = "OK";

  open(method: string, url: string, async: boolean): void {
    this.method = method;
    this.url = url;
    this.async = async;
  }

  setRequestHeader(_name: string, _value: string): void {}

  getAllResponseHeaders(): string {
    return "content-type: application/json";
  }

  send(_body: XMLHttpRequestBodyInit | null): void {
    queueMicrotask(() => {
      this.onload?.();
    });
  }

  abort(): void {}

  onload: XhrListener = null;
  onerror: XhrListener = null;
}

describe("createXhrFetch", () => {
  const originalXMLHttpRequest = global.XMLHttpRequest;

  beforeEach(() => {
    global.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
  });

  afterEach(() => {
    global.XMLHttpRequest = originalXMLHttpRequest;
  });

  it("XMLHttpRequest로 요청을 보내고 Response를 반환한다", async () => {
    const xhrFetch = createXhrFetch();

    const response = await xhrFetch("https://api.example.com/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "abc" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
