import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Formats a verified "from" email with optional display name
 * Returns format: "Display Name" <email@domain.com>
 */
function formatVerifiedFrom(
  fromName: string | undefined,
  verifiedEmail: string,
  defaultName: string = 'Autobidder'
): string {
  // Sanitize fromName
  let displayName = (fromName || '').trim();
  
  // Strip CR/LF to prevent header injection
  displayName = displayName.replace(/[\r\n]/g, '');
  
  // Collapse multiple spaces
  displayName = displayName.replace(/\s+/g, ' ');
  
  // Use default if empty
  if (!displayName) {
    displayName = defaultName;
  }
  
  // Escape quotes if present
  if (displayName.includes('"')) {
    displayName = displayName.replace(/"/g, '\\"');
  }
  
  // Return formatted string
  return `"${displayName}" <${verifiedEmail}>`;
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

    const fromAddress = params.from 
      ? params.from 
      : formatVerifiedFrom(params.fromName, process.env.GMAIL_USER!, 'Autobidder');

    const mailOptions: any = {
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };

    if (params.replyTo) {
      mailOptions.replyTo = params.replyTo;
    }

    await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully via Gmail to:', params.to);
    return true;
  } catch (error) {
    console.error('Gmail email error:', error);
    return false;
  }
}

// Rate limiting for Resend (2 requests per second max)
let lastResendRequest = 0;
const RESEND_RATE_LIMIT_MS = 500; // 500ms between requests

