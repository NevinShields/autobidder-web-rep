import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, User, Mail, MapPin, Calculator } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import StyledCalculator from "@/pages/styled-calculator";
import type { Lead } from "@shared/schema";

export default function CallScreen() {
  const [leadMode, setLeadMode] = useState<"existing" | "new" | "skip">("new");
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  // Fetch existing leads for the user
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const selectedLead = leads.find(lead => lead.id === selectedLeadId);

  const handleStartCalculator = () => {
    setShowCalculator(true);
  };

  if (showCalculator) {
    // Pass lead info to calculator via URL params if needed
    const urlParams = new URLSearchParams();
    if (leadMode === "skip") {
      urlParams.set("skipLead", "true");
    } else if (leadMode === "existing" && selectedLead) {
      urlParams.set("leadId", selectedLead.id.toString());
      urlParams.set("prefillName", selectedLead.name || "");
      urlParams.set("prefillEmail", selectedLead.email || "");
      urlParams.set("prefillPhone", selectedLead.phone || "");
      urlParams.set("prefillAddress", selectedLead.address || "");
    }

    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowCalculator(false)}
              data-testid="button-back-to-options"
            >
              ← Back to Options
            </Button>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <StyledCalculator />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Call Screen
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Quick pricing calculator for phone conversations
              </p>
            </div>
          </div>
        </div>

        {/* Lead Selection Options */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Lead Information
            </CardTitle>
            <CardDescription>
              Choose how to handle lead information for this quote
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={leadMode} onValueChange={(value: any) => setLeadMode(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="existing" data-testid="tab-existing-lead">
                  Choose Existing Lead
                </TabsTrigger>
                <TabsTrigger value="new" data-testid="tab-new-lead">
                  Enter New Lead
                </TabsTrigger>
                <TabsTrigger value="skip" data-testid="tab-skip-lead">
                  Skip Lead (Pricing Only)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="mt-6">
                <div className="space-y-4">
                  <Label>Select a Lead</Label>
                  {leadsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : leads.length > 0 ? (
                    <Select
                      value={selectedLeadId?.toString() || ""}
                      onValueChange={(value) => setSelectedLeadId(parseInt(value))}
                    >
                      <SelectTrigger data-testid="select-lead">
                        <SelectValue placeholder="Select a lead..." />
                      </SelectTrigger>
                      <SelectContent>
                        {leads.map((lead) => (
                          <SelectItem 
                            key={lead.id} 
                            value={lead.id.toString()}
                            data-testid={`lead-option-${lead.id}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{lead.name}</span>
                              <span className="text-sm text-gray-500 ml-2">{lead.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No existing leads found</p>
                      <p className="text-xs">Create a new lead or skip lead capture</p>
                    </div>
                  )}

                  {selectedLead && (
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{selectedLead.name}</span>
                          </div>
                          {selectedLead.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="w-4 h-4 text-blue-600" />
                              <span>{selectedLead.email}</span>
                            </div>
                          )}
                          {selectedLead.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="w-4 h-4 text-blue-600" />
                              <span>{selectedLead.phone}</span>
                            </div>
                          )}
                          {selectedLead.address && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4 text-blue-600" />
                              <span>{selectedLead.address}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="new" className="mt-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calculator className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Enter Lead During Calculator
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        You'll be able to enter the lead's contact information as you go through the pricing calculator.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="skip" className="mt-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calculator className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        Pricing Only Mode
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Skip lead capture and go straight to pricing. This is useful for quick quotes during phone calls.
                      </p>
                      <Badge variant="outline" className="mt-2 text-yellow-700 border-yellow-300">
                        No lead will be saved
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              onClick={handleStartCalculator}
              disabled={leadMode === "existing" && !selectedLeadId}
              className="w-full mt-6"
              data-testid="button-start-calculator"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Start Calculator
            </Button>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use Call Screen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5">1</Badge>
                <p>
                  <strong>Choose Existing Lead:</strong> Select a lead from your database to auto-fill their information and update their quote.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5">2</Badge>
                <p>
                  <strong>Enter New Lead:</strong> Collect the customer's information as you go through the pricing calculator.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5">3</Badge>
                <p>
                  <strong>Skip Lead:</strong> Get pricing instantly without capturing lead information - perfect for quick phone quotes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
