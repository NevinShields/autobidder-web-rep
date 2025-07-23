import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AvailabilitySlot } from "@shared/schema";

interface BookingCalendarProps {
  onBookingConfirmed: (slotId: number) => void;
  leadId?: number;
}

export default function BookingCalendar({ onBookingConfirmed, leadId }: BookingCalendarProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Get next 14 days for date selection, but only include dates with recurring availability
  const getUpcomingDates = () => {
    const dates = [];
    const today = new Date();
    
    if (!recurringAvailability || !Array.isArray(recurringAvailability) || recurringAvailability.length === 0) {
      return []; // Return empty array if no recurring availability is set
    }
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Check if this day of week has availability configured
      const hasAvailability = recurringAvailability.some((slot: any) => slot.dayOfWeek === dayOfWeek);
      
      if (hasAvailability) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  // Fetch recurring availability settings
  const { data: recurringAvailability } = useQuery({
    queryKey: ['/api/recurring-availability'],
    queryFn: () => fetch('/api/recurring-availability').then(res => res.json()),
  });

  // Fetch available slots for the selected date
  const { data: availableSlots, isLoading } = useQuery({
    queryKey: ['/api/availability-slots', selectedDate],
    queryFn: () => fetch(`/api/availability-slots?date=${selectedDate}`).then(res => res.json()),
  });

  // Book slot mutation
  const bookSlotMutation = useMutation({
    mutationFn: ({ slotId, slotData }: { slotId: number; slotData?: any }) => 
      fetch(`/api/availability-slots/${slotId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, slotData }),
      }).then(res => res.json()),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability-slots'] });
      onBookingConfirmed(variables.slotId);
      toast({
        title: "Appointment Booked!",
        description: "Your appointment has been scheduled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description: "Unable to book this time slot. Please try another time.",
        variant: "destructive",
      });
    },
  });

  const handleBookSlot = (slotId: number) => {
    if (!leadId) {
      toast({
        title: "Error",
        description: "Please submit your quote request first.",
        variant: "destructive",
      });
      return;
    }
    
    // Find the slot data for generated slots
    const slot = availableSlotsFiltered.find(s => s.id === slotId);
    const slotData = slot ? {
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      title: slot.title
    } : undefined;
    
    bookSlotMutation.mutate({ slotId, slotData });
  };

  // Filter only available slots (not booked)
  const availableSlotsFiltered = availableSlots && Array.isArray(availableSlots) 
    ? (availableSlots as AvailabilitySlot[]).filter(slot => !slot.isBooked)
    : [];

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
        {/* No Availability Warning */}
        {(!recurringAvailability || !Array.isArray(recurringAvailability) || recurringAvailability.length === 0) ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Availability Configured</h3>
              <p className="text-gray-600 mb-4">
                The business owner hasn't set up their availability schedule yet.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-amber-800 mb-2">What this means:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Online booking is temporarily unavailable</li>
                  <li>• You can still submit your quote request</li>
                  <li>• The business will contact you to schedule manually</li>
                </ul>
              </div>
            </div>
          </div>
        ) : getUpcomingDates().length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Dates</h3>
              <p className="text-gray-600">
                No available appointment dates in the next 14 days. Please contact the business directly to schedule.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Date Selection */}
            <div>
              <h4 className="text-sm font-medium mb-2">Select Date</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {getUpcomingDates().map((date) => {
                  const dateObj = new Date(date);
                  const isSelected = date === selectedDate;
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = dateObj.getDate();
                  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                  const isToday = date === new Date().toISOString().split('T')[0];
                  
                  return (
                    <Button
                      key={date}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col p-2 h-auto ${
                        isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''
                      } ${isToday ? 'ring-2 ring-blue-300' : ''}`}
                    >
                      <span className="text-xs font-medium">{dayName}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                      <span className="text-xs text-gray-500">{monthName}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Time Slots - only show if we have dates available */}
        {getUpcomingDates().length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Available Times</h4>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading available times...
              </div>
            ) : availableSlotsFiltered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableSlotsFiltered
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((slot) => (
                    <Button
                      key={slot.id}
                      variant="outline"
                      className="flex items-center justify-center p-3 h-auto hover:bg-green-50 hover:border-green-300"
                      onClick={() => handleBookSlot(slot.id)}
                      disabled={bookSlotMutation.isPending}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        {slot.title && slot.title !== "Available" && (
                          <span className="text-xs text-gray-500">{slot.title}</span>
                        )}
                      </div>
                    </Button>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No available times for this date.</p>
                <p className="text-sm">Please select a different date.</p>
              </div>
            )}
          </div>
        )}

        {/* Booking Status */}
        {bookSlotMutation.isPending && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Booking your appointment...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}