import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    console.log('Attempting to send email to:', params.to);
    console.log('Using from address:', params.from || 'noreply@autobidder.org');
    
    const emailData = {
      to: params.to,
      from: params.from || 'noreply@autobidder.org',
      subject: params.subject,
      text: params.text,
      html: params.html,
    };
    
    console.log('Email payload:', JSON.stringify(emailData, null, 2));
    await mailService.send(emailData);
    console.log('Email sent successfully!');
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    if (error.response?.body?.errors) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body.errors, null, 2));
      
      // Check if it's a credits exceeded error
      const errors = error.response.body.errors;
      if (errors.some((err: any) => err.message?.includes('Maximum credits exceeded'))) {
        console.log('🚫 SendGrid daily limit reached. Email would have been sent to:', params.to);
        console.log('📧 Subject:', params.subject);
        console.log('💡 Your SendGrid account has reached its daily sending limit.');
        console.log('💡 Upgrade your plan at: https://app.sendgrid.com/settings/billing');
        console.log('💡 Or wait for daily reset (usually midnight UTC)');
        
        // Log the email content for manual follow-up if needed
        console.log('📝 Email Content Preview:');
        console.log('   To:', params.to);
        console.log('   From:', params.from);
        console.log('   Subject:', params.subject);
        if (params.text) console.log('   Text:', params.text.substring(0, 100) + '...');
        
        return false; // Still return false so the application knows email failed
      }
    }
    return false;
  }
}

// Business owner notifications
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  const subject = "Welcome to PriceBuilder Pro!";
  const html = `
    <h1>Welcome ${userName}!</h1>
    <p>Thank you for joining PriceBuilder Pro. You can now create pricing calculators and capture leads.</p>
  `;
  
  return await sendEmail({
    to: userEmail,
    subject,
    html
  });
}

export async function sendOnboardingCompleteEmail(userEmail: string, userName: string): Promise<boolean> {
  const subject = "Your PriceBuilder Pro setup is complete!";
  const html = `
    <h1>Setup Complete, ${userName}!</h1>
    <p>Your PriceBuilder Pro account is ready to use. Start creating your first pricing calculator today!</p>
  `;
  
  return await sendEmail({
    to: userEmail,
    subject,
    html
  });
}

export async function sendSubscriptionConfirmationEmail(userEmail: string, planName: string): Promise<boolean> {
  const subject = `Welcome to ${planName} - Subscription Confirmed`;
  const html = `
    <h1>Subscription Confirmed!</h1>
    <p>Welcome to ${planName}! Your subscription is now active and you have full access to all features.</p>
  `;
  
  return await sendEmail({
    to: userEmail,
    subject,
    html
  });
}

export async function sendNewLeadNotification(
  ownerEmail: string,
  lead: {
    id: string;
    customerName?: string;
    email?: string;
    phone?: string;
    serviceName: string;
    totalPrice: number;
    variables: any;
    calculatedAt: Date;
    createdAt: Date;
  }
): Promise<boolean> {
  const subject = `🎯 New Lead: ${lead.serviceName} - $${lead.totalPrice.toLocaleString()}`;
  
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
        <h1 style="color: white; margin: 0; font-size: 28px;">🎯 New Lead Alert!</h1>
        <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 18px;">$${lead.totalPrice.toLocaleString()} ${lead.serviceName} Project</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Customer Information</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9ecef;">
          <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${lead.customerName || 'Not provided'}</p>
          <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${lead.email || 'Not provided'}</p>
          <p style="margin: 0 0 10px 0;"><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
          <p style="margin: 0;"><strong>Service:</strong> ${lead.serviceName}</p>
        </div>
        
        <h3 style="color: #333; margin-bottom: 15px;">Project Details & Pricing</h3>
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
          <p style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #059669;">Total Price: $${lead.totalPrice.toLocaleString()}</p>
          <p style="margin: 0; color: #666;">Calculated on: ${lead.calculatedAt.toLocaleDateString()}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DOMAIN || 'https://localhost:5000'}/leads" 
             style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 15px;">
            View All Leads
          </a>
          <a href="mailto:${lead.email}" 
             style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Reply to Customer
          </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; font-size: 14px;"><strong>💰 Conversion Tip:</strong> Studies show that responding within the first hour increases conversion rates by 7x. Strike while the iron is hot!</p>
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

