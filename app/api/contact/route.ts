import { NextResponse } from "next/server";

const MAX_MESSAGE_LENGTH = 500;
const MAX_TURNSTILE_TOKEN_LENGTH = 2_048;
const MIN_SUBMISSION_INTERVAL_MS = 60_000;
const TURNSTILE_ACTION = "contact";
const TURNSTILE_ALWAYS_PASS_TEST_SECRET =
  "1x0000000000000000000000000000000AA";
const recentSubmissions = new Map<string, number>();

function clientAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const website = typeof body.website === "string" ? body.website.trim() : "";
    const turnstileToken =
      typeof body.turnstileToken === "string" ? body.turnstileToken : "";

    // Hidden honeypot: bots commonly fill every input. Deliberately return a
    // success-shaped response so they cannot use it to tune their attacks.
    if (website) {
      return NextResponse.json({ success: true });
    }

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "Please complete every field." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid e-mail address." },
        { status: 400 },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: "Your message must be 500 characters or fewer.",
        },
        { status: 400 },
      );
    }

    const address = clientAddress(req);
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const expectedHostnames = new Set(
      (process.env.TURNSTILE_EXPECTED_HOSTNAMES || "")
        .split(",")
        .map((hostname) => hostname.trim().toLowerCase())
        .filter(Boolean),
    );
    if (!turnstileSecret || expectedHostnames.size === 0) {
      console.error(
        "Contact protection is not configured: Turnstile secret or expected hostnames are missing.",
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "The contact service is temporarily unavailable. Please e-mail contact@moodflip.coach directly.",
        },
        { status: 503 },
      );
    }

    if (
      !turnstileToken ||
      turnstileToken.length > MAX_TURNSTILE_TOKEN_LENGTH
    ) {
      return NextResponse.json(
        { success: false, error: "Please complete the security check." },
        { status: 403 },
      );
    }

    let verificationResult: {
      success?: boolean;
      action?: string;
      hostname?: string;
    };
    try {
      const verification = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          signal: AbortSignal.timeout(10_000),
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: turnstileToken,
            remoteip: address,
          }),
        },
      );
      if (!verification.ok) {
        throw new Error(`Turnstile Siteverify returned ${verification.status}`);
      }
      verificationResult = (await verification.json()) as typeof verificationResult;
    } catch (error) {
      console.error("Turnstile verification request failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: "The security check failed. Please refresh it and try again.",
        },
        { status: 403 },
      );
    }

    const verifiedHostname = verificationResult.hostname?.toLowerCase();
    const isOfficialTestKey =
      turnstileSecret === TURNSTILE_ALWAYS_PASS_TEST_SECRET;
    if (
      !verificationResult.success ||
      (!isOfficialTestKey && verificationResult.action !== TURNSTILE_ACTION) ||
      !verifiedHostname ||
      !expectedHostnames.has(verifiedHostname)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "The security check failed. Please refresh it and try again.",
        },
        { status: 403 },
      );
    }

    const lastSubmission = recentSubmissions.get(address);
    if (
      lastSubmission &&
      Date.now() - lastSubmission < MIN_SUBMISSION_INTERVAL_MS
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please wait one minute before sending another message.",
        },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
    const resendApiKey = process.env.RESEND_API_KEY;
    const contactFrom =
      process.env.CONTACT_FROM_EMAIL ||
      "MoodFlip <no-reply@moodflip.coach>";
    const contactTo =
      process.env.CONTACT_TO_EMAIL || "contact@moodflip.coach";
    if (!resendApiKey) {
      console.error(
        "Contact delivery is not configured: RESEND_API_KEY is missing.",
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "The contact service is temporarily unavailable. Please e-mail contact@moodflip.coach directly.",
        },
        { status: 503 },
      );
    }

    const delivery = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: contactFrom,
        to: [contactTo],
        reply_to: email,
        subject: `[MoodFlip contact] ${subject}`,
        text: `Name: ${name}\nE-mail: ${email}\n\n${message}`,
      }),
    });

    if (!delivery.ok) {
      console.error("Contact delivery failed:", await delivery.text());
      return NextResponse.json(
        {
          success: false,
          error:
            "We could not send your message. Please try again or e-mail contact@moodflip.coach directly.",
        },
        { status: 502 },
      );
    }

    recentSubmissions.set(address, Date.now());

    return NextResponse.json({
      success: true,
      message: "Your message has been sent to the MoodFlip team.",
    });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "We could not send your message. Please try again or e-mail contact@moodflip.coach directly.",
      },
      { status: 500 },
    );
  }
}
