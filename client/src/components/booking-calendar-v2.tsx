import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
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

// Format date for display (parse in local timezone to avoid timezone shifts)
const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // Create in local timezone
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch business settings to get maxDaysOut
  const { data: businessSettings } = useQuery({
    queryKey: ['/api/public/business-settings', businessOwnerId],
    queryFn: async () => {
      if (!businessOwnerId) return null;
      const res = await fetch(`/api/public/business-settings/${businessOwnerId}`, {
        cache: 'no-cache' // Prevent browser caching
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!businessOwnerId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  // Calculate date range based on maxDaysOut setting (default to 90 if not set)
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const maxDaysOut = businessSettings?.maxDaysOut || 90;
  const endDate = new Date(today.getTime() + (maxDaysOut - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
    enabled: !!businessOwnerId && !!businessSettings,
    staleTime: 0,
    gcTime: 0
  });

  // Combined loading state
  const isLoadingData = isLoading || !businessSettings;

  // Get unique dates with available slots and track availability counts (memoized)
  const dateAvailability = useMemo(() => {
    const dateMap = new Map<string, { available: number; booked: number }>();
    
    slots.forEach((slot: any) => {
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
    
    return dateMap;
  }, [slots]);

  const availableDates = useMemo(() => 
    Array.from(dateAvailability.entries())
      .filter(([_, counts]) => counts.available > 0)
      .map(([date]) => date)
      .sort(),
    [dateAvailability]
  );

  // Initialize current month to first available month
  useEffect(() => {
    if (!isLoadingData && availableDates.length > 0) {
      const [year, month] = availableDates[0].split('-').map(Number);
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  }, [isLoadingData, availableDates]);

  // Auto-select first available date
  useEffect(() => {
    if (!isLoadingData && availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [isLoadingData, availableDates, selectedDate]);

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
        const errorObj = new Error(error.message || 'Failed to book slot') as any;
        errorObj.reason = error.reason;
        errorObj.distance = error.distance;
        errorObj.threshold = error.threshold;
        throw errorObj;
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
    onError: (error: any) => {
      let title = "Booking Failed";
      let description = error.message;
      
      if (error.reason === "route_optimization") {
        title = "Date Not Available";
        const formattedDistance = typeof error.distance === 'number' ? error.distance.toFixed(1) : error.distance;
        const formattedThreshold = typeof error.threshold === 'number' ? error.threshold.toFixed(1) : error.threshold;
        description = `This date is unavailable because your location is ${formattedDistance} miles from our existing appointments that day. Our route optimization requires bookings to be within ${formattedThreshold} miles of each other. Please try a different date.`;
      }
      
      toast({
        title,
        description,
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
        {isLoadingData && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading available times...</p>
          </div>
        )}

        {/* No Availability */}
        {!isLoadingData && slots.length === 0 && (
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
        {!isLoadingData && slots.length > 0 && availableDates.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">
              No available dates in the next {maxDaysOut} days. Please contact us directly.
            </p>
          </div>
        )}

        {/* Date Selection - Monthly Calendar Grid */}
        {!isLoadingData && slots.length > 0 && (
          <>
            <div>
              <h4 className="text-sm font-medium mb-4">Select Date</h4>
              {(() => {
                // Use the currentMonth state for display
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                
                // Determine if we can navigate to previous/next month based on available dates
                const canGoPrevious = availableDates.length > 0 && (() => {
                  const firstAvailableDate = availableDates[0];
                  const [y, m] = firstAvailableDate.split('-').map(Number);
                  const firstAvailableMonth = new Date(y, m - 1, 1);
                  const previousMonth = new Date(year, month - 1, 1);
                  return previousMonth >= firstAvailableMonth;
                })();
                
                const canGoNext = availableDates.length > 0 && (() => {
                  const lastAvailableDate = availableDates[availableDates.length - 1];
                  const [y, m] = lastAvailableDate.split('-').map(Number);
                  const lastAvailableMonth = new Date(y, m - 1, 1);
                  const nextMonth = new Date(year, month + 1, 1);
                  return nextMonth <= lastAvailableMonth;
                })();
                
                const firstDayOfWeek = currentMonth.getDay();
                
                // Build calendar grid
                const calendarDays = [];
                const daysInMonth = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  0,
                ).getDate();
                
                // Add empty cells for days before month starts
                for (let i = 0; i < firstDayOfWeek; i++) {
                  calendarDays.push(null);
                }
                
                // Add all days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  calendarDays.push(dateStr);
                }
                
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                        disabled={!canGoPrevious}
                        className="ab-calendar-nav ab-calendar-nav-prev h-8 w-8 p-0"
                        data-testid="button-previous-month"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h3 className="ab-calendar-month-title text-lg font-semibold">
                        {currentMonth.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                        disabled={!canGoNext}
                        className="ab-calendar-nav ab-calendar-nav-next h-8 w-8 p-0"
                        data-testid="button-next-month"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div
                          key={day}
                          className="ab-calendar-day-header text-center text-xs font-medium text-gray-500 py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((date, index) => {
                        if (!date) {
                          return <div key={`empty-${index}`} className="aspect-square" />;
                        }
                        
                        const isAvailable = availableDates.includes(date);
                        const isSelected = date === selectedDate;
                        const isPast = date < today.toISOString().split("T")[0];
                        const availability = dateAvailability.get(date);
                        const availableCount = availability?.available || 0;
                        const dayNumber = parseInt(date.split('-')[2], 10);
                        
                        return (
                          <button
                            key={date}
                            onClick={() => isAvailable && !isPast && setSelectedDate(date)}
                            disabled={!isAvailable || isPast}
                            className={`
                              ab-calendar-date aspect-square rounded-lg border transition-all relative
                              ${
                                isSelected
                                  ? "selected border-2 border-blue-600 bg-blue-600 text-white shadow-lg scale-105"
                                  : isAvailable && !isPast
                                    ? "border-2 border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50"
                                    : "border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              }
                            `}
                            data-testid={`button-select-date-${date}`}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="text-sm font-medium">
                                {dayNumber}
                              </span>
                              {isAvailable && !isPast && availableCount <= 3 && (
                                <span
                                  className={`text-[10px] ${isSelected ? "text-blue-100" : "text-blue-600"}`}
                                >
                                  {availableCount} left
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Available Times for {formatDate(selectedDate)}
                </h4>
                {timeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {timeSlots.map((slot: any) => (
                      <Button
                        key={`${slot.date}_${slot.startTime}`}
                        variant="outline"
                        className="ab-time-slot flex items-center justify-center p-3 h-auto hover:bg-green-50 hover:border-green-300"
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