export async function sendNewMultiServiceLeadNotification(
  ownerEmail: string,
  lead: {
    id: string;
    customerName?: string;
    email?: string;
    phone?: string;
    services: Array<{
      name: string;
      price: number;
    }>;
    totalPrice: number;
    createdAt: Date;
  }
): Promise<boolean> {
  const subject = `🎯 New Multi-Service Lead: ${lead.services.length} Services - $${lead.totalPrice.toLocaleString()}`;
  
  const servicesList = lead.services.map(service => 
    `<li style="margin: 5px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
      <strong>${service.name}</strong> - $${(service.price || 0).toLocaleString()}
    </li>`
  ).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Multi-Service Lead</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Multi-Service Lead!</h1>
        <p style="color: #ddd6fe; margin: 10px 0 0 0; font-size: 18px;">${lead.services.length} Services - $${lead.totalPrice.toLocaleString()} Total</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Customer Information</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9ecef;">
          <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${lead.customerName || 'Not provided'}</p>
          <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${lead.email || 'Not provided'}</p>
          <p style="margin: 0;"><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
        </div>
        
        <h3 style="color: #333; margin-bottom: 15px;">Services Requested</h3>
        <ul style="list-style: none; padding: 0; margin-bottom: 20px;">
          ${servicesList}
        </ul>
        
        <div style="background: #ede9fe; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #8b5cf6;">
          <p style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #7c3aed;">Total Project Value: $${lead.totalPrice.toLocaleString()}</p>
          <p style="margin: 0; color: #666;">Multi-service bundle opportunity</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DOMAIN || 'https://localhost:5000'}/leads" 
             style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 15px;">
            View All Leads
          </a>
          <a href="mailto:${lead.email}" 
             style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
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

export async function sendNewBookingNotification(
  ownerEmail: string,
  bookingDetails: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    service: string;
    appointmentDate: Date;
    appointmentTime: string;
    notes?: string;
  }
): Promise<boolean> {
  const subject = `📅 New Appointment Booked: ${bookingDetails.service}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Appointment Booking</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📅 New Appointment!</h1>
        <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 18px;">${bookingDetails.service} Service</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Appointment Details</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9ecef;">
          <p style="margin: 0 0 10px 0;"><strong>Service:</strong> ${bookingDetails.service}</p>
          <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${bookingDetails.appointmentDate.toLocaleDateString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${bookingDetails.appointmentTime}</p>
          ${bookingDetails.notes ? `<p style="margin: 0;"><strong>Notes:</strong> ${bookingDetails.notes}</p>` : ''}
        </div>
        
        <h3 style="color: #333; margin-bottom: 15px;">Customer Information</h3>
        <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${bookingDetails.customerName}</p>
          <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${bookingDetails.customerEmail}</p>
          ${bookingDetails.customerPhone ? `<p style="margin: 0;"><strong>Phone:</strong> ${bookingDetails.customerPhone}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DOMAIN || 'https://localhost:5000'}/calendar" 
             style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 15px;">
            View Calendar
          </a>
          <a href="mailto:${bookingDetails.customerEmail}" 
             style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Contact Customer
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          <strong>PriceBuilder Pro</strong> - Appointment Management System
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

