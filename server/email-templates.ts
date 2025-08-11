// This file now uses Resend through the email-providers system
// All email functions route through the unified email system

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Use the unified email system (Resend primary)
    const { sendEmailWithFallback } = await import('./email-providers');
    return await sendEmailWithFallback(params);
  } catch (error) {
    console.error('Email system error:', error);
    return false;
  }
}

// Unified email template for all business notifications
function createUnifiedEmailTemplate(params: {
  title: string;
  subtitle?: string;
  mainContent: string;
  cardContent?: string;
  cardTitle?: string;
  footerText?: string;
  accentColor?: string;
}): string {
  const accentColor = params.accentColor || '#2563eb';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, ${accentColor} 0%, #1d4ed8 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
          ${params.title}
        </h1>
        ${params.subtitle ? `<p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">${params.subtitle}</p>` : ''}
      </div>
      
      <!-- Main content -->
      <div style="padding: 40px 30px;">
        ${params.mainContent}
        
        ${params.cardContent ? `
        <!-- Content Card -->
        <div style="background-color: #f8fafc; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 25px 0;">
          ${params.cardTitle ? `<h3 style="color: #1f2937; font-size: 18px; margin-bottom: 20px;">${params.cardTitle}</h3>` : ''}
          ${params.cardContent}
        </div>
        ` : ''}
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">
          ${params.footerText || 'This email was sent by Autobidder • Your Business Growth Platform'}
        </p>
      </div>
    </div>
  `;
}

// Business owner notifications
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  const subject = "Welcome to Autobidder! 🎉";
  
  const html = createUnifiedEmailTemplate({
    title: "🎉 Welcome to Autobidder!",
    subtitle: `Hi ${userName}, let's get you started`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        Thank you for joining Autobidder! Your account is ready to use.
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        You can now create intelligent pricing calculators and capture high-quality leads for your business.
      </p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Ready to get started? Log in to your dashboard and create your first pricing calculator today!
      </p>
    `,
    cardTitle: "🚀 What you can do now:",
    cardContent: `
      <ul style="color: #4b5563; margin: 0; padding-left: 18px;">
        <li style="margin-bottom: 8px;">Create custom pricing calculators for your services</li>
        <li style="margin-bottom: 8px;">Capture and manage leads automatically</li>
        <li style="margin-bottom: 8px;">Send professional quotes to prospects</li>
        <li style="margin-bottom: 8px;">Build your business website</li>
        <li>Track your performance with detailed analytics</li>
      </ul>
    `,
    footerText: "Welcome to Autobidder • Your Business Growth Platform",
    accentColor: "#2563eb"
  });
  
  return await sendEmail({
    to: userEmail,
    from: 'Autobidder <noreply@autobidder.org>',
    subject,
    html
  });
}

export async function sendOnboardingCompleteEmail(userEmail: string, userName: string): Promise<boolean> {
  const subject = "Your Autobidder setup is complete! ✅";
  
  const html = createUnifiedEmailTemplate({
    title: "✅ Setup Complete!",
    subtitle: `Welcome to Autobidder, ${userName}`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        Congratulations! Your Autobidder account is fully set up and ready to use.
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        You can now start creating your first pricing calculator and begin capturing leads for your business.
      </p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Need help getting started? Check out our documentation or contact our support team.
      </p>
    `,
    cardTitle: "🎯 Ready to get started?",
    cardContent: `
      <ul style="color: #4b5563; margin: 0; padding-left: 18px;">
        <li style="margin-bottom: 8px;">Create your first pricing calculator</li>
        <li style="margin-bottom: 8px;">Customize your business settings</li>
        <li style="margin-bottom: 8px;">Share your calculator with customers</li>
        <li>Start generating leads and growing your business!</li>
      </ul>
    `,
    accentColor: "#16a34a"
  });
  
  return await sendEmail({
    to: userEmail,
    from: 'Autobidder <noreply@autobidder.org>',
    subject,
    html
  });
}

