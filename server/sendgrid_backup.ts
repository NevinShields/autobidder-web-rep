import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@pricebuilder.pro';
const FROM_NAME = 'PriceBuilder Pro';

export interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const message: any = {
      to: params.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: params.subject,
    };

    if (params.templateId) {
      message.templateId = params.templateId;
      if (params.dynamicTemplateData) {
        message.dynamicTemplateData = params.dynamicTemplateData;
      }
    } else {
      if (params.html) {
        message.html = params.html;
      }
      if (params.text) {
        message.text = params.text;
      }
    }

    await mailService.send(message);
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Welcome email for new users
export async function sendWelcomeEmail(
  userEmail: string, 
  firstName: string, 
  businessName?: string
): Promise<boolean> {
  const subject = `Welcome to PriceBuilder Pro, ${firstName}!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to PriceBuilder Pro</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PriceBuilder Pro!</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${firstName}! 👋</h2>
        
        <p>We're thrilled to have you join PriceBuilder Pro! ${businessName ? `We can't wait to help ${businessName} transform your pricing process.` : 'We can\'t wait to help you transform your pricing process.'}</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">🚀 What's Next?</h3>
          <ul style="padding-left: 20px;">
            <li><strong>Complete Your Setup:</strong> Finish your onboarding to unlock all features</li>
            <li><strong>Create Your First Calculator:</strong> Build a pricing tool in minutes</li>
            <li><strong>Customize Your Brand:</strong> Match your business style and colors</li>
            <li><strong>Start Capturing Leads:</strong> Embed calculators on your website</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DOMAIN || 'https://localhost:5000'}/onboarding" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Continue Setup →
          </a>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>💡 Pro Tip:</strong> Check out our getting started guide to make the most of your first week!</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          Need help? Reply to this email or visit our support center.<br>
          Happy building!<br><br>
          <strong>The PriceBuilder Pro Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html
  });
}

// Onboarding completion email
export async function sendOnboardingCompleteEmail(
  userEmail: string,
  firstName: string,
  businessName?: string
): Promise<boolean> {
  const subject = "🎉 You're all set up with PriceBuilder Pro!";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Setup Complete</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">You're Ready to Rock, ${firstName}!</h2>
        
        <p>${businessName ? `${businessName} is` : 'You are'} now fully set up with PriceBuilder Pro! Your pricing calculators are ready to start generating leads.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4CAF50;">✅ What You've Accomplished:</h3>
          <ul style="padding-left: 20px;">
            <li>✓ Account setup complete</li>
            <li>✓ Business information configured</li>
            <li>✓ First pricing calculator created</li>
            <li>✓ Design customized to your brand</li>
            <li>✓ Embed code generated</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DOMAIN || 'https://localhost:5000'}/dashboard" 
             style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
            View Dashboard
          </a>
          <a href="${process.env.DOMAIN || 'https://localhost:5000'}/embed-form" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Preview Form
          </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; font-size: 14px;"><strong>🚀 Next Steps:</strong> Share your calculator link and start capturing leads from your website visitors!</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          Questions? We're here to help you succeed.<br>
          Keep building amazing pricing experiences!<br><br>
          <strong>The PriceBuilder Pro Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html
  });
}

// Subscription confirmation email
export async function sendSubscriptionConfirmationEmail(
  userEmail: string,
  firstName: string,
  planName: string,
  billingPeriod: 'monthly' | 'yearly',
  amount: number
): Promise<boolean> {
  const subject = `Welcome to PriceBuilder Pro ${planName}!`;
  
  const formattedAmount = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Confirmed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Subscription Confirmed! 🎊</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Welcome to the ${planName} plan, ${firstName}!</h2>
        
        <p>Your subscription is now active and you have access to all your ${planName} features.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
          <h3 style="margin-top: 0; color: #667eea;">📋 Subscription Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Plan:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">${planName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Billing:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">${formattedAmount} ${billingPeriod}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Status:</strong></td>
              <td style="padding: 8px 0; text-align: right; color: #4CAF50;"><strong>Active</strong></td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DOMAIN || 'https://localhost:5000'}/dashboard" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
            Access Dashboard
          </a>
          <a href="${process.env.DOMAIN || 'https://localhost:5000'}/billing" 
             style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Manage Billing
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          Need help getting started? Check out our tutorials or contact support.<br>
          Thank you for choosing PriceBuilder Pro!<br><br>
          <strong>The PriceBuilder Pro Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html
  });
}

