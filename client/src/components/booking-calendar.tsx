import { useState, useEffect } from "react";
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
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
    address?: string;
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

export default function BookingCalendar({ onBookingConfirmed, leadId, businessOwnerId, customerInfo, serviceName }: BookingCalendarProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Calculate date range for next 14 days
  const getDateRange = () => {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 13);
    return { startDate, endDate: endDate.toISOString().split('T')[0] };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch all available slots for next 14 days (already filtered by API for blocked dates and Google Calendar)
  const { data: allSlots = [], isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['/api/public/availability-slots', businessOwnerId, startDate, endDate, leadId, customerInfo?.address],
    queryFn: async () => {
      if (!businessOwnerId) {
        console.log('❌ No business owner ID provided for booking calendar');
        return [];
      }
      
      console.log('🔄 Fetching availability slots for range:', startDate, 'to', endDate);
      const leadParam = leadId ? `&leadId=${leadId}` : '';
      const addressParam = (!leadId && customerInfo?.address) ? `&customerAddress=${encodeURIComponent(customerInfo.address)}` : '';
      const res = await fetch(`/api/public/availability-slots/${businessOwnerId}?startDate=${startDate}&endDate=${endDate}${leadParam}${addressParam}`);
      if (!res.ok) {
        console.error('❌ Failed to fetch available slots:', res.status);
        return [];
      }
      const data = await res.json();
      console.log('✅ Booking calendar - fetched slots:', { 
        count: Array.isArray(data) ? data.length : 0, 
        availableCount: Array.isArray(data) ? data.filter((s: any) => !s.isBooked).length : 0,
        bookedCount: Array.isArray(data) ? data.filter((s: any) => s.isBooked).length : 0,
        uniqueDates: Array.isArray(data) ? [...new Set(data.map((s: any) => s.date))].sort() : []
      });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!businessOwnerId,
    staleTime: 0,
    gcTime: 0
  });

  // Get unique dates that have AVAILABLE (bookable) slots
  // Only show dates where at least one slot is not booked and the backend hasn't filtered it out
  const getUpcomingDates = () => {
    if (!Array.isArray(allSlots) || allSlots.length === 0) {
      console.log('📅 No slots available - returning empty dates');
      return [];
    }
    
    // Group slots by date and only include dates with at least one available slot
    const dateMap = new Map<string, { available: number; booked: number }>();
    
    (allSlots as AvailabilitySlot[]).forEach(slot => {
      if (!dateMap.has(slot.date)) {
        dateMap.set(slot.date, { available: 0, booked: 0 });
      }
      const counts = dateMap.get(slot.date)!;
      if (slot.isBooked) {
        counts.booked++;
      } else {
        counts.available++;
      }
    });
    
    // Only return dates that have at least one available slot
    const availableDates = Array.from(dateMap.entries())
      .filter(([_, counts]) => counts.available > 0)
      .map(([date]) => date)
      .sort();
    
    console.log('📅 Available dates computed:', {
      totalDates: dateMap.size,
      availableDates: availableDates.length,
      dates: availableDates,
      breakdown: Array.from(dateMap.entries()).map(([date, counts]) => ({
        date,
        available: counts.available,
        booked: counts.booked,
        isAvailable: counts.available > 0
      }))
    });
    
    return availableDates;
  };

  // Get upcoming dates (memoized to prevent recalculation)
  const upcomingDates = getUpcomingDates();
  
  // Effect to auto-select first available date if current selection is invalid
  useEffect(() => {
    if (!isLoadingAvailability && upcomingDates.length > 0) {
      // Auto-select first date if no date is selected or selected date is not in available dates
      if (!selectedDate || !upcomingDates.includes(selectedDate)) {
        const firstDate = upcomingDates[0];
        console.log('📅 Auto-selecting first available date:', firstDate, '(previous selection was:', selectedDate, ')');
        setSelectedDate(firstDate);
      }
    } else if (!isLoadingAvailability && upcomingDates.length === 0 && selectedDate) {
      // Clear selection if no dates available
      console.log('📅 Clearing selected date (no available dates)');
      setSelectedDate(null);
    }
  }, [isLoadingAvailability, upcomingDates, selectedDate]);

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
          title: serviceName || 'Service Appointment',
          notes: 'Booked via customer form',
          customerName: customerInfo?.name,
          customerEmail: customerInfo?.email,
          customerPhone: customerInfo?.phone
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to book slot');
      }
      
      return response.json();
    },
    onSuccess: (bookedSlot) => {
      // Invalidate with the same key structure as the query
      queryClient.invalidateQueries({ queryKey: ['/api/public/availability-slots', businessOwnerId, startDate, endDate, leadId, customerInfo?.address] });
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
    // For the scheduling flow, we allow booking even without leadId since quote was already submitted
    bookSlotMutation.mutate(slotData);
  };

  // Use slots from API for selected date - already filtered for blocked dates, Google Calendar, and booked slots
  const availableSlotsFiltered = Array.isArray(allSlots) 
    ? (allSlots as AvailabilitySlot[])
        .filter(slot => slot.date === selectedDate && !slot.isBooked)
        .map(slot => ({
          id: `${slot.date}_${slot.startTime}`,
          startTime: slot.startTime,
          endTime: slot.endTime
        }))
    : [];
  
  // Log when showing time slots for debugging
  if (selectedDate && availableSlotsFiltered.length > 0) {
    console.log('⏰ Showing time slots for date:', selectedDate, 'count:', availableSlotsFiltered.length);
  }

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
        {isLoadingAvailability ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Schedule...</h3>
              <p className="text-gray-600">
                Checking available appointment times
              </p>
            </div>
          </div>
        ) : (!allSlots || !Array.isArray(allSlots) || allSlots.length === 0) ? (
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
        ) : upcomingDates.length === 0 ? (
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
                {upcomingDates.map((date) => {
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
                      className={`ab-calendar-date flex flex-col p-2 h-auto ${
                        isSelected ? 'selected bg-blue-600 hover:bg-blue-700' : ''
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

        {/* Time Slots - only show if we have dates available AND selected date is in available list */}
        {upcomingDates.length > 0 && selectedDate && upcomingDates.includes(selectedDate) && (
          <div>
            <h4 className="text-sm font-medium mb-2">
              Available Times for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h4>
            {isLoadingAvailability ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-gray-600">Loading available times...</p>
              </div>
            ) : availableSlotsFiltered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableSlotsFiltered
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((slot) => (
                    <Button
                      key={slot.id}
                      variant="outline"
                      className="ab-time-slot flex items-center justify-center p-3 h-auto hover:bg-green-50 hover:border-green-300"
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