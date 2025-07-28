import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

// Nodemailer with Gmail SMTP (recommended for quick setup)
export async function sendEmailWithGmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('Gmail credentials not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to environment variables.');
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // App password, not regular password
      },
    });

    await transporter.sendMail({
      from: params.from || process.env.GMAIL_USER,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log('✅ Email sent successfully via Gmail to:', params.to);
    return true;
  } catch (error) {
    console.error('Gmail email error:', error);
    return false;
  }
}

// Resend.com (modern, developer-friendly)
export async function sendEmailWithResend(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured. Add RESEND_API_KEY to environment variables.');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from || 'noreply@autobidder.org',
        to: [params.to],
        subject: params.subject,
        text: params.text,
        html: params.html,
      }),
    });

    if (response.ok) {
      console.log('✅ Email sent successfully via Resend to:', params.to);
      return true;
    } else {
      const error = await response.text();
      console.error('Resend email error:', error);
      return false;
    }
  } catch (error) {
    console.error('Resend email error:', error);
    return false;
  }
}

// AWS SES (enterprise-grade, very cheap)
export async function sendEmailWithAWSSES(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
      console.log('AWS SES credentials not configured. Add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION.');
      return false;
    }

    // Note: This would require installing @aws-sdk/client-ses
    console.log('AWS SES integration available but requires additional setup.');
    return false;
  } catch (error) {
    console.error('AWS SES email error:', error);
    return false;
  }
}

// Unified email sender with fallback
export async function sendEmailWithFallback(params: EmailParams): Promise<boolean> {
  // Try Resend first (modern, reliable)
  if (process.env.RESEND_API_KEY) {
    const resendSuccess = await sendEmailWithResend(params);
    if (resendSuccess) return true;
  }

  // Fall back to Gmail
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const gmailSuccess = await sendEmailWithGmail(params);
    if (gmailSuccess) return true;
  }

  // Fall back to SendGrid if configured
  if (process.env.SENDGRID_API_KEY) {
    try {
      const { sendEmail: sendEmailWithSendGrid } = await import('./sendgrid');
      return sendEmailWithSendGrid(params);
    } catch (error) {
      console.error('SendGrid fallback failed:', error);
    }
  }

  console.error('No email provider configured. Please set up one of: RESEND_API_KEY, GMAIL_USER+GMAIL_APP_PASSWORD, or SENDGRID_API_KEY');
  return false;
}