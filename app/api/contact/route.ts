import { NextResponse } from 'next/server';

const MAX_MESSAGE_LENGTH = 500;
const MIN_SUBMISSION_INTERVAL_MS = 60_000;
const recentSubmissions = new Map<string, number>();

function clientAddress(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const website = typeof body.website === 'string' ? body.website.trim() : '';

    // Hidden honeypot: bots commonly fill every input. Deliberately return a
    // success-shaped response so they cannot use it to tune their attacks.
    if (website) {
      return NextResponse.json({ success: true });
    }

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Please complete every field.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid e-mail address.' }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ success: false, error: 'Your message must be 500 characters or fewer.' }, { status: 400 });
    }

    const address = clientAddress(req);
    const lastSubmission = recentSubmissions.get(address);
    if (lastSubmission && Date.now() - lastSubmission < MIN_SUBMISSION_INTERVAL_MS) {
      return NextResponse.json(
        { success: false, error: 'Please wait one minute before sending another message.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    recentSubmissions.set(address, Date.now());

    // Log the contact message for administrative record
    console.log('[Contact Message Received]', {
      name,
      email,
      subject,
      messageLength: message.length,
      receivedAt: new Date().toISOString(),
    });

    // Delivery is intentionally conditional: returning success without a configured
    // mail provider would create false evidence that the message reached the inbox.
    const resendApiKey = process.env.RESEND_API_KEY;
    const contactFrom = process.env.CONTACT_FROM_EMAIL;
    if (!resendApiKey || !contactFrom) {
      console.error('Contact delivery is not configured: set RESEND_API_KEY and CONTACT_FROM_EMAIL.');
      return NextResponse.json(
        { success: false, error: 'The contact service is temporarily unavailable. Please e-mail support@moodflip.coach directly.' },
        { status: 503 }
      );
    }

    const delivery = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: contactFrom,
        to: ['support@moodflip.coach'],
        reply_to: email,
        subject: `[MoodFlip contact] ${subject}`,
        text: `Name: ${name}\nE-mail: ${email}\n\n${message}`,
      }),
    });

    if (!delivery.ok) {
      console.error('Contact delivery failed:', await delivery.text());
      return NextResponse.json(
        { success: false, error: 'We could not send your message. Please try again or e-mail support@moodflip.coach directly.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent to support@moodflip.coach.',
    });
  } catch (error: any) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
