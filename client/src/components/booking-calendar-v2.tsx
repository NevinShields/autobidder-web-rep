import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface BookingCalendarV2Props {
  onBookingConfirmed: (slotId: number) => void;
  leadId?: number;
  businessOwnerId?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  serviceName?: string;
}

// Helper function to format time from 24-hour to 12-hour format
const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);
  
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minute.toString().padStart(2, '0')}${period}`;
};

export default function BookingCalendarV2({ 
  onBookingConfirmed, 
  leadId, 
  businessOwnerId, 
  customerInfo, 
  serviceName 
}: BookingCalendarV2Props) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Calculate date range for next 14 days
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch all available slots - simplified with unified calendar architecture
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['/api/public/availability-slots', businessOwnerId, startDate, endDate],
    queryFn: async () => {
      if (!businessOwnerId) return [];
      
      const res = await fetch(
        `/api/public/availability-slots/${businessOwnerId}?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!businessOwnerId,
    staleTime: 0,
    gcTime: 0
  });

  // Get unique dates with available slots - simplified logic
  const availableDates = [...new Set(
    slots
      .filter((slot: any) => !slot.isBooked)
      .map((slot: any) => slot.date)
  )].sort();

  // Auto-select first available date
  useEffect(() => {
    if (!isLoading && availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [isLoading, availableDates, selectedDate]);

  // Get available time slots for selected date
  const timeSlots = selectedDate
    ? slots
        .filter((slot: any) => slot.date === selectedDate && !slot.isBooked)
        .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
    : [];

  // Book slot mutation - simplified
  const bookSlot = useMutation({
    mutationFn: async (slotData: { date: string; startTime: string; endTime: string }) => {
      const response = await fetch(`/api/public/availability-slots/${businessOwnerId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...slotData,
          leadId,
          title: serviceName || 'Service Appointment',
          notes: 'Booked via customer form',
          customerName: customerInfo?.name,
          customerEmail: customerInfo?.email,
          customerPhone: customerInfo?.phone
        })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to book slot');
      }
      
      return response.json();
    },
    onSuccess: (bookedSlot) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/public/availability-slots', businessOwnerId, startDate, endDate] 
      });
      toast({
        title: "Appointment Booked!",
        description: "Your appointment has been scheduled successfully.",
      });
      onBookingConfirmed(bookedSlot.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule Your Appointment
        </CardTitle>
        <p className="text-sm text-gray-600">
          Select a date and time for your service appointment
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading available times...</p>
          </div>
        )}

        {/* No Availability */}
        {!isLoading && slots.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Availability Configured</h3>
              <p className="text-gray-600">
                The business hasn't set up their availability schedule yet.
              </p>
            </div>
          </div>
        )}

        {/* No Available Dates */}
        {!isLoading && slots.length > 0 && availableDates.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">
              No available dates in the next 14 days. Please contact us directly.
            </p>
          </div>
        )}

        {/* Date Selection */}
        {!isLoading && availableDates.length > 0 && (
          <>
            <div>
              <h4 className="text-sm font-medium mb-2">Select Date</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {availableDates.map((date) => {
                  const dateObj = new Date(date);
                  const isSelected = date === selectedDate;
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = dateObj.getDate();
                  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                  const isToday = date === today.toISOString().split('T')[0];
                  
                  return (
                    <Button
                      key={date}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col p-2 h-auto ${
                        isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''
                      } ${isToday ? 'ring-2 ring-blue-300' : ''}`}
                      data-testid={`button-select-date-${date}`}
                    >
                      <span className="text-xs font-medium">{dayName}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                      <span className="text-xs text-gray-500">{monthName}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Available Times for {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                {timeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {timeSlots.map((slot: any) => (
                      <Button
                        key={`${slot.date}_${slot.startTime}`}
                        variant="outline"
                        className="flex items-center justify-center p-3 h-auto hover:bg-green-50 hover:border-green-300"
                        onClick={() => bookSlot.mutate({
                          date: selectedDate,
                          startTime: slot.startTime,
                          endTime: slot.endTime
                        })}
                        disabled={bookSlot.isPending}
                        data-testid={`button-book-slot-${slot.startTime}`}
                      >
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">
                              {formatTime(slot.startTime)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTime(slot.endTime)}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No available times for this date.</p>
                  </div>
                )}
              </div>
            )}

            {/* Booking Status */}
            {bookSlot.isPending && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Booking your appointment...
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
