import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactFormRateLimiter, getClientIP, getRateLimitHeaders } from "@/lib/rate-limit";
import { contactSchema, safeValidate } from "@/lib/validations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Contact Form API Route
 * Demonstrates rate limiting and input validation
 * Sends email via Resend (100 free emails/day)
 * Protects against DDoS and XSS attacks
 */

const resend = new Resend(process.env.RESEND_API_KEY);
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "yadujewels@gmail.com";
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request.headers);
    const rateLimitResult = await contactFormRateLimiter.check(clientIP);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = safeValidate(contactSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validation.data;

    // Store contact message in database
    const supabase = await createServerSupabaseClient();
    
    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert({
        name,
        email,
        subject,
        message,
        ip_address: clientIP,
        created_at: new Date().toISOString(),
      } as never);

    if (dbError) {
      // Log error but don't expose details to client
      console.error("Database error:", dbError);
      // Continue to send email even if DB fails
    }

    // Send email notification via Resend
    try {
      const { error: emailError } = await resend.emails.send({
        from: "YaduJewels Contact <onboarding@resend.dev>", // Use verified domain in production
        to: CONTACT_EMAIL,
        replyTo: email,
        subject: `[YaduJewels Contact] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #D4AF37, #B8860B); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">
                Contact Details
              </h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">Name:</td>
                  <td style="padding: 10px 0; color: #333;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 10px 0; color: #333;">
                    <a href="mailto:${email}" style="color: #D4AF37;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">Subject:</td>
                  <td style="padding: 10px 0; color: #333;">${subject}</td>
                </tr>
              </table>
              
              <h3 style="color: #333; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-top: 30px;">
                Message
              </h3>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                <p style="color: #333; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #888; margin: 0; font-size: 12px;">
                This email was sent from the YaduJewels contact form
              </p>
            </div>
          </div>
        `,
      });

      if (emailError) {
        console.error("Resend email error:", emailError);
      }
    } catch (emailErr) {
      console.error("Failed to send email:", emailErr);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      { success: true, message: "Thank you for your message!" },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Block other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
