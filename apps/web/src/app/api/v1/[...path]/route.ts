import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "@/lib/api";

type RouteContext = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

async function fetchBackendResponse(
  url: URL,
  init: RequestInit,
  depth = 0,
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    redirect: "manual",
  });

  const locationHeader = response.headers.get("location");
  if (!locationHeader || !REDIRECT_STATUSES.has(response.status)) {
    return response;
  }

  if (depth >= 5) {
    return response;
  }

  const backendOrigin = new URL(API_URL).origin;
  const redirectUrl = new URL(locationHeader, url);
  if (redirectUrl.origin !== backendOrigin) {
    return response;
  }

  const nextInit: RequestInit = {
    ...init,
    headers: new Headers(init.headers),
  };

  if (
    response.status === 303 ||
    ((response.status === 301 || response.status === 302) &&
      ((init.method ?? "GET").toUpperCase() !== "GET"))
  ) {
    nextInit.method = "GET";
    nextInit.body = undefined;

    const nextHeaders = new Headers(init.headers);
    nextHeaders.delete("content-type");
    nextHeaders.delete("content-length");
    nextInit.headers = nextHeaders;
  }

  return fetchBackendResponse(redirectUrl, nextInit, depth + 1);
}

async function forwardToBackend(req: NextRequest, pathSegments: string[]) {
  const encodedPath = pathSegments
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const targetUrl = new URL(`/api/v1/${encodedPath}`, API_URL);
  targetUrl.search = req.nextUrl.search;

  const headers = new Headers(req.headers);
  const cookieHeader = req.cookies
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  } else {
    headers.delete("cookie");
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const backendResponse = await fetchBackendResponse(targetUrl, init);
  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.delete("set-cookie");

  const response = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });

  const setCookies = backendResponse.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}

async function handleProxyRequest(req: NextRequest, ctx: RouteContext) {
  const { path = [] } = await ctx.params;
  return forwardToBackend(req, path);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleProxyRequest;
export const POST = handleProxyRequest;
export const PUT = handleProxyRequest;
export const PATCH = handleProxyRequest;
export const DELETE = handleProxyRequest;
export const OPTIONS = handleProxyRequest;
export const HEAD = handleProxyRequest;