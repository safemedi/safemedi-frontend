/**
 * iOS/Android에서 global fetch(URLSession)가 실패할 때 XMLHttpRequest로 요청합니다.
 * Safari(WKWebView)는 되는데 RN fetch만 실패하는 경우에 사용합니다.
 */
const UNSAFE_REQUEST_HEADERS = new Set([
  "accept-charset",
  "accept-encoding",
  "access-control-request-headers",
  "access-control-request-method",
  "connection",
  "content-length",
  "cookie",
  "cookie2",
  "date",
  "dnt",
  "expect",
  "host",
  "keep-alive",
  "origin",
  "referer",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "via",
  "user-agent",
]);

function canSetRequestHeader(name: string): boolean {
  return !UNSAFE_REQUEST_HEADERS.has(name.toLowerCase());
}
function parseResponseHeaders(raw: string | null): Headers {
  const headers = new Headers();
  if (!raw) {
    return headers;
  }

  for (const line of raw.split("\r\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const name = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (name) {
      headers.append(name, value);
    }
  }

  return headers;
}

async function readRequestBody(request: Request): Promise<XMLHttpRequestBodyInit | null> {
  if (request.method === "GET" || request.method === "HEAD") {
    return null;
  }

  const text = await request.text();
  return text.length > 0 ? text : null;
}

export function createXhrFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    const body = await readRequestBody(request);

    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(request.method, request.url, true);
      xhr.responseType = "text";

      request.headers.forEach((value, key) => {
        if (canSetRequestHeader(key)) {
          xhr.setRequestHeader(key, value);
        }
      });

      const cleanupAbortListener = (): void => {
        request.signal?.removeEventListener("abort", handleAbort);
      };

      const handleAbort = (): void => {
        xhr.abort();
        cleanupAbortListener();
        reject(new DOMException("The operation was aborted.", "AbortError"));
      };

      if (request.signal?.aborted) {
        handleAbort();
        return;
      }

      request.signal?.addEventListener("abort", handleAbort);

      xhr.onload = () => {
        cleanupAbortListener();
        resolve(
          new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: parseResponseHeaders(xhr.getAllResponseHeaders()),
          }),
        );
      };

      xhr.onerror = () => {
        cleanupAbortListener();
        const detail =
          xhr.status === 0
            ? `Network request failed (status 0) for ${request.method} ${request.url}`
            : "Network request failed";
        reject(new TypeError(detail));
      };

      xhr.send(body);
    });
  };
}