export async function sendBidResponseNotification(
  ownerEmail: string,
  bidDetails: {
    service: string;
    customerName: string;
    customerEmail: string;
    estimatedPrice: number;
    bidId: string;
  }
): Promise<boolean> {
  const subject = `📋 Bid Response Required: ${bidDetails.service}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bid Response Required</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📋 Bid Response Required</h1>
        <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 18px;">${bidDetails.service} Project</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Project Information</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9ecef;">
          <p style="margin: 0 0 10px 0;"><strong>Service:</strong> ${bidDetails.service}</p>
          <p style="margin: 0 0 10px 0;"><strong>Customer:</strong> ${bidDetails.customerName}</p>
          <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${bidDetails.customerEmail}</p>
          <p style="margin: 0;"><strong>Estimated Price:</strong> $${bidDetails.estimatedPrice.toLocaleString()}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DOMAIN || 'https://localhost:5000'}/verify-bid/${bidDetails.bidId}" 
             style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Review & Respond to Bid
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          <strong>PriceBuilder Pro</strong> - Bid Management System
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

// Customer email notifications
export async function sendCustomerEstimateEmail(
  customerEmail: string,
  customerName: string,
  estimateDetails: {
    service: string;
    price: number;
    estimateId: string;
    validUntil?: Date;
    businessName?: string;
    businessPhone?: string;
    notes?: string;
  }
): Promise<boolean> {
  const subject = `Your ${estimateDetails.service} Estimate is Ready - $${estimateDetails.price.toLocaleString()}`;
  const estimateUrl = `${process.env.DOMAIN || 'https://localhost:5000'}/estimate/${estimateDetails.estimateId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Service Estimate</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Your Estimate is Ready!</h1>
        <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 16px;">Professional ${estimateDetails.service} Service</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${customerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          Thank you for your interest in our ${estimateDetails.service} service. We've prepared a detailed estimate for your project.
        </p>
        
        <div style="background: #e8f5e8; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10b981; text-align: center;">
          <h3 style="margin: 0 0 10px 0; color: #059669; font-size: 24px;">Total Estimate</h3>
          <p style="margin: 0; font-size: 32px; font-weight: bold; color: #059669;">$${estimateDetails.price.toLocaleString()}</p>
          ${estimateDetails.validUntil ? `<p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid until ${estimateDetails.validUntil.toLocaleDateString()}</p>` : ''}
        </div>
        
        ${estimateDetails.notes ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e9ecef;">
          <h4 style="margin: 0 0 10px 0; color: #333;">Project Notes:</h4>
          <p style="margin: 0; color: #666;">${estimateDetails.notes}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${estimateUrl}" 
             style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
            View Full Estimate
          </a>
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">What's Next?</h4>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li>Review your detailed estimate using the link above</li>
            <li>Schedule a consultation if you have questions</li>
            <li>Accept the estimate to move forward with your project</li>
          </ul>
        </div>
        
        ${estimateDetails.businessName || estimateDetails.businessPhone ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e9ecef;">
          <h4 style="margin: 0 0 15px 0; color: #333;">Contact Information</h4>
          ${estimateDetails.businessName ? `<p style="margin: 0 0 5px 0;"><strong>${estimateDetails.businessName}</strong></p>` : ''}
          ${estimateDetails.businessPhone ? `<p style="margin: 0; color: #666;">Phone: ${estimateDetails.businessPhone}</p>` : ''}
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          <strong>PriceBuilder Pro</strong> - Professional Service Estimates<br>
          This estimate was generated on ${new Date().toLocaleDateString()}
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

export async function sendCustomerBookingConfirmationEmail(
  customerEmail: string,
  customerName: string,
  bookingDetails: {
    service: string;
    appointmentDate: Date;
    appointmentTime: string;
    businessName?: string;
    businessPhone?: string;
    businessEmail?: string;
    address?: string;
    notes?: string;
  }
): Promise<boolean> {
  const subject = `Appointment Confirmed: ${bookingDetails.service} on ${bookingDetails.appointmentDate.toLocaleDateString()}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Appointment Confirmed!</h1>
        <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 16px;">${bookingDetails.service} Service</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${customerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          Your appointment has been confirmed! We're looking forward to providing you with excellent ${bookingDetails.service} service.
        </p>
        
        <div style="background: #fff7ed; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 15px 0; color: #d97706;">Appointment Details</h3>
          <p style="margin: 0 0 10px 0;"><strong>Service:</strong> ${bookingDetails.service}</p>
          <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${bookingDetails.appointmentDate.toLocaleDateString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${bookingDetails.appointmentTime}</p>
          ${bookingDetails.address ? `<p style="margin: 0;"><strong>Location:</strong> ${bookingDetails.address}</p>` : ''}
        </div>
        
        ${bookingDetails.notes ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e9ecef;">
          <h4 style="margin: 0 0 10px 0; color: #333;">Special Notes:</h4>
          <p style="margin: 0; color: #666;">${bookingDetails.notes}</p>
        </div>
        ` : ''}
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">Before Your Appointment</h4>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li>Please ensure easy access to the service area</li>
            <li>Have any relevant documents or materials ready</li>
            <li>Feel free to contact us if you have any questions</li>
          </ul>
        </div>
        
        ${bookingDetails.businessName || bookingDetails.businessPhone || bookingDetails.businessEmail ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e9ecef;">
          <h4 style="margin: 0 0 15px 0; color: #333;">Contact Information</h4>
          ${bookingDetails.businessName ? `<p style="margin: 0 0 5px 0;"><strong>${bookingDetails.businessName}</strong></p>` : ''}
          ${bookingDetails.businessPhone ? `<p style="margin: 0 0 5px 0;">Phone: ${bookingDetails.businessPhone}</p>` : ''}
          ${bookingDetails.businessEmail ? `<p style="margin: 0;">Email: ${bookingDetails.businessEmail}</p>` : ''}
        </div>
        ` : ''}
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ef4444;">
          <h4 style="margin: 0 0 10px 0; color: #dc2626;">Need to Reschedule?</h4>
          <p style="margin: 0; color: #666;">
            If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          <strong>PriceBuilder Pro</strong> - Professional Service Booking<br>
          Confirmation sent on ${new Date().toLocaleDateString()}
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

export async function sendCustomerRevisedEstimateEmail(
  customerEmail: string,
  customerName: string,
  estimateDetails: {
    service: string;
    originalPrice: number;
    revisedPrice: number;
    estimateId: string;
    revisionReason?: string;
    businessName?: string;
    validUntil?: Date;
  }
): Promise<boolean> {
  const subject = `Revised Estimate: ${estimateDetails.service} - $${estimateDetails.revisedPrice.toLocaleString()}`;
  const estimateUrl = `${process.env.DOMAIN || 'https://localhost:5000'}/estimate/${estimateDetails.estimateId}`;
  const priceChange = estimateDetails.revisedPrice - estimateDetails.originalPrice;
  const isIncrease = priceChange > 0;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Revised Estimate</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📝 Revised Estimate</h1>
        <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 16px;">Updated ${estimateDetails.service} Pricing</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${customerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          We've reviewed your ${estimateDetails.service} project and have an updated estimate for you.
        </p>
        
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e9ecef;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Price Comparison</h3>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="color: #666;">Original Estimate:</span>
            <span style="font-size: 18px; text-decoration: line-through; color: #999;">$${estimateDetails.originalPrice.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="font-weight: bold;">Revised Estimate:</span>
            <span style="font-size: 24px; font-weight: bold; color: ${isIncrease ? '#dc2626' : '#10b981'};">$${estimateDetails.revisedPrice.toLocaleString()}</span>
          </div>
          <div style="padding-top: 15px; border-top: 1px solid #e9ecef;">
            <span style="color: ${isIncrease ? '#dc2626' : '#10b981'}; font-weight: bold;">
              ${isIncrease ? 'Increase' : 'Savings'}: $${Math.abs(priceChange).toLocaleString()}
            </span>
          </div>
        </div>
        
        ${estimateDetails.revisionReason ? `
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">Reason for Revision:</h4>
          <p style="margin: 0; color: #374151;">${estimateDetails.revisionReason}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${estimateUrl}" 
             style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
            View Updated Estimate
          </a>
        </div>
        
        ${estimateDetails.validUntil ? `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>Note:</strong> This revised estimate is valid until ${estimateDetails.validUntil.toLocaleDateString()}.
          </p>
        </div>
        ` : ''}
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">Questions About the Changes?</h4>
          <p style="margin: 0; color: #374151;">
            We're happy to discuss any questions you may have about the revised pricing. Please don't hesitate to reach out to us.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          <strong>PriceBuilder Pro</strong> - Professional Service Estimates<br>
          Revision sent on ${new Date().toLocaleDateString()}
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

// Simplified Email Template System
// These functions use simple, consistent templates for the three main customer touchpoints

export async function sendLeadSubmittedEmail(
  customerEmail: string,
  customerName: string,
  leadDetails: {
    service: string;
    price: number;
    businessName?: string;
    businessPhone?: string;
    estimatedTimeframe?: string;
  }
): Promise<boolean> {
  const subject = `Thank you for your ${leadDetails.service} inquiry - $${leadDetails.price.toLocaleString()}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lead Submitted</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Inquiry!</h1>
        <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 16px;">${leadDetails.service} Service Request</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${customerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          Thank you for your interest in our ${leadDetails.service} service. We've received your inquiry and will get back to you shortly.
        </p>
        
        <div style="background: #e8f5e8; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10b981; text-align: center;">
          <h3 style="margin: 0 0 10px 0; color: #059669; font-size: 24px;">Estimated Price</h3>
          <p style="margin: 0; font-size: 32px; font-weight: bold; color: #059669;">$${leadDetails.price.toLocaleString()}</p>
          ${leadDetails.estimatedTimeframe ? `<p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Estimated timeframe: ${leadDetails.estimatedTimeframe}</p>` : ''}
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">What Happens Next?</h4>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li>We'll review your project details within 24 hours</li>
            <li>One of our specialists will contact you to discuss your needs</li>
            <li>We'll provide a detailed estimate and timeline</li>
          </ul>
        </div>
        
        ${leadDetails.businessName || leadDetails.businessPhone ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e9ecef;">
          <h4 style="margin: 0 0 15px 0; color: #333;">Contact Information</h4>
          ${leadDetails.businessName ? `<p style="margin: 0 0 5px 0;"><strong>${leadDetails.businessName}</strong></p>` : ''}
          ${leadDetails.businessPhone ? `<p style="margin: 0;">Phone: ${leadDetails.businessPhone}</p>` : ''}
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          <strong>PriceBuilder Pro</strong> - Professional Service Inquiries<br>
          Submitted on ${new Date().toLocaleDateString()}
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

export async function sendLeadBookedEmail(
  customerEmail: string,
  customerName: string,
  bookingDetails: {
    service: string;
    appointmentDate: string;
    appointmentTime: string;
    businessName?: string;
    businessPhone?: string;
    address?: string;
  }
): Promise<boolean> {
  const subject = `Appointment Confirmed: ${bookingDetails.service} on ${bookingDetails.appointmentDate}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lead Booked</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Appointment Confirmed!</h1>
        <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 16px;">${bookingDetails.service} Service</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${customerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          Your appointment has been confirmed! We're looking forward to providing you with excellent service.
        </p>
        
        <div style="background: #fff7ed; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 15px 0; color: #d97706;">Appointment Details</h3>
          <p style="margin: 0 0 10px 0;"><strong>Service:</strong> ${bookingDetails.service}</p>
          <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${bookingDetails.appointmentDate}</p>
          <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${bookingDetails.appointmentTime}</p>
          ${bookingDetails.address ? `<p style="margin: 0;"><strong>Location:</strong> ${bookingDetails.address}</p>` : ''}
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">Before Your Appointment</h4>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li>Please ensure easy access to the service area</li>
            <li>Have any relevant documents ready</li>
            <li>Contact us if you have any questions</li>
          </ul>
        </div>
        
        ${bookingDetails.businessName || bookingDetails.businessPhone ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e9ecef;">
          <h4 style="margin: 0 0 15px 0; color: #333;">Contact Information</h4>
          ${bookingDetails.businessName ? `<p style="margin: 0 0 5px 0;"><strong>${bookingDetails.businessName}</strong></p>` : ''}
          ${bookingDetails.businessPhone ? `<p style="margin: 0;">Phone: ${bookingDetails.businessPhone}</p>` : ''}
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          <strong>PriceBuilder Pro</strong> - Professional Service Booking<br>
          Confirmed on ${new Date().toLocaleDateString()}
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

export async function sendRevisedBidEmail(
  customerEmail: string,
  customerName: string,
  bidDetails: {
    service: string;
    originalPrice: number;
    revisedPrice: number;
    revisionReason?: string;
    businessName?: string;
  }
): Promise<boolean> {
  const subject = `Updated Bid: ${bidDetails.service} - $${bidDetails.revisedPrice.toLocaleString()}`;
  const priceChange = bidDetails.revisedPrice - bidDetails.originalPrice;
  const isIncrease = priceChange > 0;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Revised Bid</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📝 Updated Bid</h1>
        <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 16px;">${bidDetails.service} Project</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${customerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          We've reviewed your ${bidDetails.service} project and have an updated bid for you.
        </p>
        
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e9ecef;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Price Update</h3>
          <div style="margin-bottom: 15px;">
            <span style="color: #666;">Original Bid: </span>
            <span style="font-size: 18px; text-decoration: line-through; color: #999;">$${bidDetails.originalPrice.toLocaleString()}</span>
          </div>
          <div style="margin-bottom: 15px;">
            <span style="font-weight: bold;">Updated Bid: </span>
            <span style="font-size: 24px; font-weight: bold; color: ${isIncrease ? '#dc2626' : '#10b981'};">$${bidDetails.revisedPrice.toLocaleString()}</span>
          </div>
          <div style="padding-top: 15px; border-top: 1px solid #e9ecef;">
            <span style="color: ${isIncrease ? '#dc2626' : '#10b981'}; font-weight: bold;">
              ${isIncrease ? 'Increase' : 'Savings'}: $${Math.abs(priceChange).toLocaleString()}
            </span>
          </div>
        </div>
        
        ${bidDetails.revisionReason ? `
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">Reason for Update:</h4>
          <p style="margin: 0; color: #374151;">${bidDetails.revisionReason}</p>
        </div>
        ` : ''}
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">Questions?</h4>
          <p style="margin: 0; color: #374151;">
            We're happy to discuss any questions you may have about the updated pricing. Please contact us anytime.
          </p>
        </div>
        
        ${bidDetails.businessName ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e9ecef;">
          <h4 style="margin: 0 0 15px 0; color: #333;">Contact Information</h4>
          <p style="margin: 0;"><strong>${bidDetails.businessName}</strong></p>
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          <strong>PriceBuilder Pro</strong> - Professional Service Bids<br>
          Updated on ${new Date().toLocaleDateString()}
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