// New lead notification email for single service leads
// Password reset email
export async function sendPasswordResetEmail(
  userEmail: string,
  firstName: string,
  resetLink: string
): Promise<boolean> {
  const subject = "Reset Your PriceBuilder Pro Password";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${firstName},</h2>
        
        <p>We received a request to reset your password for your PriceBuilder Pro account.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
          <p style="margin: 0; color: #666;">Click the button below to reset your password:</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);">
            Reset Password
          </a>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>⚠️ Security Notice:</strong> This link will expire in 15 minutes for your security.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="word-break: break-all; color: #667eea;">${resetLink}</span>
        </p>
        
        <p style="font-size: 14px; color: #666;">
          <strong>The PriceBuilder Pro Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html
  });
}

// ======================== BUSINESS OWNER EMAIL NOTIFICATIONS ========================

// 1. New lead notification for single service leads
export async function sendNewLeadNotification(
  ownerEmail: string,
  lead: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    notes?: string;
    formulaName: string;
    calculatedPrice: number;
    variables: Record<string, any>;
    createdAt: Date;
  }
): Promise<boolean> {
  const subject = `🚨 New Lead: ${lead.name} - ${lead.formulaName}`;
  
  const formattedPrice = (lead.calculatedPrice / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const formatVariables = (variables: Record<string, any>) => {
    return Object.entries(variables)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('');
  };

  const leadPageUrl = `${process.env.DOMAIN || 'https://localhost:5000'}/leads`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Lead Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚨 New Lead Alert!</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">New ${lead.formulaName} Inquiry</h2>
        
        <p>You have a new lead inquiry for <strong>${lead.formulaName}</strong> with an estimated value of <strong style="color: #10b981;">${formattedPrice}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #10b981;">👤 Customer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${lead.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${lead.email}" style="color: #10b981;">${lead.email}</a></td>
            </tr>
            ${lead.phone ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><a href="tel:${lead.phone}" style="color: #10b981;">${lead.phone}</a></td>
            </tr>
            ` : ''}
            ${lead.address ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Address:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${lead.address}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0;"><strong>Estimated Price:</strong></td>
              <td style="padding: 8px 0; color: #10b981; font-weight: bold;">${formattedPrice}</td>
            </tr>
          </table>
        </div>

        ${Object.keys(lead.variables).length > 0 ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📋 Project Details</h3>
          <ul style="list-style: none; padding: 0;">
            ${formatVariables(lead.variables)}
          </ul>
        </div>
        ` : ''}

        ${lead.notes ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">💬 Customer Notes:</h4>
          <p style="margin: 0; font-style: italic;">"${lead.notes}"</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${leadPageUrl}" 
             style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
            View All Leads
          </a>
          <a href="mailto:${lead.email}" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reply to Customer
          </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; font-size: 14px;"><strong>⚡ Quick Action:</strong> Reply quickly to increase your conversion rate! Fresh leads are most likely to convert.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          This lead was submitted on ${lead.createdAt.toLocaleDateString()} at ${lead.createdAt.toLocaleTimeString()}.<br>
          <strong>PriceBuilder Pro</strong> - Lead Management System
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: ownerEmail,
    subject,
    html
  });
}

