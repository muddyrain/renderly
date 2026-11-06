const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export interface ProxyConfig {
  mode: string;
  origin: string;
  workspaceId: string;
}
export async function proxyProjects(
  request: Request,
  workspaceId: string,
  projectIds: string[],
  config: ProxyConfig,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const failure = (status: number, code: string, message: string) =>
    Response.json(
      { code, message, request_id: requestId },
      {
        status,
        headers: { "Cache-Control": "no-store", "X-Request-ID": requestId },
      },
    );
  if (config.mode !== "api")
    return failure(503, "not_connected", "当前为纯 Demo，项目 API 未连接。");
  if (
    !uuid.test(workspaceId) ||
    projectIds.length > 1 ||
    projectIds.some((id) => !uuid.test(id))
  )
    return failure(400, "invalid_request", "项目路径无效。");
  if (workspaceId.toLowerCase() !== config.workspaceId.toLowerCase())
    return failure(404, "not_found", "工作区不存在。");
  let origin: URL;
  try {
    origin = new URL(config.origin);
    if (
      !["http:", "https:"].includes(origin.protocol) ||
      !["127.0.0.1", "[::1]", "localhost"].includes(origin.hostname) ||
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    )
      throw new Error();
  } catch {
    return failure(503, "proxy_unavailable", "本地项目 API 未正确配置。");
  }
  const url = new URL(request.url);
  // Next can build Request.url with its internal hostname. Use the incoming
  // Host for same-origin checks, restricted to this local-only integration.
  let browserOrigin: URL;
  try {
    browserOrigin = new URL(
      `${url.protocol}//${request.headers.get("host") ?? url.host}`,
    );
    if (!["127.0.0.1", "[::1]", "localhost"].includes(browserOrigin.hostname))
      throw new Error();
  } catch {
    return failure(
      403,
      "origin_not_allowed",
      "Connected 工作区仅用于本地访问。",
    );
  }
  if (!["GET", "POST", "PATCH", "DELETE", "OPTIONS"].includes(request.method))
    return failure(405, "method_not_allowed", "不支持此操作。");
  if (
    request.method !== "GET" &&
    request.headers.get("origin") &&
    request.headers.get("origin") !== browserOrigin.origin
  )
    return failure(403, "origin_not_allowed", "不允许此来源。");
  let body: Uint8Array | undefined;
  if (request.method === "POST" || request.method === "PATCH") {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    if (reader) {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        length += part.value.byteLength;
        if (length > 16384) {
          await reader.cancel();
          return failure(400, "invalid_request", "项目请求体过长。");
        }
        chunks.push(part.value);
      }
    }
    body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
  }
  const target = new URL(
    `/api/v1/workspaces/${workspaceId}/projects${projectIds.length ? `/${projectIds[0]}` : ""}${url.search}`,
    origin,
  );
  try {
    const response = await fetcher(target, {
      method: request.method,
      body: body as BodyInit | undefined,
      headers: {
        "Content-Type":
          request.headers.get("content-type") ?? "application/json",
        "X-Request-ID": requestId,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(6000)]),
    });
    return new Response(
      response.status === 204 ? null : await response.arrayBuffer(),
      {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("content-type") ?? "application/json",
          "Cache-Control": "no-store",
          "X-Request-ID": response.headers.get("x-request-id") ?? requestId,
        },
      },
    );
  } catch {
    return failure(
      503,
      "dependency_unavailable",
      "项目服务暂不可用，操作结果请重新载入确认。",
    );
  }
}
