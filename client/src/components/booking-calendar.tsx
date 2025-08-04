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
  businessOwnerId?: string;
}

interface RecurringAvailability {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  slotDuration: number;
  title: string;
  createdAt: string;
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

export default function BookingCalendar({ onBookingConfirmed, leadId, businessOwnerId }: BookingCalendarProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Fetch recurring availability settings using public API
  const { data: recurringAvailability = [] } = useQuery({
    queryKey: ['/api/public/recurring-availability', businessOwnerId],
    queryFn: async () => {
      if (!businessOwnerId) {
        console.log('No business owner ID provided for booking calendar');
        return [];
      }
      
      const res = await fetch(`/api/public/recurring-availability/${businessOwnerId}`);
      if (!res.ok) {
        console.error('Failed to fetch recurring availability:', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!businessOwnerId
  });

  // Generate available time slots for a given date based on recurring availability
  const generateAvailableSlots = (date: string): { startTime: string; endTime: string; id: string }[] => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    // Find recurring availability for this day of week
    const dayAvailability = Array.isArray(recurringAvailability) 
      ? recurringAvailability.find((slot: RecurringAvailability) => slot.dayOfWeek === dayOfWeek && slot.isActive)
      : undefined;
    
    if (!dayAvailability) return [];
    
    const slots: { startTime: string; endTime: string; id: string }[] = [];
    const start = new Date(`2024-01-01T${dayAvailability.startTime}:00`);
    const end = new Date(`2024-01-01T${dayAvailability.endTime}:00`);
    
    while (start < end) {
      const slotEnd = new Date(start.getTime() + dayAvailability.slotDuration * 60000);
      if (slotEnd <= end) {
        slots.push({
          id: `${date}_${start.toTimeString().slice(0, 5)}`,
          startTime: start.toTimeString().slice(0, 5),
          endTime: slotEnd.toTimeString().slice(0, 5)
        });
      }
      start.setTime(start.getTime() + dayAvailability.slotDuration * 60000);
    }
    
    return slots;
  };

  // Get next 14 days that have availability configured
  const getUpcomingDates = () => {
    const dates: string[] = [];
    const today = new Date();
    
    if (!recurringAvailability || !Array.isArray(recurringAvailability) || recurringAvailability.length === 0) {
      return [];
    }
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      
      // Check if this day has availability configured
      const hasAvailability = (recurringAvailability as RecurringAvailability[]).some(
        (slot: RecurringAvailability) => slot.dayOfWeek === dayOfWeek && slot.isActive
      );
      
      if (hasAvailability) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  // Fetch existing booked slots to filter them out
  const { data: bookedSlots = [] } = useQuery({
    queryKey: ['/api/public/availability-slots', businessOwnerId, selectedDate],
    queryFn: async () => {
      if (!businessOwnerId) return [];
      
      const res = await fetch(`/api/public/availability-slots/${businessOwnerId}?date=${selectedDate}`);
      if (!res.ok) {
        console.error('Failed to fetch booked slots:', res.status);
        return [];
      }
      return res.json();
    },
    enabled: !!businessOwnerId && !!selectedDate
  });

  // Book slot mutation - creates a new booked slot in the database
  const bookSlotMutation = useMutation({
    mutationFn: async (slotData: { date: string; startTime: string; endTime: string }) => {
      if (!businessOwnerId) {
        throw new Error('Business owner ID is required for booking');
      }
      
      // Create a new slot and book it using the public API
      const response = await fetch(`/api/public/availability-slots/${businessOwnerId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: slotData.date,
          startTime: slotData.startTime,
          endTime: slotData.endTime,
          leadId,
          title: 'Customer Appointment',
          notes: 'Booked via customer form'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to book slot');
      }
      
      return response.json();
    },
    onSuccess: (bookedSlot) => {
      queryClient.invalidateQueries({ queryKey: ['/api/public/availability-slots', businessOwnerId] });
      toast({
        title: "Appointment Booked!",
        description: "Your appointment has been scheduled successfully.",
      });
      onBookingConfirmed(bookedSlot.id);
    },
    onError: (error) => {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to book this time slot. Please try another time.",
        variant: "destructive",
      });
    },
  });

  const handleBookSlot = (slotData: { date: string; startTime: string; endTime: string }) => {
    if (!leadId) {
      toast({
        title: "Error",
        description: "Please submit your quote request first.",
        variant: "destructive",
      });
      return;
    }
    
    bookSlotMutation.mutate(slotData);
  };

  // Get available slots for the selected date and filter out booked ones
  const availableTimeSlots = generateAvailableSlots(selectedDate);
  const bookedSlotTimes = Array.isArray(bookedSlots) 
    ? (bookedSlots as AvailabilitySlot[])
        .filter(slot => slot.isBooked)
        .map(slot => `${slot.startTime}-${slot.endTime}`)
    : [];
  
  const availableSlotsFiltered = availableTimeSlots.filter(
    slot => !bookedSlotTimes.includes(`${slot.startTime}-${slot.endTime}`)
  );

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
        {getUpcomingDates().length > 0 && selectedDate && (
          <div>
            <h4 className="text-sm font-medium mb-2">
              Available Times for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h4>
            {availableSlotsFiltered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableSlotsFiltered
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((slot) => (
                    <Button
                      key={slot.id}
                      variant="outline"
                      className="flex items-center justify-center p-3 h-auto hover:bg-green-50 hover:border-green-300"
                      onClick={() => handleBookSlot({
                        date: selectedDate,
                        startTime: slot.startTime,
                        endTime: slot.endTime
                      })}
                      disabled={bookSlotMutation.isPending}
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
                <p className="text-sm">All slots may be booked or no availability configured.</p>
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