// 2. New booking notification for business owners
export async function sendNewBookingNotification(
  ownerEmail: string,
  booking: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    date: string;
    time: string;
    services: string[];
    totalPrice: number;
    address?: string;
    notes?: string;
  }
): Promise<boolean> {
  const subject = `📅 New Booking: ${booking.customerName} - ${booking.date}`;
  
  const formattedPrice = (booking.totalPrice / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const calendarUrl = `${process.env.DOMAIN || 'https://localhost:5000'}/calendar`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Booking Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📅 New Booking Confirmed!</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Appointment Scheduled</h2>
        
        <p><strong>${booking.customerName}</strong> has booked an appointment for <strong>${booking.date}</strong> with a total value of <strong style="color: #3b82f6;">${formattedPrice}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #3b82f6;">🕒 Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold;">${booking.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold;">${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Total Value:</strong></td>
              <td style="padding: 8px 0; color: #3b82f6; font-weight: bold;">${formattedPrice}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">👤 Customer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${booking.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${booking.customerEmail}" style="color: #3b82f6;">${booking.customerEmail}</a></td>
            </tr>
            ${booking.customerPhone ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><a href="tel:${booking.customerPhone}" style="color: #3b82f6;">${booking.customerPhone}</a></td>
            </tr>
            ` : ''}
            ${booking.address ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Address:</strong></td>
              <td style="padding: 8px 0;">${booking.address}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">🛠️ Services Booked</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${booking.services.map(service => `<li style="padding: 4px 0; border-bottom: 1px solid #f0f0f0;">• ${service}</li>`).join('')}
          </ul>
        </div>

        ${booking.notes ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">💬 Customer Notes:</h4>
          <p style="margin: 0; font-style: italic;">"${booking.notes}"</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${calendarUrl}" 
             style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
            View Calendar
          </a>
          <a href="mailto:${booking.customerEmail}" 
             style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Contact Customer
          </a>
        </div>
        
        <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; font-size: 14px;"><strong>💡 Reminder:</strong> Confirm the appointment details with your customer and prepare for the scheduled service.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          This booking was made automatically through your PriceBuilder Pro form.<br>
          <strong>PriceBuilder Pro</strong> - Booking Management System
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: ownerEmail,
    subject,
    html
  });
}

// 3. Customer response to revised bid notification
export async function sendBidResponseNotification(
  ownerEmail: string,
  response: {
    customerName: string;
    customerEmail: string;
    estimateNumber: string;
    response: 'accepted' | 'declined';
    revisedPrice: number;
    originalPrice: number;
    customerMessage?: string;
  }
): Promise<boolean> {
  const isAccepted = response.response === 'accepted';
  const subject = `${isAccepted ? '✅ Bid Accepted' : '❌ Bid Declined'}: ${response.customerName} - #${response.estimateNumber}`;
  
  const formattedRevisedPrice = (response.revisedPrice / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  
  const formattedOriginalPrice = (response.originalPrice / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const estimatesUrl = `${process.env.DOMAIN || 'https://localhost:5000'}/estimates`;
  const headerColor = isAccepted ? '#10b981' : '#ef4444';
  const headerGradient = isAccepted ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bid Response Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${headerGradient}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${isAccepted ? '✅ Bid Accepted!' : '❌ Bid Declined'}</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Customer Response Received</h2>
        
        <p><strong>${response.customerName}</strong> has <strong>${isAccepted ? 'accepted' : 'declined'}</strong> your revised estimate <strong>#${response.estimateNumber}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${headerColor};">
          <h3 style="margin-top: 0; color: ${headerColor};">📊 Estimate Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Estimate #:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${response.estimateNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Original Price:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${formattedOriginalPrice}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Revised Price:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold;">${formattedRevisedPrice}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Customer Response:</strong></td>
              <td style="padding: 8px 0; color: ${headerColor}; font-weight: bold; text-transform: uppercase;">${response.response}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">👤 Customer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${response.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Email:</strong></td>
              <td style="padding: 8px 0;"><a href="mailto:${response.customerEmail}" style="color: ${headerColor};">${response.customerEmail}</a></td>
            </tr>
          </table>
        </div>

        ${response.customerMessage ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">💬 Customer Message:</h4>
          <p style="margin: 0; font-style: italic;">"${response.customerMessage}"</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${estimatesUrl}" 
             style="background: ${headerColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
            View All Estimates
          </a>
          <a href="mailto:${response.customerEmail}" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Contact Customer
          </a>
        </div>
        
        <div style="background: ${isAccepted ? '#d1fae5' : '#fee2e2'}; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${headerColor};">
          <p style="margin: 0; font-size: 14px;">
            <strong>${isAccepted ? '🎉 Next Steps:' : '💡 Follow Up:'}</strong> 
            ${isAccepted ? 'Schedule the work and begin project planning!' : 'Consider following up to understand their concerns or offer alternative solutions.'}
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          This response was received through your PriceBuilder Pro estimate system.<br>
          <strong>PriceBuilder Pro</strong> - Estimate Management System
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: ownerEmail,
    subject,
    html
  });
}

// ======================== CUSTOMER EMAIL NOTIFICATIONS ========================

// 1. Initial estimate email for customers
export async function sendCustomerEstimateEmail(
  customerEmail: string,
  estimate: {
    customerName: string;
    businessName: string;
    estimateNumber: string;
    services: Array<{
      name: string;
      price: number;
      description?: string;
    }>;
    totalPrice: number;
    validUntil?: Date;
    businessMessage?: string;
    estimateUrl: string;
  }
): Promise<boolean> {
  const subject = `Your estimate from ${estimate.businessName} - #${estimate.estimateNumber}`;
  
  const formattedTotal = (estimate.totalPrice / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const servicesList = estimate.services.map(service => {
    const servicePrice = (service.price / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    
    return `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0;">${service.name}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold;">${servicePrice}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Estimate</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📋 Your Estimate is Ready!</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${estimate.customerName}!</h2>
        
        <p>Thank you for your interest in our services! We've prepared a detailed estimate for your project.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">📊 Estimate #${estimate.estimateNumber}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${servicesList}
            <tr style="border-top: 2px solid #667eea;">
              <td style="padding: 12px 8px; font-weight: bold; font-size: 18px;">Total:</td>
              <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 18px; color: #667eea;">${formattedTotal}</td>
            </tr>
          </table>
        </div>

        ${estimate.businessMessage ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">💬 Message from ${estimate.businessName}:</h4>
          <p style="margin: 0; font-style: italic;">"${estimate.businessMessage}"</p>
        </div>
        ` : ''}

        ${estimate.validUntil ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; font-size: 14px;"><strong>⏰ Valid Until:</strong> ${estimate.validUntil.toLocaleDateString()}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${estimate.estimateUrl}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);">
            View Full Estimate
          </a>
        </div>
        
        <div style="background: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 14px;"><strong>✨ What's Next?</strong> Review your estimate and let us know if you'd like to proceed or have any questions!</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          Questions about your estimate? Simply reply to this email and we'll be happy to help!<br><br>
          <strong>${estimate.businessName}</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: customerEmail,
    subject,
    html
  });
}

// 2. Booking confirmation email for customers
export async function sendCustomerBookingConfirmationEmail(
  customerEmail: string,
  booking: {
    customerName: string;
    businessName: string;
    date: string;
    time: string;
    services: string[];
    totalPrice: number;
    address?: string;
    businessPhone?: string;
    businessEmail?: string;
    specialInstructions?: string;
  }
): Promise<boolean> {
  const subject = `Booking Confirmed with ${booking.businessName} - ${booking.date}`;
  
  const formattedPrice = (booking.totalPrice / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Great news, ${booking.customerName}!</h2>
        
        <p>Your appointment with <strong>${booking.businessName}</strong> has been confirmed. We're looking forward to working with you!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #10b981;">📅 Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold;">${booking.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold;">${booking.time}</td>
            </tr>
            ${booking.address ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Location:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${booking.address}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0;"><strong>Total Value:</strong></td>
              <td style="padding: 8px 0; color: #10b981; font-weight: bold;">${formattedPrice}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">🛠️ Services Scheduled</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${booking.services.map(service => `<li style="padding: 4px 0; border-bottom: 1px solid #f0f0f0;">• ${service}</li>`).join('')}
          </ul>
        </div>

        ${booking.specialInstructions ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">📝 Special Instructions:</h4>
          <p style="margin: 0; font-style: italic;">"${booking.specialInstructions}"</p>
        </div>
        ` : ''}
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📞 Contact Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Business:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${booking.businessName}</td>
            </tr>
            ${booking.businessPhone ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><a href="tel:${booking.businessPhone}" style="color: #10b981;">${booking.businessPhone}</a></td>
            </tr>
            ` : ''}
            ${booking.businessEmail ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Email:</strong></td>
              <td style="padding: 8px 0;"><a href="mailto:${booking.businessEmail}" style="color: #10b981;">${booking.businessEmail}</a></td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; font-size: 14px;"><strong>💡 Reminder:</strong> Please ensure someone is available at the scheduled time. If you need to reschedule, contact us as soon as possible.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          Need to make changes or have questions? Reply to this email or call us directly.<br>
          We're excited to work with you!<br><br>
          <strong>${booking.businessName}</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: customerEmail,
    subject,
    html
  });
}

// 3. Revised estimate notification for customers
export async function sendCustomerRevisedEstimateEmail(
  customerEmail: string,
  estimate: {
    customerName: string;
    businessName: string;
    estimateNumber: string;
    originalPrice: number;
    revisedPrice: number;
    revisionReason?: string;
    businessMessage?: string;
    estimateUrl: string;
    validUntil?: Date;
  }
): Promise<boolean> {
  const subject = `Updated estimate from ${estimate.businessName} - #${estimate.estimateNumber}`;
  
  const formattedOriginal = (estimate.originalPrice / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  
  const formattedRevised = (estimate.revisedPrice / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const priceChange = estimate.revisedPrice - estimate.originalPrice;
  const isIncrease = priceChange > 0;
  const changeAmount = Math.abs(priceChange / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const changeColor = isIncrease ? '#ef4444' : '#10b981';
  const changeIcon = isIncrease ? '📈' : '📉';
  const changeText = isIncrease ? 'increased' : 'decreased';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Updated Estimate</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📝 Updated Estimate</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${estimate.customerName}!</h2>
        
        <p>We've updated your estimate based on additional project details. Please review the changes below.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #f59e0b;">📊 Estimate #${estimate.estimateNumber} - Updated</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Original Price:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right; text-decoration: line-through; color: #6b7280;">${formattedOriginal}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Updated Price:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; font-size: 18px; color: #f59e0b;">${formattedRevised}</td>
            </tr>
            <tr style="background: ${isIncrease ? '#fee2e2' : '#d1fae5'};">
              <td style="padding: 12px 8px; font-weight: bold;">${changeIcon} Price Change:</td>
              <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: ${changeColor};">
                ${isIncrease ? '+' : '-'}${changeAmount} (${changeText})
              </td>
            </tr>
          </table>
        </div>

        ${estimate.revisionReason ? `
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h4 style="margin-top: 0; color: #92400e;">📋 Reason for Update:</h4>
          <p style="margin: 0;">${estimate.revisionReason}</p>
        </div>
        ` : ''}

        ${estimate.businessMessage ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">💬 Message from ${estimate.businessName}:</h4>
          <p style="margin: 0; font-style: italic;">"${estimate.businessMessage}"</p>
        </div>
        ` : ''}

        ${estimate.validUntil ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; font-size: 14px;"><strong>⏰ Valid Until:</strong> ${estimate.validUntil.toLocaleDateString()}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${estimate.estimateUrl}" 
             style="background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3); margin-right: 10px;">
            Review Updated Estimate
          </a>
        </div>
        
        <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; font-size: 14px;"><strong>🤝 Your Approval Needed:</strong> Please review the updated estimate and let us know if you'd like to proceed with the revised pricing.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          Questions about the changes? Reply to this email and we'll explain everything in detail.<br><br>
          <strong>${estimate.businessName}</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: customerEmail,
    subject,
    html
  });
}

  const leadPageUrl = `${process.env.DOMAIN || 'https://localhost:5000'}/leads`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Multi-Service Lead Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚨 New Multi-Service Lead!</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">New inquiry for ${lead.services.length} services</h2>
        
        <p>You have a new multi-service lead inquiry with a total estimated value of <strong style="color: #8b5cf6; font-size: 18px;">${formattedTotal}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
          <h3 style="margin-top: 0; color: #8b5cf6;">👤 Customer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${lead.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${lead.email}" style="color: #8b5cf6;">${lead.email}</a></td>
            </tr>
            ${lead.phone ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><a href="tel:${lead.phone}" style="color: #8b5cf6;">${lead.phone}</a></td>
            </tr>
            ` : ''}
            ${lead.address ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>Address:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${lead.address}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0;"><strong>Total Estimate:</strong></td>
              <td style="padding: 8px 0; color: #8b5cf6; font-weight: bold; font-size: 16px;">${formattedTotal}</td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">🛠️ Requested Services (${lead.services.length})</h3>
          ${servicesList}
        </div>

        ${lead.notes ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">💬 Customer Notes:</h4>
          <p style="margin: 0; font-style: italic;">"${lead.notes}"</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${leadPageUrl}" 
             style="background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
            View All Leads
          </a>
          <a href="mailto:${lead.email}" 
             style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reply to Customer
          </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; font-size: 14px;"><strong>💰 High-Value Opportunity:</strong> Multi-service leads typically have higher conversion rates and larger project values. Respond quickly to maximize your chances!</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          This lead was submitted on ${lead.createdAt.toLocaleDateString()} at ${lead.createdAt.toLocaleTimeString()}.<br>
          <strong>PriceBuilder Pro</strong> - Lead Management System
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: ownerEmail,
    subject,
    html
  });
}
