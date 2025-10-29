import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCallBookingSchema, type CallAvailabilitySlot } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

export default function BookCall() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<CallAvailabilitySlot | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const { toast } = useToast();

  const startDate = format(startOfWeek(new Date()), "yyyy-MM-dd");
  const endDate = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const { data: availableSlots = [], isLoading } = useQuery<CallAvailabilitySlot[]>({
    queryKey: ["/api/call-availability", startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/call-availability?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error("Failed to fetch availability");
      return response.json();
    },
  });

  const bookingFormSchema = insertCallBookingSchema.extend({
    slotId: z.number().optional(),
  });

  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      scheduledDate: format(selectedDate, "yyyy-MM-dd"),
      scheduledTime: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notes: "",
      status: "scheduled",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookingFormSchema>) => {
      return await apiRequest("/api/call-bookings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-availability"] });
      setBookingComplete(true);
      toast({
        title: "Booking confirmed!",
        description: "We'll send you a confirmation email shortly.",
      });
    },
    onError: () => {
      toast({
        title: "Booking failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof bookingFormSchema>) => {
    if (selectedSlot) {
      data.slotId = selectedSlot.id;
    }
    createBookingMutation.mutate(data);
  };

  const slotsForSelectedDate = availableSlots.filter(slot =>
    isSameDay(new Date(slot.date), selectedDate)
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const uniqueDatesWithSlots = Array.from(
    new Set(availableSlots.map(slot => slot.date))
  ).map(date => new Date(date));

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <CardDescription>
              Thank you for booking a call with us. We've sent a confirmation email to {form.getValues("email")}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Call Details:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                {format(new Date(form.getValues("scheduledDate")), "MMMM d, yyyy")} at {form.getValues("scheduledTime")}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Timezone: {form.getValues("timezone")}
              </p>
            </div>
            <Button
              data-testid="button-book-another"
              onClick={() => {
                setBookingComplete(false);
                setSelectedSlot(null);
                form.reset();
              }}
              className="w-full"
              variant="outline"
            >
              Book Another Call
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Book a Setup Call
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Schedule a personalized onboarding session with our team
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
              <CardDescription>Choose a convenient time for your setup call</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Loading availability...
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Available Dates</label>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 30 }, (_, i) => addDays(new Date(), i)).map((date) => {
                        const hasSlots = uniqueDatesWithSlots.some(d => isSameDay(d, date));
                        const isSelected = isSameDay(date, selectedDate);

                        return (
                          <Button
                            key={date.toISOString()}
                            data-testid={`button-date-${format(date, "yyyy-MM-dd")}`}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            disabled={!hasSlots}
                            onClick={() => {
                              setSelectedDate(date);
                              setSelectedSlot(null);
                            }}
                            className={`p-2 text-xs ${!hasSlots ? "opacity-30" : ""}`}
                          >
                            <div>
                              <div className="text-xs">{format(date, "EEE")}</div>
                              <div className="font-bold">{format(date, "d")}</div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Available Times for {format(selectedDate, "MMMM d, yyyy")}
                    </label>
                    {slotsForSelectedDate.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                        No available times on this date. Please select another date.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {slotsForSelectedDate.map((slot) => (
                          <Button
                            key={slot.id}
                            data-testid={`button-slot-${slot.id}`}
                            variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedSlot(slot);
                              form.setValue("scheduledDate", slot.date);
                              form.setValue("scheduledTime", slot.startTime);
                            }}
                            className="justify-start"
                          >
                            {slot.startTime} - {slot.endTime}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Fill in your details to complete the booking</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-name"
                            placeholder="John Doe"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-email"
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-company"
                            placeholder="Acme Inc."
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="input-notes"
                            placeholder="Any specific topics you'd like to discuss?"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Let us know what you'd like to cover
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    data-testid="button-submit-booking"
                    type="submit"
                    className="w-full"
                    disabled={!selectedSlot || createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                  </Button>

                  {!selectedSlot && (
                    <p className="text-sm text-center text-amber-600 dark:text-amber-400">
                      Please select a date and time slot to continue
                    </p>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
