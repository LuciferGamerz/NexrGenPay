import { NextResponse } from "next/server";

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.APP_ORIGIN;

  if (!origin || (expectedOrigin && origin !== expectedOrigin)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  try {
    if (new URL(origin).origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Request origin is invalid." }, { status: 403 });
  }

  return null;
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