export async function sendSubscriptionConfirmationEmail(userEmail: string, planName: string): Promise<boolean> {
  const subject = `🎉 Welcome to ${planName} - Subscription Confirmed`;
  
  const html = createUnifiedEmailTemplate({
    title: "🎉 Subscription Confirmed!",
    subtitle: `Welcome to ${planName}`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        Congratulations! Your ${planName} subscription is now active.
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        You now have full access to all ${planName} features and can take your business to the next level with Autobidder.
      </p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Your subscription will automatically renew. You can manage your subscription settings in your account dashboard at any time.
      </p>
    `,
    cardTitle: `✨ Your ${planName} benefits:`,
    cardContent: `
      <ul style="color: #4b5563; margin: 0; padding-left: 18px;">
        <li style="margin-bottom: 8px;">Unlimited pricing calculators</li>
        <li style="margin-bottom: 8px;">Advanced lead management</li>
        <li style="margin-bottom: 8px;">Professional email templates</li>
        <li style="margin-bottom: 8px;">Priority customer support</li>
        <li>Advanced analytics and reporting</li>
      </ul>
    `,
    footerText: "This confirmation was sent by Autobidder • Your Business Growth Platform",
    accentColor: "#7c3aed"
  });
  
  return await sendEmail({
    to: userEmail,
    from: 'Autobidder <noreply@autobidder.org>',
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
  // Fix pricing: Convert cents to dollars
  const formattedPrice = (lead.totalPrice / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  
  const subject = `Autobidder Prospect: ${formattedPrice}`;
  
  const html = createUnifiedEmailTemplate({
    title: "🎯 New Lead Alert!",
    subtitle: `${formattedPrice} ${lead.serviceName} Project`,
    mainContent: `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; display: inline-block;">
          <h3 style="color: #15803d; font-size: 36px; font-weight: 800; margin: 0;">
            ${formattedPrice}
          </h3>
          <p style="color: #16a34a; font-size: 14px; margin: 5px 0 0 0;">Project Value</p>
        </div>
      </div>
      
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px; text-align: center;">
        Great news! You have a new lead for ${lead.serviceName}.
      </h2>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.DOMAIN || 'https://localhost:5000'}/leads" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 0 8px 8px 0;">
          View All Leads
        </a>
        <a href="mailto:${lead.email}" 
           style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 0 8px 8px 0;">
          Reply to Customer
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center;">
        Lead submitted on ${lead.createdAt.toLocaleDateString()} at ${lead.createdAt.toLocaleTimeString()}
      </p>
    `,
    cardTitle: "👤 Customer Information",
    cardContent: `
      <div style="color: #4b5563;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Name:</span>
          <span>${lead.customerName || 'Not provided'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Email:</span>
          <span>${lead.email || 'Not provided'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Phone:</span>
          <span>${lead.phone || 'Not provided'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="font-weight: 600;">Service:</span>
          <span>${lead.serviceName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="font-weight: 600;">Calculated:</span>
          <span>${lead.calculatedAt.toLocaleDateString()}</span>
        </div>
      </div>
    `,
    accentColor: "#16a34a"
  });

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
  // Fix pricing: Prices are already in dollars, no need to divide by 100
  const formattedTotalPrice = lead.totalPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  
  const subject = `Autobidder Prospect: ${formattedTotalPrice}`;
  
  const servicesList = lead.services.map(service => {
    const formattedServicePrice = service.price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    return `<div style="background: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 12px; margin: 8px 0; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2); display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255, 255, 255, 0.1);">
      <span style="font-weight: 600; color: #e2e8f0;">${service.name}</span>
      <span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 6px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">${formattedServicePrice}</span>
    </div>`;
  }).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Multi-Service Lead Alert</title>
      <style>
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      </style>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #ffffff; max-width: 600px; margin: 0 auto; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); position: relative;">
      
      <!-- Animated Background Elements -->
      <div style="position: absolute; top: 20%; left: 20%; width: 200px; height: 200px; background: radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%); border-radius: 50%; filter: blur(20px); animation: float 6s ease-in-out infinite;"></div>
      <div style="position: absolute; top: 60%; right: 20%; width: 150px; height: 150px; background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%); border-radius: 50%; filter: blur(20px); animation: float 8s ease-in-out infinite reverse;"></div>
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
        <div style="background: rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 20px; backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
          <h1 style="color: white; margin: 0 0 10px 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,0.5); background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">🎯 Multi-Service Lead!</h1>
          <p style="color: #e2e8f0; margin: 0; font-size: 18px; font-weight: 500;">${lead.services.length} Services - ${formattedTotalPrice} Total</p>
        </div>
      </div>
      
      <!-- Main Content -->
      <div style="background: rgba(15, 23, 42, 0.7); padding: 40px 30px; margin: 0; backdrop-filter: blur(10px); position: relative;">
        
        <!-- Customer Information -->
        <div style="background: rgba(255, 255, 255, 0.03); padding: 25px; border-radius: 20px; margin-bottom: 30px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
          <h3 style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
            <span style="background: linear-gradient(135deg, #a855f7, #8b5cf6); color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; margin-right: 12px; box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3);">👤</span>
            Customer Information
          </h3>
          <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 16px; box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                <span style="font-weight: 600; color: #cbd5e1;">Name:</span>
                <span style="color: #e2e8f0;">${lead.customerName || 'Not provided'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                <span style="font-weight: 600; color: #cbd5e1;">Email:</span>
                <span style="color: #e2e8f0;">${lead.email || 'Not provided'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                <span style="font-weight: 600; color: #cbd5e1;">Phone:</span>
                <span style="color: #e2e8f0;">${lead.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Services Breakdown -->
        <div style="background: rgba(255, 255, 255, 0.03); padding: 25px; border-radius: 20px; margin-bottom: 30px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
          <h3 style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
            <span style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; margin-right: 12px; box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);">📋</span>
            Services Requested (${lead.services.length})
          </h3>
          <div style="margin: 15px 0;">
            ${servicesList}
          </div>
        </div>
        
        <!-- Total Project Value -->
        <div style="background: rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 20px; margin-bottom: 30px; border: 1px solid rgba(16, 185, 129, 0.3); text-align: center; box-shadow: 0 8px 32px rgba(16, 185, 129, 0.2); backdrop-filter: blur(20px);">
          <h3 style="margin: 0 0 15px 0; color: #34d399; font-size: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Total Project Value</h3>
          <div style="background: rgba(255, 255, 255, 0.08); padding: 20px; border-radius: 16px; margin: 15px 0; box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1);">
            <p style="margin: 0; font-size: 42px; font-weight: 800; color: #10b981; text-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);">${formattedTotalPrice}</p>
          </div>
          <p style="margin: 10px 0 0 0; color: #6ee7b7; font-size: 14px; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">Multi-service bundle opportunity</p>
        </div>
        
        <!-- Action Buttons -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DOMAIN || 'https://localhost:5000'}/leads" 
             style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 600; display: inline-block; margin: 0 8px 8px 0; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);">
            View All Leads
          </a>
          <a href="mailto:${lead.email}" 
             style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 600; display: inline-block; margin: 0 8px 8px 0; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);">
            Reply to Customer
          </a>
        </div>
        
        <!-- High-Value Opportunity Alert -->
        <div style="background: rgba(255, 193, 7, 0.1); padding: 25px; border-radius: 20px; margin: 30px 0; border: 1px solid rgba(255, 193, 7, 0.3); backdrop-filter: blur(20px); box-shadow: 0 8px 32px rgba(255, 193, 7, 0.15);">
          <h4 style="margin: 0 0 10px 0; color: #fbbf24; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
            <span style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; margin-right: 10px; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);">💰</span>
            High-Value Opportunity
          </h4>
          <p style="margin: 0; font-size: 14px; color: #fde68a; line-height: 1.6; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">Multi-service leads typically have higher conversion rates and larger project values. Respond quickly to maximize your chances!</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: rgba(15, 23, 42, 0.9); padding: 25px 30px; text-align: center; backdrop-filter: blur(20px); border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <p style="font-size: 14px; color: #94a3b8; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
          Lead submitted on ${lead.createdAt.toLocaleDateString()} at ${lead.createdAt.toLocaleTimeString()}<br>
          <strong style="color: #f1f5f9; background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Autobidder</strong> - Lead Management System
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

export async function sendBidRequestNotification(
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
    services?: Array<{ name: string; price: number; }>;
    businessName?: string;
    businessPhone?: string;
    estimatedTimeframe?: string;
    bidRequestId?: string;
    magicToken?: string;
    leadId?: string;
  }
): Promise<boolean> {
  // Fix pricing: Prices are already in dollars, no need to divide by 100
  const formattedPrice = leadDetails.price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  
  const subject = `${leadDetails.businessName || 'Your Service Provider'}: ${formattedPrice} Quote`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Service Quote</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8fafc;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%); padding: 40px 30px; text-align: center; border-radius: 0;">
        <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 16px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);">
          <h1 style="color: white; margin: 0 0 10px 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${leadDetails.businessName || 'Your Service Provider'}</h1>
          <p style="color: #e0f2fe; margin: 0; font-size: 18px; font-weight: 500;">${leadDetails.service} Quote</p>
        </div>
      </div>
      
      <!-- Main Content -->
      <div style="background: white; padding: 40px 30px; margin: 0;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Hi ${customerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 30px; color: #475569; line-height: 1.7;">
          Thank you for your interest in our ${leadDetails.service} service. We've prepared a personalized quote based on your specific requirements.
        </p>
        
        <!-- Services Breakdown (if multiple services) -->
        ${leadDetails.services && leadDetails.services.length > 1 ? `
        <div style="background: #f8fafc; padding: 25px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 20px 0; color: #334155; font-size: 18px; font-weight: 600;">Services Requested</h3>
          ${leadDetails.services.map(service => `
            <div style="background: white; padding: 16px; border-radius: 8px; margin: 8px 0; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <span style="font-weight: 600; color: #475569;">${service.name}</span>
              <span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 14px;">${service.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Price Display -->
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 2px solid #0ea5e9; text-align: center; box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);">
          <h3 style="margin: 0 0 15px 0; color: #0c4a6e; font-size: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${leadDetails.services && leadDetails.services.length > 1 ? 'Total Project Value' : 'Your Quote'}</h3>
          <div style="background: white; padding: 20px; border-radius: 12px; margin: 15px 0; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
            <p style="margin: 0; font-size: 42px; font-weight: 800; color: #0c4a6e; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${formattedPrice}</p>
          </div>
          ${leadDetails.estimatedTimeframe ? `<p style="margin: 10px 0 0 0; color: #0369a1; font-size: 14px; font-weight: 500;">Est. completion: ${leadDetails.estimatedTimeframe}</p>` : ''}
        </div>
        
        <!-- View Proposal Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DOMAIN || 'https://localhost:5000'}/proposal/${leadDetails.leadId || 'unknown'}" 
             style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; font-size: 18px; box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
            View Your Proposal
          </a>
        </div>

        <!-- Next Steps -->
        <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 25px; border-radius: 16px; margin: 30px 0; border-left: 6px solid #f59e0b;">
          <h4 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
            <span style="background: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; margin-right: 10px;">!</span>
            What Happens Next
          </h4>
          <div style="color: #78350f; font-size: 15px; line-height: 1.6;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; font-weight: bold;">1</span>
              Project review within 24 hours
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; font-weight: bold;">2</span>
              Specialist consultation call
            </div>
            <div style="display: flex; align-items: center;">
              <span style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; font-weight: bold;">3</span>
              Detailed estimate and scheduling
            </div>
          </div>
        </div>
        
        ${leadDetails.businessName || leadDetails.businessPhone ? `
        <!-- Contact Info -->
        <div style="background: #f8fafc; padding: 25px; border-radius: 16px; margin: 30px 0; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 15px 0; color: #334155; font-size: 18px; font-weight: 600;">Contact Information</h4>
          ${leadDetails.businessName ? `<p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1e293b;">${leadDetails.businessName}</p>` : ''}
          ${leadDetails.businessPhone ? `<p style="margin: 0; color: #475569; font-size: 15px;">📞 ${leadDetails.businessPhone}</p>` : ''}
        </div>
        ` : ''}
      </div>
      
      <!-- Footer -->
      <div style="background: #1e293b; padding: 25px 30px; text-align: center;">
        <p style="font-size: 14px; color: #94a3b8; margin: 0;">
          <strong style="color: #f1f5f9;">Autobidder</strong> - Professional Service Quotes<br>
          Quote generated on ${new Date().toLocaleDateString()}
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

export async function sendBidResponseNotification(
  customerEmail: string,
  details: {
    customerName: string;
    businessName: string;
    businessPhone?: string;
    businessEmail?: string;
    serviceName: string;
    totalPrice: number;
    quoteMessage?: string;
    bidResponseLink: string;
    emailSubject: string;
    fromName?: string;
  }
): Promise<boolean> {
  const subject = details.emailSubject;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Service Quote is Ready</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📋 Your Quote is Ready!</h1>
        <p style="color: #ddd6fe; margin: 10px 0 0 0; font-size: 16px;">${details.serviceName} Service Quote</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${details.customerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          ${details.quoteMessage || `We've prepared your ${details.serviceName} service quote and it's ready for your review.`}
        </p>
        
        <div style="background: #f3e8ff; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #7c3aed; text-align: center;">
          <h3 style="margin: 0 0 10px 0; color: #5b21b6; font-size: 24px;">Total Quote</h3>
          <p style="margin: 0; font-size: 32px; font-weight: bold; color: #5b21b6;">${(details.totalPrice / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Service: ${details.serviceName}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${details.bidResponseLink}" 
             style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 18px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;">
            ✅ Accept Quote & Book Service
          </a>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
            Click to approve your quote and schedule your appointment
          </p>
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">Your Options:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li><strong>✅ Accept & Book:</strong> Approve the quote and schedule your service appointment</li>
            <li><strong>💬 Request Changes:</strong> Ask for modifications to the pricing or service details</li>
            <li><strong>❌ Decline:</strong> Let us know if you're not interested at this time</li>
          </ul>
        </div>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
          <h4 style="margin: 0 0 10px 0; color: #065f46;">🚀 Ready to Book?</h4>
          <p style="margin: 0; color: #374151;">
            <strong>Love the quote?</strong> Click the button above to instantly approve and schedule your ${details.serviceName} service. 
            You'll be able to choose your preferred date and time right away!
          </p>
        </div>
        
        ${details.businessPhone || details.businessEmail ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e9ecef;">
          <h4 style="margin: 0 0 15px 0; color: #333;">Contact Information</h4>
          <p style="margin: 0 0 5px 0;"><strong>${details.businessName}</strong></p>
          ${details.businessPhone ? `<p style="margin: 0 0 5px 0;">Phone: ${details.businessPhone}</p>` : ''}
          ${details.businessEmail ? `<p style="margin: 0;">Email: ${details.businessEmail}</p>` : ''}
        </div>
        ` : ''}
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>Note:</strong> This quote link is valid for 30 days. Please respond at your earliest convenience.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          <strong>${details.businessName}</strong> - Professional Service Quotes<br>
          Quote sent on ${new Date().toLocaleDateString()}
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: customerEmail,
    from: details.fromName ? `${details.fromName} <noreply@autobidder.org>` : undefined,
    subject,
    html
  });
}

// Password reset email
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetLink: string
): Promise<boolean> {
  const subject = "Reset Your Autobidder Password";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Password Reset Request</h1>
      </div>
      
      <div style="background: #ffffff; padding: 40px 30px;">
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hello ${userName},</h2>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          We received a request to reset your password for your Autobidder account. If you made this request, click the button below to reset your password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
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
          <span style="word-break: break-all; color: #3b82f6;">${resetLink}</span>
        </p>
        
        <p style="font-size: 14px; color: #666;">
          <strong>The Autobidder Team</strong>
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

export async function sendWebsiteSetupEmail(
  userEmail: string,
  userName: string,
  setupLink: string,
  websiteName: string = "Your Website"
): Promise<boolean> {
  const subject = "Your Autobidder Website is Ready to Customize!";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Website Setup Link</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
        <div style="background: rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 20px; backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
          <h1 style="color: white; margin: 0 0 10px 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,0.5); background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">🎉 Your Website is Ready!</h1>
          <p style="color: #e2e8f0; margin: 0; font-size: 18px; font-weight: 500;">${websiteName}</p>
        </div>
      </div>
      
      <!-- Main Content -->
      <div style="background: #ffffff; padding: 40px 30px;">
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hello ${userName},</h2>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Exciting news! Your website has been successfully created and is ready for customization. Click the button below to access your website editor and start building your online presence.
        </p>
        
        <div style="background: rgba(59, 130, 246, 0.05); padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid rgba(59, 130, 246, 0.1);">
          <h3 style="margin: 0 0 15px 0; color: #3b82f6; font-size: 18px; display: flex; align-items: center;">
            <span style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; margin-right: 12px;">🚀</span>
            What You Can Do Next:
          </h3>
          <ul style="padding-left: 20px; margin: 0; color: #334155;">
            <li style="margin-bottom: 8px;"><strong>Customize Your Design:</strong> Choose colors, fonts, and layouts that match your brand</li>
            <li style="margin-bottom: 8px;"><strong>Add Your Content:</strong> Upload images, write compelling copy, and showcase your services</li>
            <li style="margin-bottom: 8px;"><strong>Integrate Your Calculators:</strong> Embed your Autobidder pricing tools directly into your site</li>
            <li style="margin-bottom: 8px;"><strong>Go Live:</strong> Publish your website and start attracting customers</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupLink}" 
             style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3); font-size: 16px;">
            Start Customizing Your Website →
          </a>
        </div>
        
        <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 25px 0;">
          <p style="margin: 0; color: #047857; font-size: 14px;">
            <strong>✅ Pro Tip:</strong> Your website editor will save automatically as you work, so you can take your time to create something amazing!
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
          This secure link will take you directly to your website editor. You can bookmark this link to access your website anytime, or you can always find it in your Autobidder dashboard.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="word-break: break-all; color: #3b82f6; background: #f8fafc; padding: 8px; border-radius: 4px; display: inline-block; margin-top: 8px;">${setupLink}</span>
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 25px;">
          Need help getting started? Our support team is here to help!<br><br>
          <strong>The Autobidder Team</strong>
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