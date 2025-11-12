import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, MessageSquare, Link as LinkIcon, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface WorkOrderNotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    notifyEmail: boolean;
    notifySms: boolean;
    message: string;
  }) => Promise<void>;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  estimateLink: string;
  defaultMessage: string;
  isPending?: boolean;
}

export default function WorkOrderNotificationDialog({
  isOpen,
  onClose,
  onSend,
  customerName,
  customerEmail,
  customerPhone,
  estimateLink,
  defaultMessage,
  isPending = false,
}: WorkOrderNotificationDialogProps) {
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifySms, setNotifySms] = useState(false);
  const [message, setMessage] = useState(defaultMessage);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNotifyEmail(!!customerEmail);
      setNotifySms(!!customerPhone);
      setMessage(defaultMessage);
    }
  }, [isOpen, customerEmail, customerPhone, defaultMessage]);

  const handleSend = async () => {
    await onSend({
      notifyEmail,
      notifySms,
      message,
    });
  };

  const canSendEmail = !!customerEmail;
  const canSendSms = !!customerPhone;
  const canSend = (notifyEmail && canSendEmail) || (notifySms && canSendSms);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notify Customer - Work Order Scheduled</DialogTitle>
          <DialogDescription>
            Send a notification to {customerName} about their scheduled work order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Notification Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Notification Method</Label>
            
            {/* Email Option */}
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Checkbox
                id="notify-email"
                checked={notifyEmail}
                onCheckedChange={(checked) => setNotifyEmail(checked as boolean)}
                disabled={!canSendEmail || isPending}
                data-testid="checkbox-notify-email"
              />
              <div className="flex-1">
                <Label
                  htmlFor="notify-email"
                  className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${
                    !canSendEmail ? "text-gray-400" : ""
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Label>
                <p className="text-sm text-gray-600 mt-1" data-testid="text-customer-email">
                  {canSendEmail ? (
                    <span className="text-gray-900">{customerEmail}</span>
                  ) : (
                    <span className="text-red-500">No email address available</span>
                  )}
                </p>
              </div>
            </div>

            {/* SMS Option */}
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Checkbox
                id="notify-sms"
                checked={notifySms}
                onCheckedChange={(checked) => setNotifySms(checked as boolean)}
                disabled={!canSendSms || isPending}
                data-testid="checkbox-notify-sms"
              />
              <div className="flex-1">
                <Label
                  htmlFor="notify-sms"
                  className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${
                    !canSendSms ? "text-gray-400" : ""
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Send SMS
                </Label>
                <p className="text-sm text-gray-600 mt-1" data-testid="text-customer-phone">
                  {canSendSms ? (
                    <span className="text-gray-900">{customerPhone}</span>
                  ) : (
                    <span className="text-red-500">No phone number available</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Message Editor */}
          <div className="space-y-2">
            <Label htmlFor="notification-message" className="text-base font-semibold">
              Custom Message
            </Label>
            <Textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Enter your message here..."
              disabled={isPending}
              className="resize-none"
              data-testid="textarea-notification-message"
            />
            <p className="text-xs text-gray-500">
              The estimate link will be automatically included in the notification.
            </p>
          </div>

          {/* Estimate Link Preview */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-start gap-3">
              <LinkIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <Label className="text-sm font-semibold text-blue-900">Estimate Link (Auto-included)</Label>
                <p className="text-sm text-blue-700 mt-1 break-all font-mono" data-testid="text-estimate-link">
                  {estimateLink}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            data-testid="button-cancel-notification"
          >
            Skip
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend || !message.trim() || isPending}
            data-testid="button-send-notification"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Notification"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
