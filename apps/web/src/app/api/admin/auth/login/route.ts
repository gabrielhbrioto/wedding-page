import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "@/lib/api";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const backendResponse = await fetch(`${API_URL}/api/v1/admin/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  const response = new NextResponse(await backendResponse.text(), {
    status: backendResponse.status,
    headers: {
      "Content-Type":
        backendResponse.headers.get("Content-Type") ?? "application/json",
    },
  });

  const cookies = backendResponse.headers.getSetCookie?.() ?? [];
  for (const cookie of cookies) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}