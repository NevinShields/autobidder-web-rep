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
  
  const formattedPrice = lead.calculatedPrice.toLocaleString('en-US', {
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

// New multi-service lead notification email
export async function sendNewMultiServiceLeadNotification(
  ownerEmail: string,
  lead: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    notes?: string;
    services: Array<{
      formulaName: string;
      calculatedPrice: number;
      variables: Record<string, any>;
    }>;
    totalPrice: number;
    createdAt: Date;
  }
): Promise<boolean> {
  const subject = `🚨 New Multi-Service Lead: ${lead.name} - ${lead.services.length} Services`;
  
  const formattedTotal = lead.totalPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const formatVariables = (variables: Record<string, any>) => {
    return Object.entries(variables)
      .map(([key, value]) => `<li style="margin: 4px 0;"><strong>${key}:</strong> ${value}</li>`)
      .join('');
  };

  const servicesList = lead.services.map((service, index) => {
    const servicePrice = service.calculatedPrice.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    
    return `
      <div style="background: white; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 3px solid #667eea;">
        <h4 style="margin: 0 0 10px 0; color: #667eea;">${index + 1}. ${service.formulaName} - ${servicePrice}</h4>
        ${Object.keys(service.variables).length > 0 ? `
        <ul style="list-style: none; padding: 0; margin: 8px 0; font-size: 14px; color: #666;">
          ${formatVariables(service.variables)}
        </ul>
        ` : '<p style="margin: 0; font-size: 14px; color: #666;">No additional details provided.</p>'}
      </div>
    `;
  }).join('');

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