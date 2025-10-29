import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const initialServices = [
  {
    name: "DFY Website Design (Basic)",
    description: "Complete professional website design and development service. We'll create a modern, responsive website tailored to your business with up to 5 pages, professional content, SEO optimization, and mobile-friendly design. Includes custom domain setup, hosting configuration, and 30 days of support.",
    shortDescription: "Professional website design with up to 5 pages, SEO optimization, and mobile-friendly responsive design.",
    price: 49700, // $497.00 in cents
    features: [
      "Up to 5 custom pages",
      "Mobile-responsive design",
      "SEO optimization",
      "Professional content creation",
      "Custom domain setup",
      "30 days of support",
      "Social media integration",
      "Contact forms and lead capture"
    ],
    category: "website",
    estimatedDelivery: "5-7 business days",
    popularService: true,
    isActive: true,
    displayOrder: 1
  },
  {
    name: "DFY Website (SEO Boost)",
    description: "Advanced SEO optimization service for your website. Comprehensive SEO audit, keyword research, on-page optimization, local SEO setup, Google My Business optimization, and ongoing SEO strategy. Includes technical SEO improvements, content optimization, and monthly performance reports.",
    shortDescription: "Comprehensive SEO optimization with keyword research, local SEO setup, and ongoing performance monitoring.",
    price: 99700, // $997.00 in cents
    features: [
      "Complete SEO audit",
      "Keyword research and strategy",
      "On-page optimization",
      "Local SEO setup",
      "Google My Business optimization",
      "Technical SEO improvements",
      "Content optimization",
      "Monthly performance reports"
    ],
    category: "seo",
    estimatedDelivery: "7-10 business days",
    popularService: true,
    isActive: true,
    displayOrder: 2
  },
  {
    name: "Add Extra Website Page",
    description: "Professional additional page design and development for your existing website. Each page includes custom design, responsive layout, SEO optimization, and content integration. Perfect for adding new services, testimonials, case studies, or any specialized content pages.",
    shortDescription: "Add a professionally designed page to your existing website with custom content and SEO optimization.",
    price: 9700, // $97.00 in cents
    features: [
      "Custom page design",
      "Responsive mobile layout",
      "SEO optimized content",
      "Professional copywriting",
      "Image optimization",
      "Navigation integration",
      "Fast loading optimization"
    ],
    category: "website",
    estimatedDelivery: "2-3 business days",
    popularService: false,
    isActive: true,
    displayOrder: 3
  },
  {
    name: "Setup Autobidder",
    description: "Professional custom calculation setup service. We'll create personalized pricing calculations tailored to your business needs and discuss your pricing system in detail during a dedicated 30-minute consultation call.",
    shortDescription: "Custom calculations tailored to your business with a 30-minute consultation call.",
    price: 29700, // $297.00 in cents
    features: [
      "Creating custom calculations for the user",
      "30 minute call to discuss their pricing system"
    ],
    category: "setup",
    estimatedDelivery: "3-5 business days",
    popularService: false,
    isActive: true,
    displayOrder: 4
  },
  {
    name: "Full Autobidder Setup",
    description: "Complete end-to-end Autobidder setup service. Our team will fully customize your pricing calculators, set up your website using one of our professional templates, customize the design to match your brand, and integrate with your CRM system. This is our most comprehensive package for businesses ready to launch with a complete solution.",
    shortDescription: "Complete Autobidder setup with up to 8 services, full website customization, template setup, and CRM integration.",
    price: 99700, // $997.00 in cents
    stripePriceId: "price_1QfGpRDXrzsHxNnTMSL7MBmC",
    features: [
      "Up to 8 services",
      "Full website customization",
      "Using one of our templates",
      "Full Design Customization",
      "CRM Integration"
    ],
    category: "setup",
    estimatedDelivery: "7-10 business days",
    popularService: true,
    isActive: true,
    displayOrder: 5
  }
];

async function seedDfyServices() {
  try {
    console.log('Seeding DFY services...');
    
    for (const service of initialServices) {
      const result = await pool.query(`
        INSERT INTO dfy_services (
          name, description, short_description, price, features, category, 
          estimated_delivery, popular_service, is_active, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (name) DO UPDATE SET
          description = EXCLUDED.description,
          short_description = EXCLUDED.short_description,
          price = EXCLUDED.price,
          features = EXCLUDED.features,
          category = EXCLUDED.category,
          estimated_delivery = EXCLUDED.estimated_delivery,
          popular_service = EXCLUDED.popular_service,
          is_active = EXCLUDED.is_active,
          display_order = EXCLUDED.display_order
        RETURNING id, name
      `, [
        service.name,
        service.description,
        service.shortDescription,
        service.price,
        JSON.stringify(service.features),
        service.category,
        service.estimatedDelivery,
        service.popularService,
        service.isActive,
        service.displayOrder
      ]);
      
      console.log(`✓ Seeded service: ${service.name} (ID: ${result.rows[0]?.id})`);
    }
    
    console.log('✅ DFY services seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding DFY services:', error);
  } finally {
    await pool.end();
  }
}

seedDfyServices();
