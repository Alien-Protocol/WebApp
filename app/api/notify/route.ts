import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL!;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // ── 1. Save to Google Sheets ──────────────────────────────────────────
    const sheetsRes = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!sheetsRes.ok) throw new Error("Failed to save to Google Sheets");

    if (!resend) throw new Error("Email provider is not configured");

    // ── 2. Send confirmation email to the SUBSCRIBER ──────────────────────
    await resend.emails.send({
      from: "Alien Protocol <hello@alien-protocol.xyz>",
      to: email,
      subject: "🛸 You're on the Alien Protocol waitlist",
      html: `
        <div style="font-family: monospace; background: #000; color: #fff; padding: 40px; border-radius: 8px; max-width: 480px; margin: 0 auto;">
          
          <h1 style="color: #fff; letter-spacing: 0.25em; font-size: 22px; margin-bottom: 8px;">
            ALIEN PROTOCOL
          </h1>
          <p style="color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 0.4em; margin-bottom: 32px;">
            BUILT FOR STELLAR
          </p>

          <h2 style="color: #fff; font-size: 20px; letter-spacing: 0.15em; margin-bottom: 16px;">
             You're on the list.
          </h2>

          <p style="color: rgba(255,255,255,0.65); font-size: 14px; line-height: 1.8; margin-bottom: 24px;">
            Thanks for signing up! We'll send you a message the moment Alien Protocol launches.
          </p>         

          <a href="https://github.com/Alien-Protocol/Alien-Gateway"
             style="display: inline-block; border: 1px solid rgba(255,255,255,0.4); 
                    color: #fff; text-decoration: none; padding: 10px 22px; 
                    font-size: 12px; letter-spacing: 0.2em;">
            VIEW ON GITHUB ↗
          </a>

          <hr style="border-color: rgba(255,255,255,0.08); margin: 32px 0;" />
          <p style="color: rgba(255,255,255,0.2); font-size: 11px; letter-spacing: 0.15em;">
            You signed up at alienprotocol.xyz — no spam, launch announcement only.
          </p>

        </div>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Notify error:", err);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}