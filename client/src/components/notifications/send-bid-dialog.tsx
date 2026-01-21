import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Mail, MessageSquare, Link as LinkIcon, Loader2, DollarSign, FileText, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface BidEmailTemplate {
  id: number;
  templateType: string;
  subject: string;
  emailBody: string;
  fromName: string;
  isActive: boolean;
}

interface SendBidDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    notifyEmail: boolean;
    notifySms: boolean;
    message: string;
    subject?: string;
  }) => Promise<void>;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  estimateLink: string;
  totalAmount: number;
  defaultMessage: string;
  isPending?: boolean;
  templateType?: "initial_bid" | "updated_bid" | "booking_confirmation";
}

export default function SendBidDialog({
  isOpen,
  onClose,
  onSend,
  customerName,
  customerEmail,
  customerPhone,
  estimateLink,
  totalAmount,
  defaultMessage,
  isPending = false,
  templateType = "initial_bid",
}: SendBidDialogProps) {
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifySms, setNotifySms] = useState(false);
  const [message, setMessage] = useState(defaultMessage);
  const [subject, setSubject] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("custom");
  const [isEditing, setIsEditing] = useState(false);

  // Fetch available bid email templates
  const { data: templates = [] } = useQuery<BidEmailTemplate[]>({
    queryKey: ["/api/bid-email-templates"],
    enabled: isOpen,
  });

  // Filter templates by type
  const availableTemplates = templates.filter(
    (t) => t.isActive && t.templateType === templateType
  );

  // Replace template variables with actual values
  const replaceVariables = (text: string) => {
    return text
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{customerEmail\}\}/g, customerEmail || "")
      .replace(/\{\{customerPhone\}\}/g, customerPhone || "")
      .replace(/\{\{totalPrice\}\}/g, `$${(totalAmount / 100).toLocaleString()}`)
      .replace(/\{\{estimateLink\}\}/g, estimateLink)
      .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString());
  };

  useEffect(() => {
    if (isOpen) {
      setNotifyEmail(!!customerEmail);
      setNotifySms(!!customerPhone);
      setMessage(defaultMessage);
      setSubject(`Your Estimate - $${(totalAmount / 100).toLocaleString()}`);
      setSelectedTemplateId("custom");
      setIsEditing(false);
    }
  }, [isOpen, customerEmail, customerPhone, defaultMessage, totalAmount]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsEditing(false);

    if (templateId === "custom") {
      setMessage(defaultMessage);
      setSubject(`Your Estimate - $${(totalAmount / 100).toLocaleString()}`);
    } else {
      const template = templates.find((t) => t.id.toString() === templateId);
      if (template) {
        setMessage(replaceVariables(template.emailBody));
        setSubject(replaceVariables(template.subject));
      }
    }
  };

  const handleSend = async () => {
    await onSend({
      notifyEmail,
      notifySms,
      message,
      subject,
    });
  };

  const canSendEmail = !!customerEmail;
  const canSendSms = !!customerPhone;
  const canSend = (notifyEmail && canSendEmail) || (notifySms && canSendSms);
  const hasAnyContactMethod = canSendEmail || canSendSms;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Bid to Customer</DialogTitle>
          <DialogDescription>
            Your bid has been confirmed! Would you like to send it to {customerName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!hasAnyContactMethod && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">
                <strong>No contact information available.</strong> This customer doesn't have an email or phone number on file.
                You can skip this step and manually share the estimate link with them.
              </p>
            </div>
          )}
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <Label className="text-sm font-semibold text-green-900">Confirmed Bid Amount</Label>
                <p className="text-lg font-bold text-green-700" data-testid="text-bid-amount">
                  ${(totalAmount / 100).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Email Template Selection */}
          {canSendEmail && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Email Template
                </Label>
                {selectedTemplateId !== "custom" && !isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Before Sending
                  </Button>
                )}
              </div>
              <Select
                value={selectedTemplateId}
                onValueChange={handleTemplateSelect}
                disabled={isPending}
              >
                <SelectTrigger data-testid="select-email-template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Message</SelectItem>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.fromName || `Template ${template.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableTemplates.length === 0 && selectedTemplateId === "custom" && (
                <p className="text-xs text-gray-500">
                  No saved templates yet. Create templates in Email Settings to reuse them here.
                </p>
              )}
            </div>
          )}

          {/* Email Subject (only show when email is selected) */}
          {canSendEmail && notifyEmail && (
            <div className="space-y-2">
              <Label htmlFor="bid-subject" className="text-sm font-medium">
                Email Subject
              </Label>
              <Input
                id="bid-subject"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (selectedTemplateId !== "custom") setIsEditing(true);
                }}
                placeholder="Enter email subject..."
                disabled={isPending || (selectedTemplateId !== "custom" && !isEditing)}
                data-testid="input-bid-subject"
              />
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base font-semibold">Notification Method</Label>
            
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Checkbox
                id="bid-notify-email"
                checked={notifyEmail}
                onCheckedChange={(checked) => setNotifyEmail(checked as boolean)}
                disabled={!canSendEmail || isPending}
                data-testid="checkbox-bid-notify-email"
              />
              <div className="flex-1">
                <Label
                  htmlFor="bid-notify-email"
                  className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${
                    !canSendEmail ? "text-gray-400" : ""
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Label>
                <p className="text-sm text-gray-600 mt-1" data-testid="text-bid-customer-email">
                  {canSendEmail ? (
                    <span className="text-gray-900">{customerEmail}</span>
                  ) : (
                    <span className="text-red-500">No email address available</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Checkbox
                id="bid-notify-sms"
                checked={notifySms}
                onCheckedChange={(checked) => setNotifySms(checked as boolean)}
                disabled={!canSendSms || isPending}
                data-testid="checkbox-bid-notify-sms"
              />
              <div className="flex-1">
                <Label
                  htmlFor="bid-notify-sms"
                  className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${
                    !canSendSms ? "text-gray-400" : ""
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Send SMS
                </Label>
                <p className="text-sm text-gray-600 mt-1" data-testid="text-bid-customer-phone">
                  {canSendSms ? (
                    <span className="text-gray-900">{customerPhone}</span>
                  ) : (
                    <span className="text-red-500">No phone number available</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bid-message" className="text-base font-semibold">
              {selectedTemplateId === "custom" ? "Custom Message" : isEditing ? "Edit Message" : "Message Preview"}
            </Label>
            <Textarea
              id="bid-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (selectedTemplateId !== "custom") setIsEditing(true);
              }}
              rows={6}
              placeholder="Enter your message here..."
              disabled={isPending || (selectedTemplateId !== "custom" && !isEditing)}
              className={`resize-none ${selectedTemplateId !== "custom" && !isEditing ? "bg-gray-50" : ""}`}
              data-testid="textarea-bid-message"
            />
            <p className="text-xs text-gray-500">
              The estimate link will be automatically included in the notification.
              {selectedTemplateId !== "custom" && !isEditing && (
                <span className="block mt-1 text-blue-600">
                  Click "Edit Before Sending" to customize this message.
                </span>
              )}
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-start gap-3">
              <LinkIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <Label className="text-sm font-semibold text-blue-900">Estimate Link (Auto-included)</Label>
                <p className="text-sm text-blue-700 mt-1 break-all font-mono" data-testid="text-bid-estimate-link">
                  {estimateLink}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant={hasAnyContactMethod ? "outline" : "default"}
            onClick={onClose}
            disabled={isPending}
            data-testid="button-skip-send-bid"
          >
            {hasAnyContactMethod ? "Skip" : "Done"}
          </Button>
          {hasAnyContactMethod && (
            <Button
              onClick={handleSend}
              disabled={!canSend || !message.trim() || isPending}
              data-testid="button-send-bid"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send to Customer"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
