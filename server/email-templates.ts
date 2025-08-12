// This file now uses Resend through the email-providers system
// All email functions route through the unified email system

// Helper function to get the correct base URL
function getBaseUrl(): string {
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  return process.env.DOMAIN || 'https://localhost:5000';
}

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
export async function sendWebsiteActivationEmail(
  userEmail: string, 
  userName: string, 
  websiteUrl: string, 
  websiteName: string, 
  siteName: string
): Promise<boolean> {
  const subject = `Your website ${websiteName} is ready! 🌐`;
  
  const html = createUnifiedEmailTemplate({
    title: "🌐 Your Website is Ready!",
    subtitle: `Hi ${userName}, your website has been created successfully`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        Congratulations! Your website "${websiteName}" has been created and is ready for you to customize.
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        Your new website is now live and accessible. You can start customizing it right away to match your business needs.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${websiteUrl}" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Your Website →
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        You can now customize your website design, add content, and make it truly yours. Access your website management dashboard to get started.
      </p>
    `,
    cardTitle: "Website Details:",
    cardContent: `
      <div style="color: #4b5563;">
        <p style="margin-bottom: 12px;"><strong>Website Name:</strong> ${websiteName}</p>
        <p style="margin-bottom: 12px;"><strong>Site ID:</strong> ${siteName}</p>
        <p style="margin-bottom: 12px;"><strong>Website URL:</strong> <a href="${websiteUrl}" style="color: #2563eb; text-decoration: none;">${websiteUrl}</a></p>
        <p style="margin-bottom: 0;"><strong>Status:</strong> Active & Ready for Customization</p>
      </div>
    `,
    footerText: "Your website is ready • Autobidder Website Builder",
    accentColor: "#059669"
  });
  
  return await sendEmail({
    to: userEmail,
    from: 'Autobidder <noreply@autobidder.org>',
    subject,
    html
  });
}

export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  const subject = "Welcome to Autobidder!";
  
  const html = createUnifiedEmailTemplate({
    title: "Welcome to Autobidder!",
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
    cardTitle: "What you can do now:",
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
  const subject = "Your Autobidder setup is complete!";
  
  const html = createUnifiedEmailTemplate({
    title: "Setup Complete!",
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
    cardTitle: "Ready to get started?",
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
  const subject = `Welcome to ${planName} - Subscription Confirmed`;
  
  const html = createUnifiedEmailTemplate({
    title: "Subscription Confirmed!",
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
    cardTitle: `Your ${planName} benefits:`,
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
    subtotal?: number;
    taxAmount?: number;
    bundleDiscountAmount?: number;
    variables: any;
    calculatedAt: Date;
    createdAt: Date;
    appliedDiscounts?: Array<{
      id: string;
      name: string;
      percentage: number;
      amount: number;
    }>;
    selectedUpsells?: Array<{
      id: string;
      name: string;
      description?: string;
      percentageOfMain: number;
      amount: number;
      category?: string;
    }>;
  }
): Promise<boolean> {
  // Get business settings for custom branding
  const { storage } = await import('./storage');
  const businessSettings = await storage.getBusinessSettings();
  const businessName = businessSettings?.businessName || 'Autobidder';
  
  // Format pricing: totalPrice is already in cents, so convert to dollars
  const formattedPrice = (lead.totalPrice / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  
  const subject = `${businessName} Prospect: ${formattedPrice}`;
  
  const html = createUnifiedEmailTemplate({
    title: "New Lead Alert!",
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
        <a href="${getBaseUrl()}/leads" 
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
    cardTitle: "Customer Information",
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
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Service Price:</span>
          <span>$${((lead.subtotal || lead.totalPrice) / 100).toLocaleString()}</span>
        </div>
        ${lead.appliedDiscounts && lead.appliedDiscounts.length > 0 ? `
        <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600; color: #dc2626;">Applied Discounts:</span>
          ${lead.appliedDiscounts.map(discount => `
            <div style="padding: 4px 0; margin-left: 16px;">
              <span>${discount.name} (-${discount.percentage}%): -$${(discount.amount / 100).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
        ${lead.taxAmount && lead.taxAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600; color: #1f2937;">Sales Tax:</span>
          <span style="color: #1f2937;">+$${(lead.taxAmount / 100).toFixed(2)}</span>
        </div>
        ` : ''}
        ${lead.selectedUpsells && lead.selectedUpsells.length > 0 ? `
        <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600; color: #059669;">Selected Add-ons:</span>
          ${lead.selectedUpsells.map(upsell => `
            <div style="padding: 4px 0; margin-left: 16px;">
              <span>${upsell.name} (+${upsell.percentageOfMain}%): +$${(upsell.amount / 100).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #d1d5db; margin-top: 8px;">
          <span style="font-weight: 700; color: #1f2937;">Total Project Value:</span>
          <span style="font-weight: 700; color: #16a34a; font-size: 18px;">${formattedPrice}</span>
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
    from: `${businessName} <${businessSettings?.businessEmail || 'noreply@autobidder.org'}>`,
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
    subtotal?: number;
    taxAmount?: number;
    bundleDiscountAmount?: number;
    createdAt: Date;
  }
): Promise<boolean> {
  // Get business settings for custom branding
  const { storage } = await import('./storage');
  const businessSettings = await storage.getBusinessSettings();
  const businessName = businessSettings?.businessName || 'Autobidder';
  
  // Fix pricing: Prices are stored in cents, so divide by 100
  const formattedTotalPrice = (lead.totalPrice / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  
  const subject = `${businessName} Prospect: ${formattedTotalPrice}`;
  
  const servicesList = lead.services.map(service => {
    // Service prices in multi-service leads are already in dollars, not cents
    const formattedServicePrice = service.price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    return `<div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 12px; margin: 8px 0; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: 600; color: #1f2937;">${service.name}</span>
      <span style="background-color: #16a34a; color: white; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 14px;">${formattedServicePrice}</span>
    </div>`;
  }).join('');
  
  const html = createUnifiedEmailTemplate({
    title: "Multi-Service Lead Alert!",
    subtitle: `${lead.services.length} Services - ${formattedTotalPrice} Total`,
    mainContent: `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; display: inline-block;">
          <h3 style="color: #15803d; font-size: 36px; font-weight: 800; margin: 0;">
            ${formattedTotalPrice}
          </h3>
          <p style="color: #16a34a; font-size: 14px; margin: 5px 0 0 0;">Total Project Value</p>
        </div>
      </div>
      
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px; text-align: center;">
        Great news! You have a new multi-service lead with ${lead.services.length} services.
      </h2>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">High-Value Opportunity</h4>
        <p style="color: #92400e; margin: 0; font-size: 14px;">Multi-service leads typically have higher conversion rates and larger project values. Respond quickly to maximize your chances!</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${getBaseUrl()}/leads" 
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
    cardTitle: "Customer Information",
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
        <div style="margin-top: 16px;">
          <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">Services Requested (${lead.services.length}):</h4>
          ${servicesList}
          
          <!-- Price Breakdown -->
          <div style="margin-top: 16px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Price Breakdown:</h4>
            
            <!-- Services Subtotal -->
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Services Subtotal:</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 500;">$${lead.services.reduce((sum, service) => sum + service.price, 0).toLocaleString()}</span>
            </div>
            
            <!-- Bundle Discount (if applicable) -->
            ${lead.bundleDiscountAmount && lead.bundleDiscountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #16a34a; font-size: 14px;">Bundle Discount:</span>
              <span style="color: #16a34a; font-size: 14px; font-weight: 500;">-$${((lead.bundleDiscountAmount) / 100).toLocaleString()}</span>
            </div>
            ` : ''}
            
            <!-- Tax (if applicable) -->
            ${lead.taxAmount && lead.taxAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Sales Tax:</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 500;">$${((lead.taxAmount) / 100).toLocaleString()}</span>
            </div>
            ` : ''}
            
            <!-- Total -->
            <div style="display: flex; justify-content: space-between; padding: 8px 0 0 0; margin-top: 8px; border-top: 2px solid #d1d5db;">
              <span style="color: #1f2937; font-size: 16px; font-weight: 600;">Total Project Value:</span>
              <span style="color: #16a34a; font-size: 16px; font-weight: 700;">${formattedTotalPrice}</span>
            </div>
          </div>
        </div>
      </div>
    `,
    accentColor: "#16a34a"
  });

  return await sendEmail({
    to: ownerEmail,
    from: `${businessName} <${businessSettings?.businessEmail || 'noreply@autobidder.org'}>`,
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
  const subject = `New Appointment Booked: ${bookingDetails.service}`;
  
  const html = createUnifiedEmailTemplate({
    title: "New Appointment Booked!",
    subtitle: `${bookingDetails.service} Service`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        Great news! You have a new appointment booking for ${bookingDetails.service}.
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        A customer has scheduled an appointment with you. Please review the details below and make sure to prepare for the scheduled service.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${getBaseUrl()}/calendar" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 0 8px 8px 0;">
          View Calendar
        </a>
        <a href="mailto:${bookingDetails.customerEmail}" 
           style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 0 8px 8px 0;">
          Contact Customer
        </a>
      </div>
    `,
    cardTitle: "Appointment Details",
    cardContent: `
      <div style="color: #4b5563;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Service:</span>
          <span>${bookingDetails.service}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Date:</span>
          <span>${bookingDetails.appointmentDate.toLocaleDateString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Time:</span>
          <span>${bookingDetails.appointmentTime}</span>
        </div>
        ${bookingDetails.notes ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Notes:</span>
          <span>${bookingDetails.notes}</span>
        </div>
        ` : ''}
        <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
          <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">Customer Information:</h4>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="font-weight: 600;">Name:</span>
            <span>${bookingDetails.customerName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="font-weight: 600;">Email:</span>
            <span>${bookingDetails.customerEmail}</span>
          </div>
          ${bookingDetails.customerPhone ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="font-weight: 600;">Phone:</span>
            <span>${bookingDetails.customerPhone}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `,
    footerText: "This appointment notification was sent by Autobidder • Your Business Growth Platform",
    accentColor: "#f59e0b"
  });

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
  const subject = `Bid Response Required: ${bidDetails.service}`;
  
  const html = createUnifiedEmailTemplate({
    title: "Bid Response Required",
    subtitle: `${bidDetails.service} Project`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        A customer is requesting a bid for ${bidDetails.service}.
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        Please review the project details below and respond with your bid. This is an opportunity to win new business!
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${getBaseUrl()}/verify-bid/${bidDetails.bidId}" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          Review & Respond to Bid
        </a>
      </div>
    `,
    cardTitle: "Project Information",
    cardContent: `
      <div style="color: #4b5563;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Service:</span>
          <span>${bidDetails.service}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Customer:</span>
          <span>${bidDetails.customerName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Email:</span>
          <span>${bidDetails.customerEmail}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="font-weight: 600;">Estimated Price:</span>
          <span style="font-weight: 700; color: #16a34a;">$${bidDetails.estimatedPrice.toLocaleString()}</span>
        </div>
      </div>
    `,
    footerText: "This bid request was sent by Autobidder • Your Business Growth Platform",
    accentColor: "#3b82f6"
  });

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
  const estimateUrl = `${getBaseUrl()}/estimate/${estimateDetails.estimateId}`;
  
  const html = createUnifiedEmailTemplate({
    title: "Your Estimate is Ready!",
    subtitle: `Professional ${estimateDetails.service} Service`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        Hi ${customerName}!
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        Thank you for your interest in our ${estimateDetails.service} service. We've prepared a detailed estimate for your project.
      </p>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; display: inline-block;">
          <h3 style="color: #15803d; font-size: 24px; margin: 0 0 5px 0;">Total Estimate</h3>
          <p style="color: #16a34a; font-size: 32px; font-weight: 800; margin: 0;">
            $${estimateDetails.price.toLocaleString()}
          </p>
          ${estimateDetails.validUntil ? `<p style="color: #16a34a; font-size: 14px; margin: 5px 0 0 0;">Valid until ${estimateDetails.validUntil.toLocaleDateString()}</p>` : ''}
        </div>
      </div>
      
      ${estimateDetails.notes ? `
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">Project Notes</h4>
        <p style="color: #92400e; margin: 0; font-size: 14px;">${estimateDetails.notes}</p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${estimateUrl}" 
           style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
          View Full Estimate
        </a>
      </div>
      
      <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">What's Next?</h4>
        <ul style="color: #1e40af; margin: 0; padding-left: 18px; font-size: 14px;">
          <li style="margin-bottom: 4px;">Review your detailed estimate using the link above</li>
          <li style="margin-bottom: 4px;">Schedule a consultation if you have questions</li>
          <li>Accept the estimate to move forward with your project</li>
        </ul>
      </div>
    `,
    cardTitle: estimateDetails.businessName || estimateDetails.businessPhone ? "Contact Information" : undefined,
    cardContent: estimateDetails.businessName || estimateDetails.businessPhone ? `
      <div style="color: #4b5563;">
        ${estimateDetails.businessName ? `<p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${estimateDetails.businessName}</p>` : ''}
        ${estimateDetails.businessPhone ? `<p style="margin: 0; color: #6b7280;">Phone: ${estimateDetails.businessPhone}</p>` : ''}
      </div>
    ` : undefined,
    footerText: `This estimate was generated on ${new Date().toLocaleDateString()} • Autobidder Professional Service Estimates`,
    accentColor: "#16a34a"
  });

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
  
  const html = createUnifiedEmailTemplate({
    title: "Appointment Confirmed!",
    subtitle: `${bookingDetails.service} Service`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        Hi ${customerName}!
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        Your appointment has been confirmed! We're looking forward to providing you with excellent ${bookingDetails.service} service.
      </p>
      
      ${bookingDetails.notes ? `
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">Special Notes</h4>
        <p style="color: #92400e; margin: 0; font-size: 14px;">${bookingDetails.notes}</p>
      </div>
      ` : ''}
      
      <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">Before Your Appointment</h4>
        <ul style="color: #1e40af; margin: 0; padding-left: 18px; font-size: 14px;">
          <li style="margin-bottom: 4px;">Please ensure easy access to the service area</li>
          <li style="margin-bottom: 4px;">Have any relevant documents or materials ready</li>
          <li>Feel free to contact us if you have any questions</li>
        </ul>
      </div>
      
      <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #dc2626; margin: 0 0 8px 0; font-size: 16px;">Need to Reschedule?</h4>
        <p style="color: #dc2626; margin: 0; font-size: 14px;">
          If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.
        </p>
      </div>
    `,
    cardTitle: "Appointment Details",
    cardContent: `
      <div style="color: #4b5563;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Service:</span>
          <span>${bookingDetails.service}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Date:</span>
          <span>${bookingDetails.appointmentDate.toLocaleDateString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Time:</span>
          <span>${bookingDetails.appointmentTime}</span>
        </div>
        ${bookingDetails.address ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Location:</span>
          <span>${bookingDetails.address}</span>
        </div>
        ` : ''}
        ${bookingDetails.businessName || bookingDetails.businessPhone || bookingDetails.businessEmail ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
          <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">Contact Information:</h4>
          ${bookingDetails.businessName ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="font-weight: 600;">Business:</span>
            <span>${bookingDetails.businessName}</span>
          </div>
          ` : ''}
          ${bookingDetails.businessPhone ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="font-weight: 600;">Phone:</span>
            <span>${bookingDetails.businessPhone}</span>
          </div>
          ` : ''}
          ${bookingDetails.businessEmail ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="font-weight: 600;">Email:</span>
            <span>${bookingDetails.businessEmail}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
    `,
    footerText: `Confirmation sent on ${new Date().toLocaleDateString()} • Autobidder Professional Service Booking`,
    accentColor: "#f59e0b"
  });

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
  const estimateUrl = `${getBaseUrl()}/estimate/${estimateDetails.estimateId}`;
  const priceChange = estimateDetails.revisedPrice - estimateDetails.originalPrice;
  const isIncrease = priceChange > 0;
  
  const html = createUnifiedEmailTemplate({
    title: "Revised Estimate",
    subtitle: `Updated ${estimateDetails.service} Pricing`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        Hi ${customerName}!
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        We've reviewed your ${estimateDetails.service} project and have an updated estimate for you.
      </p>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background-color: ${isIncrease ? '#fef2f2' : '#f0fdf4'}; border: 2px solid ${isIncrease ? '#ef4444' : '#22c55e'}; border-radius: 12px; padding: 20px; display: inline-block; max-width: 400px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="color: #6b7280; text-decoration: line-through;">Original:</span>
            <span style="color: #6b7280; text-decoration: line-through; font-size: 18px;">$${estimateDetails.originalPrice.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 600; color: #1f2937;">Revised:</span>
            <span style="color: ${isIncrease ? '#dc2626' : '#16a34a'}; font-size: 24px; font-weight: 800;">$${estimateDetails.revisedPrice.toLocaleString()}</span>
          </div>
          <div style="padding-top: 8px; border-top: 1px solid ${isIncrease ? '#fca5a5' : '#86efac'};">
            <span style="color: ${isIncrease ? '#dc2626' : '#16a34a'}; font-weight: 600; font-size: 14px;">
              ${isIncrease ? 'Increase' : 'Savings'}: $${Math.abs(priceChange).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      ${estimateDetails.revisionReason ? `
      <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px;">Reason for Revision</h4>
        <p style="color: #1e40af; margin: 0; font-size: 14px;">${estimateDetails.revisionReason}</p>
      </div>
      ` : ''}
      
      ${estimateDetails.validUntil ? `
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">⏰ Validity</h4>
        <p style="color: #92400e; margin: 0; font-size: 14px;">This revised estimate is valid until ${estimateDetails.validUntil.toLocaleDateString()}</p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${estimateUrl}" 
           style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
          View Updated Estimate
        </a>
      </div>
      
      <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px;">❓ Questions About Changes?</h4>
        <p style="color: #1e40af; margin: 0; font-size: 14px;">
          We're happy to discuss any questions you may have about the revised pricing. Please don't hesitate to reach out to us.
        </p>
      </div>
    `,
    cardTitle: estimateDetails.businessName ? "Contact Information" : undefined,
    cardContent: estimateDetails.businessName ? `
      <div style="color: #4b5563;">
        <p style="margin: 0; font-size: 16px; font-weight: 600;">${estimateDetails.businessName}</p>
      </div>
    ` : undefined,
    footerText: `Revision sent on ${new Date().toLocaleDateString()} • Autobidder Professional Service Estimates`,
    accentColor: "#3b82f6"
  });

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
    businessOwnerId?: string;
  }
): Promise<boolean> {
  // Get email settings and templates for custom branding
  const { storage } = await import('./storage');
  let emailSettings;
  let businessSettings;
  let customTemplate;
  
  try {
    // Try to get email settings using businessOwnerId if provided
    if (leadDetails.businessOwnerId) {
      emailSettings = await storage.getEmailSettings(leadDetails.businessOwnerId);
      customTemplate = await storage.getEmailTemplateByTrigger(leadDetails.businessOwnerId, 'lead_submitted');
    }
    
    // Get business settings for fallback values
    businessSettings = await storage.getBusinessSettings();
    
    // If no email settings found but we have business settings, try with business owner
    if (!emailSettings && businessSettings?.userId) {
      emailSettings = await storage.getEmailSettings(businessSettings.userId);
      if (!customTemplate) {
        customTemplate = await storage.getEmailTemplateByTrigger(businessSettings.userId, 'lead_submitted');
      }
    }
  } catch (error) {
    console.error('Error retrieving email settings:', error);
  }

  // Fix pricing: Convert from cents to dollars for display
  const formattedPrice = (leadDetails.price / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  
  // Use custom subject template if available, otherwise use default
  const businessName = leadDetails.businessName || businessSettings?.businessName || 'Your Service Provider';
  let subject = `${businessName}: ${formattedPrice} Quote`;
  
  // Check if user has a custom template with subject
  if (customTemplate && customTemplate.subject) {
    // Replace template variables in the subject
    subject = customTemplate.subject
      .replace(/\{\{businessName\}\}/g, businessName)
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{formattedPrice\}\}/g, formattedPrice)
      .replace(/\{\{service\}\}/g, leadDetails.service);
  }
  
  const servicesList = leadDetails.services && leadDetails.services.length > 1 ? 
    leadDetails.services.map(service => {
      const formattedServicePrice = (service.price / 100).toLocaleString('en-US', {
        style: 'currency', 
        currency: 'USD'
      });
      return `<div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 12px; margin: 8px 0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 600; color: #1f2937;">${service.name}</span>
        <span style="background-color: #16a34a; color: white; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 14px;">${formattedServicePrice}</span>
      </div>`;
    }).join('') : '';
  
  // Use custom HTML template if available, otherwise use default
  let html;
  if (customTemplate && customTemplate.htmlContent) {
    // Replace template variables in the custom HTML
    html = customTemplate.htmlContent
      .replace(/\{\{businessName\}\}/g, businessName)
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{formattedPrice\}\}/g, formattedPrice)
      .replace(/\{\{service\}\}/g, leadDetails.service)
      .replace(/\{\{businessPhone\}\}/g, leadDetails.businessPhone || businessSettings?.businessPhone || '')
      .replace(/\{\{estimatedTimeframe\}\}/g, leadDetails.estimatedTimeframe || '');
  } else {
    // Use the default template
    html = createUnifiedEmailTemplate({
      title: `${leadDetails.businessName || 'Your Service Provider'}`,
      subtitle: `${leadDetails.service} Quote`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        Hi ${customerName}!
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        Thank you for your interest in our ${leadDetails.service} service. We've prepared a personalized quote based on your specific requirements.
      </p>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; display: inline-block;">
          <h3 style="color: #15803d; font-size: 24px; margin: 0 0 5px 0;">${leadDetails.services && leadDetails.services.length > 1 ? 'Total Project Value' : 'Your Quote'}</h3>
          <p style="color: #16a34a; font-size: 36px; font-weight: 800; margin: 0;">
            ${formattedPrice}
          </p>
          ${leadDetails.estimatedTimeframe ? `<p style="color: #16a34a; font-size: 14px; margin: 5px 0 0 0;">Est. completion: ${leadDetails.estimatedTimeframe}</p>` : ''}
        </div>
      </div>
      
      ${leadDetails.services && leadDetails.services.length > 1 ? `
      <div style="margin: 20px 0;">
        <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">Services Requested (${leadDetails.services.length}):</h4>
        ${servicesList}
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${getBaseUrl()}/proposal/${leadDetails.leadId || 'unknown'}" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
          View Your Proposal
        </a>
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">What Happens Next</h4>
        <ul style="color: #92400e; margin: 0; padding-left: 18px; font-size: 14px;">
          <li style="margin-bottom: 4px;">Project review within 24 hours</li>
          <li style="margin-bottom: 4px;">Specialist consultation call</li>
          <li>Detailed estimate and scheduling</li>
        </ul>
      </div>
    `,
    cardTitle: leadDetails.businessName || leadDetails.businessPhone ? "Contact Information" : undefined,
    cardContent: leadDetails.businessName || leadDetails.businessPhone ? `
      <div style="color: #4b5563;">
        ${leadDetails.businessName ? `<p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${leadDetails.businessName}</p>` : ''}
        ${leadDetails.businessPhone ? `<p style="margin: 0; color: #6b7280;">Phone: ${leadDetails.businessPhone}</p>` : ''}
      </div>
    ` : undefined,
      footerText: `Quote generated on ${new Date().toLocaleDateString()} • Autobidder Professional Service Quotes`,
      accentColor: "#2563eb"
    });
  }

  // Determine the "from" email address and name
  const fromEmail = emailSettings?.businessEmail || businessSettings?.businessEmail || 'noreply@autobidder.org';
  const fromName = emailSettings?.fromName || businessName;
  
  // Sanitize fromName to ensure valid email format
  const sanitizedFromName = fromName && fromName.trim() ? fromName.trim() : 'Autobidder';
  const fromAddress = `${sanitizedFromName} <${fromEmail}>`;

  return await sendEmail({
    to: customerEmail,
    from: fromAddress,
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
  
  const html = createUnifiedEmailTemplate({
    title: "Appointment Confirmed!",
    subtitle: `${bookingDetails.service} Service`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        Hi ${customerName}!
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        Your appointment has been confirmed! We're looking forward to providing you with excellent service.
      </p>
      
      <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">Before Your Appointment</h4>
        <ul style="color: #1e40af; margin: 0; padding-left: 18px; font-size: 14px;">
          <li style="margin-bottom: 4px;">Please ensure easy access to the service area</li>
          <li style="margin-bottom: 4px;">Have any relevant documents ready</li>
          <li>Contact us if you have any questions</li>
        </ul>
      </div>
    `,
    cardTitle: "Appointment Details",
    cardContent: `
      <div style="color: #4b5563;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Service:</span>
          <span>${bookingDetails.service}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Date:</span>
          <span>${bookingDetails.appointmentDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Time:</span>
          <span>${bookingDetails.appointmentTime}</span>
        </div>
        ${bookingDetails.address ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Location:</span>
          <span>${bookingDetails.address}</span>
        </div>
        ` : ''}
        ${bookingDetails.businessName || bookingDetails.businessPhone ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
          <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">Contact Information:</h4>
          ${bookingDetails.businessName ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="font-weight: 600;">Business:</span>
            <span>${bookingDetails.businessName}</span>
          </div>
          ` : ''}
          ${bookingDetails.businessPhone ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="font-weight: 600;">Phone:</span>
            <span>${bookingDetails.businessPhone}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
    `,
    footerText: `Confirmed on ${new Date().toLocaleDateString()} • Autobidder Professional Service Booking`,
    accentColor: "#f59e0b"
  });

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
  
  const html = createUnifiedEmailTemplate({
    title: "Updated Bid",
    subtitle: `${bidDetails.service} Project`,
    mainContent: `
      <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">
        Hi ${customerName}!
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        We've reviewed your ${bidDetails.service} project and have an updated bid for you.
      </p>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background-color: ${isIncrease ? '#fef2f2' : '#f0fdf4'}; border: 2px solid ${isIncrease ? '#ef4444' : '#22c55e'}; border-radius: 12px; padding: 20px; display: inline-block; max-width: 400px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="color: #6b7280; text-decoration: line-through;">Original:</span>
            <span style="color: #6b7280; text-decoration: line-through; font-size: 18px;">$${bidDetails.originalPrice.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 600; color: #1f2937;">Updated:</span>
            <span style="color: ${isIncrease ? '#dc2626' : '#16a34a'}; font-size: 24px; font-weight: 800;">$${bidDetails.revisedPrice.toLocaleString()}</span>
          </div>
          <div style="padding-top: 8px; border-top: 1px solid ${isIncrease ? '#fca5a5' : '#86efac'};">
            <span style="color: ${isIncrease ? '#dc2626' : '#16a34a'}; font-weight: 600; font-size: 14px;">
              ${isIncrease ? 'Increase' : 'Savings'}: $${Math.abs(priceChange).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      ${bidDetails.revisionReason ? `
      <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px;">Reason for Update</h4>
        <p style="color: #1e40af; margin: 0; font-size: 14px;">${bidDetails.revisionReason}</p>
      </div>
      ` : ''}
      
      <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px;">❓ Questions?</h4>
        <p style="color: #1e40af; margin: 0; font-size: 14px;">
          We're happy to discuss any questions you may have about the updated pricing. Please contact us anytime.
        </p>
      </div>
    `,
    cardTitle: bidDetails.businessName ? "Contact Information" : undefined,
    cardContent: bidDetails.businessName ? `
      <div style="color: #4b5563;">
        <p style="margin: 0; font-size: 16px; font-weight: 600;">${bidDetails.businessName}</p>
      </div>
    ` : undefined,
    footerText: `Updated on ${new Date().toLocaleDateString()} • Autobidder Professional Service Bids`,
    accentColor: "#3b82f6"
  });

  return await sendEmail({
    to: customerEmail,
    from: 'Autobidder <noreply@autobidder.org>',
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
        <h1 style="color: white; margin: 0; font-size: 28px;">Your Quote is Ready!</h1>
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
            Accept Quote & Book Service
          </a>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
            Click to approve your quote and schedule your appointment
          </p>
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">Your Options:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li><strong>Accept & Book:</strong> Approve the quote and schedule your service appointment</li>
            <li><strong>Request Changes:</strong> Ask for modifications to the pricing or service details</li>
            <li><strong>Decline:</strong> Let us know if you're not interested at this time</li>
          </ul>
        </div>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
          <h4 style="margin: 0 0 10px 0; color: #065f46;">Ready to Book?</h4>
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

  // Sanitize fromName to ensure valid email format
  const sanitizedFromName = details.fromName && details.fromName.trim() ? details.fromName.trim() : null;
  const fromAddress = sanitizedFromName ? `${sanitizedFromName} <noreply@autobidder.org>` : 'Autobidder <noreply@autobidder.org>';

  return await sendEmail({
    to: customerEmail,
    from: fromAddress,
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
          <h1 style="color: white; margin: 0 0 10px 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,0.5); background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Your Website is Ready!</h1>
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
            <span style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; margin-right: 12px;">→</span>
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
            <strong>Pro Tip:</strong> Your website editor will save automatically as you work, so you can take your time to create something amazing!
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