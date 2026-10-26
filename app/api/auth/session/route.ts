import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        usdtBalance: user.usdtBalance
      }
    });
  } catch (error) {
    console.error("Session lookup failed:", error);
    return NextResponse.json({ error: "Session service is unavailable." }, { status: 503 });
  }
}
