// app/api/subscribe/route.ts
//
// Email capture stub for the footer "Stay in the loop" form.
//
// TODO: wire to your email provider before launch.
// Recommended options:
//   - Resend (resend.com) — `npm install resend`
//   - ConvertKit — REST API, no npm package needed
//   - Loops.so — purpose-built for SaaS newsletters
//
// Pattern:
//   const resend = new Resend(process.env.RESEND_API_KEY);
//   await resend.contacts.create({ email, audienceId: process.env.RESEND_AUDIENCE_ID });

import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // TODO: wire to email provider
    console.log(`[subscribe] New email capture: ${email}`);

    return NextResponse.json(
      { message: "Thanks — you're on the list." },
      { status: 501 }, // 501 = Not Implemented, honest signal to the team this isn't wired yet
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
