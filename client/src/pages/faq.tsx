import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Search, 
  Calculator, 
  Settings, 
  CreditCard, 
  Users, 
  FileText,
  ChevronDown,
  ChevronRight,
  Mail
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SupportContact from "@/components/support-contact";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: HelpCircle,
      color: "blue",
      questions: [
        {
          question: "What is Autobidder and how does it work?",
          answer: "Autobidder is a comprehensive platform that helps businesses create interactive pricing calculators, manage leads, and streamline their quoting process. It allows you to build custom calculators that potential customers can use to get instant price estimates, which are then automatically captured as leads in your dashboard."
        },
        {
          question: "How do I create my first pricing calculator?",
          answer: "To create your first calculator: 1) Log in to your dashboard, 2) Navigate to 'Formulas' in the sidebar, 3) Click 'Create New Formula', 4) Define your variables and pricing logic, 5) Customize the design, and 6) Generate your embed code to add it to your website."
        },
        {
          question: "Can I try Autobidder before purchasing?",
          answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card is required to start your trial. You can upgrade to a paid plan at any time during or after your trial period."
        },
        {
          question: "How long does it take to set up?",
          answer: "Most users can create their first working calculator in under 15 minutes. Our intuitive formula builder and pre-built templates make it easy to get started quickly. More complex calculators with advanced features may take 30-60 minutes to set up."
        }
      ]
    },
    {
      id: "features",
      title: "Features & Functionality",
      icon: Calculator,
      color: "purple",
      questions: [
        {
          question: "What types of calculators can I create?",
          answer: "You can create virtually any type of pricing calculator including: service-based calculators, product configurators, ROI calculators, measurement-based pricing, subscription calculators, and more. Our flexible formula builder supports complex calculations with conditional logic, custom variables, and multi-step forms."
        },
        {
          question: "Can I customize the look and feel of my calculators?",
          answer: "Absolutely! You have full control over colors, fonts, layouts, and branding. You can match your calculator to your website's design perfectly. Professional and Enterprise plans offer even more advanced customization options including custom CSS."
        },
        {
          question: "Does Autobidder integrate with my existing tools?",
          answer: "Yes! We integrate with popular tools including Google Calendar for booking, email services for notifications, CRM systems, and more. Enterprise plans include API access for custom integrations."
        },
        {
          question: "Can I use Google Maps for area measurements?",
          answer: "Yes! Our platform includes Google Maps integration that allows users to draw and measure areas directly on a map. This is perfect for landscaping, roofing, painting, and other service businesses that price based on area."
        },
        {
          question: "Do you support photo-based measurements?",
          answer: "Yes! Our AI-powered photo measurement feature allows users to upload photos and get automated measurements. This is particularly useful for exterior services where site visits can be minimized."
        }
      ]
    },
    {
      id: "pricing-billing",
      title: "Pricing & Billing",
      icon: CreditCard,
      color: "green",
      questions: [
        {
          question: "How much does Autobidder cost?",
          answer: "We offer three plans: Starter ($49/month), Professional ($97/month), and Enterprise ($297/month). Each plan includes different features and limits. You can save up to 17% by choosing annual billing. Visit our pricing page for detailed feature comparisons."
        },
        {
          question: "Can I change plans at any time?",
          answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences. Upgrades are charged immediately, while downgrades will be reflected in your next billing cycle."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor Stripe. Enterprise customers can also arrange for invoice-based billing."
        },
        {
          question: "Do you offer refunds?",
          answer: "We offer a 30-day money-back guarantee. If you're not satisfied with Autobidder for any reason, contact us within 30 days of your initial purchase for a full refund."
        },
        {
          question: "Are there any setup fees or hidden costs?",
          answer: "No setup fees, ever. The price you see is what you pay. We believe in transparent, straightforward pricing with no hidden costs. All features within your plan are included at no extra charge."
        }
      ]
    },
    {
      id: "customization",
      title: "Customization & Design",
      icon: Settings,
      color: "orange",
      questions: [
        {
          question: "How do I embed calculators on my website?",
          answer: "After creating your calculator, go to the 'Embed Code' section where you'll find an HTML snippet. Simply copy and paste this code into your website where you want the calculator to appear. It works with any website platform including WordPress, Wix, Squarespace, and custom sites."
        },
        {
          question: "Can I create multiple calculators for different services?",
          answer: "Yes! All plans allow you to create multiple calculators. The Starter plan includes up to 5 calculators, while Professional and Enterprise plans offer unlimited calculators."
        },
        {
          question: "Can I use my own domain?",
          answer: "Enterprise plans include white-label options where you can use your own domain for the calculator pages. This provides a seamless experience for your customers."
        },
        {
          question: "Is mobile responsive?",
          answer: "Yes! All calculators are fully responsive and optimized for mobile, tablet, and desktop devices. Your customers will have a great experience regardless of the device they use."
        }
      ]
    },
    {
      id: "leads-data",
      title: "Leads & Data Management",
      icon: Users,
      color: "pink",
      questions: [
        {
          question: "How are leads captured and stored?",
          answer: "When users submit a calculation, their contact information and calculation details are automatically saved to your Leads dashboard. You can view, filter, export, and manage all leads from one central location."
        },
        {
          question: "Can I export my lead data?",
          answer: "Yes! You can export your leads to CSV format at any time. This makes it easy to import into your CRM, accounting software, or use for analysis."
        },
        {
          question: "Do I own my data?",
          answer: "Absolutely! You own all your data, including calculator configurations and lead information. You can export everything at any time, and upon account cancellation, you have 30 days to export your data before it's permanently deleted."
        },
        {
          question: "How is my data protected?",
          answer: "We take security seriously. All data is encrypted in transit (SSL/TLS) and at rest. We follow industry best practices for data protection and are compliant with major data privacy regulations."
        }
      ]
    },
    {
      id: "support",
      title: "Support & Resources",
      icon: FileText,
      color: "indigo",
      questions: [
        {
          question: "What kind of support do you offer?",
          answer: "All plans include 24/7 email support. Professional plans include priority support with faster response times. Enterprise plans include dedicated account managers and phone support."
        },
        {
          question: "Do you provide training or onboarding?",
          answer: "Yes! We offer comprehensive video tutorials, documentation, and guides. Enterprise customers receive personalized onboarding sessions and training for their team."
        },
        {
          question: "What if I need help building my calculator?",
          answer: "We're here to help! Our support team can guide you through the process. We also offer Done-For-You (DFY) services where our experts build custom calculators for you. Visit the DFY Services section for more details."
        },
        {
          question: "How quickly can I expect a response to support requests?",
          answer: "Response times vary by priority: Urgent issues get a response within 2 hours, High priority within 8 hours, Medium within 24 hours, and Low priority within 48 hours."
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      searchQuery === "" || 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const getCategoryColor = (color: string) => {
    switch (color) {
      case "blue": return "text-blue-600 bg-blue-100";
      case "purple": return "text-purple-600 bg-purple-100";
      case "green": return "text-green-600 bg-green-100";
      case "orange": return "text-orange-600 bg-orange-100";
      case "pink": return "text-pink-600 bg-pink-100";
      case "indigo": return "text-indigo-600 bg-indigo-100";
      default: return "text-blue-600 bg-blue-100";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h1>
            </div>
            <SupportContact 
              trigger={
                <Button variant="outline" size="sm" data-testid="button-contact-support">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-6 text-lg"
                data-testid="input-search-faq"
              />
            </div>
          </CardContent>
        </Card>

        {/* FAQ Categories */}
        {filteredCategories.length > 0 ? (
          <div className="space-y-6">
            {filteredCategories.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <Card key={category.id} data-testid={`card-category-${category.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getCategoryColor(category.color)}`}>
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <span>{category.title}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {category.questions.length} {category.questions.length === 1 ? 'question' : 'questions'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((item, index) => (
                        <AccordionItem key={index} value={`${category.id}-${index}`}>
                          <AccordionTrigger className="text-left hover:no-underline" data-testid={`accordion-question-${category.id}-${index}`}>
                            <span className="font-medium">{item.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600 leading-relaxed" data-testid={`accordion-answer-${category.id}-${index}`}>
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any questions matching "{searchQuery}". Try a different search term.
              </p>
              <Button onClick={() => setSearchQuery("")} variant="outline" data-testid="button-clear-search">
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Still Need Help Section */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Still Need Help?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you with any questions or issues you may have.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <SupportContact 
                trigger={
                  <Button size="lg" className="gap-2" data-testid="button-contact-support-bottom">
                    <Mail className="h-5 w-5" />
                    Contact Support Team
                  </Button>
                }
              />
              <Link href="/dfy-services">
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-dfy-services">
                  <FileText className="h-5 w-5" />
                  Browse DFY Services
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
