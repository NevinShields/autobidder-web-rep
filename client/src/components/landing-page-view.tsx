import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Phone, Mail, MapPin } from "lucide-react";
import CalculatorPreview from "@/components/calculator-preview";
import type { Formula } from "@shared/schema";

export interface LandingPagePublicData {
  id: number;
  userId: string;
  slug: string;
  businessName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  ctaLabel: string | null;
  trustChips: Array<{ label: string; enabled: boolean; icon?: string }> | null;
  services: Array<{ serviceId: number; name: string; enabled: boolean; sortOrder: number }> | null;
  primaryServiceId: number | null;
  primaryServiceEmbedId: string | null;
  enableMultiService: boolean;
  howItWorks: Array<{ title: string; body: string }> | null;
  faqs: Array<{ question: string; answer: string }> | null;
  phone: string | null;
  email: string | null;
  serviceAreaText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  landingPageUrl: string | null;
  leadCapReached: boolean;
  autobidderBrandingRequired: boolean;
}

interface LandingPageViewProps {
  data: LandingPagePublicData;
  isPreview?: boolean;
  onLeadSubmitted?: () => void;
}

export default function LandingPageView({ data, isPreview, onLeadSubmitted }: LandingPageViewProps) {
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackNotes, setCallbackNotes] = useState("");
  const ctaLabel = data.ctaLabel || "Get Instant Quote";

  const trustChips = useMemo(() => (data.trustChips || []).filter(c => c.enabled), [data.trustChips]);
  const services = useMemo(() => (data.services || []).filter(s => s.enabled).sort((a, b) => a.sortOrder - b.sortOrder), [data.services]);
  const howItWorks = (data.howItWorks || []).slice(0, 3);
  const faqs = (data.faqs || []).slice(0, 6);

  const { data: formula } = useQuery<Formula>({
    queryKey: ["/api/embed", data.primaryServiceEmbedId],
    enabled: Boolean(data.primaryServiceEmbedId) && !data.enableMultiService && !isPreview,
  });

  const handleCallbackRequest = async () => {
    if (!callbackName.trim() || !callbackPhone.trim()) return;
    try {
      await fetch("/api/landing-page/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landingPageId: data.id,
          type: "callback_request",
          metadata: { name: callbackName, phone: callbackPhone, notes: callbackNotes }
        })
      });
      setCallbackName("");
      setCallbackPhone("");
      setCallbackNotes("");
    } catch {
      // Best-effort only
    }
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div className="space-y-5">
              {data.logoUrl && (
                <img src={data.logoUrl} alt={data.businessName || "Business logo"} className="h-12 w-auto" />
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                {data.businessName || "Your Business"}
              </h1>
              {data.tagline && (
                <p className="text-lg text-gray-600">{data.tagline}</p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="rounded-full">
                  {ctaLabel}
                </Button>
                {data.phone && (
                  <Button variant="outline" size="lg" className="rounded-full">
                    Call {data.phone}
                  </Button>
                )}
              </div>
              {trustChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {trustChips.map((chip, i) => (
                    <Badge key={`${chip.label}-${i}`} variant="secondary" className="rounded-full px-3 py-1">
                      <CheckCircle className="h-3 w-3 mr-1 text-emerald-600" />
                      {chip.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Card className="shadow-xl border-slate-200">
              <CardHeader>
                <CardTitle>Instant Quote</CardTitle>
              </CardHeader>
              <CardContent>
                {isPreview ? (
                  <div className="text-sm text-gray-500">Preview mode: calculator disabled.</div>
                ) : data.leadCapReached ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      We’re fully booked this month, but we can still schedule a callback.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <Label>Name</Label>
                        <Input value={callbackName} onChange={(e) => setCallbackName(e.target.value)} />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={callbackPhone} onChange={(e) => setCallbackPhone(e.target.value)} />
                      </div>
                      <div>
                        <Label>Notes (optional)</Label>
                        <Input value={callbackNotes} onChange={(e) => setCallbackNotes(e.target.value)} />
                      </div>
                      <Button className="w-full" onClick={handleCallbackRequest}>
                        Request Callback
                      </Button>
                    </div>
                  </div>
                ) : data.enableMultiService ? (
                  <iframe
                    title="Service selector"
                    src={`/service-selector?userId=${data.userId}&landingPageId=${data.id}`}
                    className="w-full min-h-[540px] border rounded-lg"
                  />
                ) : formula ? (
                  <CalculatorPreview formula={formula as any} onLeadSubmitted={onLeadSubmitted} />
                ) : (
                  <div className="text-sm text-gray-500">Calculator unavailable.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Services</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(service => (
            <Card key={service.serviceId} className="border-slate-200">
              <CardContent className="p-4">
                <p className="font-medium text-gray-900">{service.name}</p>
              </CardContent>
            </Card>
          ))}
          {services.length === 0 && (
            <p className="text-sm text-gray-500">No services listed yet.</p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 border-y">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((step, index) => (
              <Card key={`${step.title}-${index}`} className="border-slate-200">
                <CardContent className="p-5 space-y-2">
                  <div className="text-sm font-semibold text-blue-600">Step {index + 1}</div>
                  <div className="font-semibold text-gray-900">{step.title}</div>
                  <p className="text-sm text-gray-600">{step.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">FAQs</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={`${faq.question}-${index}`} className="border-slate-200">
                <CardContent className="p-5">
                  <div className="font-semibold text-gray-900">{faq.question}</div>
                  <p className="text-sm text-gray-600 mt-2">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="font-semibold text-lg">{data.businessName || "Your Business"}</div>
              {data.serviceAreaText && (
                <p className="text-sm text-slate-300 mt-2">{data.serviceAreaText}</p>
              )}
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              {data.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {data.phone}
                </div>
              )}
              {data.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {data.email}
                </div>
              )}
              {data.serviceAreaText && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {data.serviceAreaText}
                </div>
              )}
            </div>
            {data.autobidderBrandingRequired && (
              <div className="text-sm text-slate-400">
                Powered by Autobidder
              </div>
            )}
          </div>
          <Separator className="my-6 bg-slate-700" />
          <div className="text-xs text-slate-500">© {new Date().getFullYear()} {data.businessName || "Autobidder"}. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