// Resend.com (modern, developer-friendly)
export async function sendEmailWithResend(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured. Add RESEND_API_KEY to environment variables.');
      return false;
    }

    // Rate limiting - wait if necessary
    const now = Date.now();
    const timeSinceLastRequest = now - lastResendRequest;
    if (timeSinceLastRequest < RESEND_RATE_LIMIT_MS) {
      const waitTime = RESEND_RATE_LIMIT_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastResendRequest = Date.now();

    const fromAddress = params.from 
      ? params.from 
      : formatVerifiedFrom(params.fromName, 'noreply@autobidder.org', 'Autobidder');

    const emailPayload: any = {
      from: fromAddress,
      to: [params.to],
      subject: params.subject,
      text: params.text,
      html: params.html,
    };

    if (params.replyTo) {
      emailPayload.reply_to = params.replyTo;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (response.ok) {
      console.log('✅ Email sent successfully via Resend to:', params.to);
      return true;
    } else {
      const errorText = await response.text();
      console.error('Resend email error:', { status: response.status, body: errorText });
      
      // Check for rate limit and wait longer if needed
      if (errorText.includes('rate_limit_exceeded')) {
        console.log('⏳ Resend rate limit hit, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
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

// Prevent duplicate email sends
const recentEmails = new Map<string, number>();
const DUPLICATE_PREVENTION_MS = 2000; // 2 seconds (reduced from 5)

// Unified email sender with fallback
export async function sendEmailWithFallback(params: EmailParams): Promise<boolean> {
  // Only prevent true duplicates (same content) - allow legitimate resends with updated content
  const contentHash = `${params.to}-${params.subject}-${params.html?.substring(0, 100) || params.text?.substring(0, 100) || ''}`;
  const now = Date.now();
  const lastSent = recentEmails.get(contentHash);
  
  if (lastSent && (now - lastSent) < DUPLICATE_PREVENTION_MS) {
    console.log('🚫 Preventing duplicate email to:', params.to, 'with subject:', params.subject);
    return false; // Let callers know it was not sent
  }
  
  recentEmails.set(contentHash, now);
  
  // Clean up old entries periodically
  if (recentEmails.size > 100) {
    const cutoff = now - DUPLICATE_PREVENTION_MS;
    const entries = Array.from(recentEmails.entries());
    for (const [key, timestamp] of entries) {
      if (timestamp < cutoff) {
        recentEmails.delete(key);
      }
    }
  }

  // Try Resend first (modern, reliable)
  if (process.env.RESEND_API_KEY) {
    console.log('📧 Sending email via Resend:', { to: params.to, subject: params.subject });
    const resendSuccess = await sendEmailWithResend(params);
    if (resendSuccess) return true;
  }

  // Fall back to Gmail
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.log('📧 Sending email via Gmail:', { to: params.to, subject: params.subject });
    const gmailSuccess = await sendEmailWithGmail(params);
    if (gmailSuccess) return true;
  }

  console.error('No email provider configured. Please set up one of: RESEND_API_KEY or GMAIL_USER+GMAIL_APP_PASSWORD');
  return false;
}

export async function sendBookingNotificationEmail(params: {
  businessOwnerEmail: string;
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceDetails: string;
  notes?: string;
}): Promise<boolean> {
  const {
    businessOwnerEmail,
    businessName,
    customerName,
    customerEmail,
    customerPhone,
    appointmentDate,
    appointmentTime,
    serviceDetails,
    notes
  } = params;

  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `📅 New Appointment Booked - ${customerName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
          📅 New Appointment Scheduled!
        </h1>
        <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 16px;">
          ${businessName}
        </p>
      </div>
      
      <!-- Main content -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
          Great news! A customer has booked an appointment with you.
        </h2>
        
        <!-- Appointment Details Card -->
        <div style="background-color: #f8fafc; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            📋 Appointment Details
          </h3>
          
          <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-weight: 600; color: #374151; min-width: 120px;">📅 Date:</span>
              <span style="color: #1f2937; font-size: 16px;">${formattedDate}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-weight: 600; color: #374151; min-width: 120px;">⏰ Time:</span>
              <span style="color: #1f2937; font-size: 16px;">${appointmentTime}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-weight: 600; color: #374151; min-width: 120px;">🔧 Service:</span>
              <span style="color: #1f2937; font-size: 16px;">${serviceDetails}</span>
            </div>
          </div>
        </div>
        
        <!-- Customer Details Card -->
        <div style="background-color: #fefefe; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            👤 Customer Information
          </h3>
          
          <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-weight: 600; color: #374151; min-width: 120px;">📝 Name:</span>
              <span style="color: #1f2937; font-size: 16px;">${customerName}</span>
            </div>
            
            ${customerEmail ? `
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-weight: 600; color: #374151; min-width: 120px;">📧 Email:</span>
              <span style="color: #1f2937; font-size: 16px;">
                <a href="mailto:${customerEmail}" style="color: #2563eb; text-decoration: none;">${customerEmail}</a>
              </span>
            </div>
            ` : ''}
            
            ${customerPhone ? `
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-weight: 600; color: #374151; min-width: 120px;">📞 Phone:</span>
              <span style="color: #1f2937; font-size: 16px;">
                <a href="tel:${customerPhone}" style="color: #2563eb; text-decoration: none;">${customerPhone}</a>
              </span>
            </div>
            ` : ''}
            
            ${notes ? `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <span style="font-weight: 600; color: #374151; min-width: 120px;">💬 Notes:</span>
              <span style="color: #1f2937; font-size: 16px; line-height: 1.5;">${notes}</span>
            </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Action Items -->
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <h3 style="color: #92400e; font-size: 18px; margin-bottom: 12px;">
            📋 Next Steps
          </h3>
          <ul style="color: #92400e; margin: 0; padding-left: 18px;">
            <li style="margin-bottom: 8px;">Review the appointment details above</li>
            <li style="margin-bottom: 8px;">Contact the customer to confirm or discuss details</li>
            <li style="margin-bottom: 8px;">Add this appointment to your calendar</li>
            <li style="margin-bottom: 8px;">Prepare any materials needed for the service</li>
            <li>Send a confirmation message to the customer</li>
          </ul>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This appointment was booked through your online booking system. You can manage your availability and appointments in your Autobidder dashboard.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">
          This notification was sent by Autobidder • Your Booking Management System
        </p>
      </div>
    </div>
  `;
  
  // Use business name in the from field
  const fromName = businessName && businessName !== 'Your Business' ? businessName : 'Autobidder';
  const from = `${fromName} <noreply@autobidder.org>`;
  
  return await sendEmailWithFallback({
    to: businessOwnerEmail,
    from,
    subject,
    html
  });
}
