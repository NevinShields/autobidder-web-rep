import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, CheckCircle2, MapPin, Phone, Mail, User, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Helper function to format time
const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes}${period}`;
};

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
};

export default function BookingTest() {
  const { toast } = useToast();
  const [step, setStep] = useState<'date' | 'time' | 'details' | 'confirm'>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Get current authenticated user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  const businessOwnerId = currentUser?.id;

  // Calculate date range (next 30 days)
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch available slots
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

  // Calculate date availability
  const dateAvailability = useMemo(() => {
    const dateMap = new Map<string, { available: number; slots: any[] }>();
    
    slots.forEach((slot: any) => {
      if (!dateMap.has(slot.date)) {
        dateMap.set(slot.date, { available: 0, slots: [] });
      }
      const data = dateMap.get(slot.date)!;
      if (!slot.isBooked) {
        data.available++;
        data.slots.push(slot);
      }
    });
    
    return dateMap;
  }, [slots]);

  const availableDates = useMemo(() => 
    Array.from(dateAvailability.entries())
      .filter(([_, data]) => data.available > 0)
      .map(([date]) => date)
      .sort(),
    [dateAvailability]
  );

  // Get available time slots for selected date
  const availableTimeSlots = selectedDate
    ? (dateAvailability.get(selectedDate)?.slots || []).sort((a: any, b: any) => 
        a.startTime.localeCompare(b.startTime)
      )
    : [];

  // Book slot mutation
  const bookSlot = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTimeSlot || !businessOwnerId) {
        throw new Error('Missing required booking information');
      }

      const response = await fetch(`/api/public/availability-slots/${businessOwnerId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          startTime: selectedTimeSlot.startTime,
          endTime: selectedTimeSlot.endTime,
          title: 'Test Booking',
          notes: 'Booked via test page',
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone
        })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to book appointment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/public/availability-slots', businessOwnerId, startDate, endDate] 
      });
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully scheduled.",
      });
      // Reset to confirmation view
      setStep('confirm');
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setStep('time');
  };

  const handleTimeSelect = (slot: any) => {
    setSelectedTimeSlot({ startTime: slot.startTime, endTime: slot.endTime });
    setStep('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bookSlot.mutate();
  };

  const canProceed = () => {
    if (step === 'details') {
      return customerInfo.name && customerInfo.email && customerInfo.phone;
    }
    return true;
  };

  // Render calendar grid by weeks
  const renderCalendar = () => {
    const firstDate = new Date(availableDates[0] || today);
    const lastDate = new Date(availableDates[availableDates.length - 1] || new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000));
    
    // Get first day of month
    const currentMonth = new Date(firstDate);
    currentMonth.setDate(1);
    
    // Get day of week for first of month (0 = Sunday)
    const firstDayOfWeek = currentMonth.getDay();
    
    // Build calendar grid
    const calendarDays = [];
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        .toISOString().split('T')[0];
      calendarDays.push(dateStr);
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
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
            const isPast = new Date(date) < new Date(today.toISOString().split('T')[0]);
            const availability = dateAvailability.get(date);
            const availableCount = availability?.available || 0;
            
            return (
              <button
                key={date}
                onClick={() => isAvailable && handleDateSelect(date)}
                disabled={!isAvailable || isPast}
                className={`
                  aspect-square rounded-lg border-2 transition-all relative
                  ${isSelected 
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-105' 
                    : isAvailable 
                      ? 'border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50' 
                      : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  }
                `}
                data-testid={`button-select-date-${date}`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-sm font-medium">
                    {new Date(date).getDate()}
                  </span>
                  {isAvailable && availableCount <= 3 && (
                    <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>
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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Loading availability...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Book Your Appointment
          </h1>
          <p className="text-gray-600">
            Choose a date and time that works best for you
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {['date', 'time', 'details', 'confirm'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                  ${step === s || (s === 'confirm' && bookSlot.isSuccess)
                    ? 'bg-blue-600 text-white scale-110' 
                    : ['date', 'time', 'details'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {s === 'confirm' && bookSlot.isSuccess ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 3 && (
                  <div className={`w-12 h-1 mx-1 ${
                    ['date', 'time', 'details'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-2">
            <span className={`text-xs ${step === 'date' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              Date
            </span>
            <span className={`text-xs ${step === 'time' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              Time
            </span>
            <span className={`text-xs ${step === 'details' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              Details
            </span>
            <span className={`text-xs ${step === 'confirm' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              Confirm
            </span>
          </div>
        </div>

        {/* Main Content */}
        <Card className="shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-2xl">
              {step === 'date' && <><CalendarIcon className="w-6 h-6 text-blue-600" /> Select Date</>}
              {step === 'time' && <><Clock className="w-6 h-6 text-blue-600" /> Choose Time</>}
              {step === 'details' && <><User className="w-6 h-6 text-blue-600" /> Your Information</>}
              {step === 'confirm' && <><CheckCircle2 className="w-6 h-6 text-green-600" /> Booking Confirmed!</>}
            </CardTitle>
            <CardDescription>
              {step === 'date' && 'Select an available date from the calendar below'}
              {step === 'time' && 'Pick a time slot that works for you'}
              {step === 'details' && 'Enter your contact information'}
              {step === 'confirm' && 'Your appointment has been successfully scheduled'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {/* Step 1: Date Selection */}
            {step === 'date' && (
              <div className="space-y-6">
                {availableDates.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Availability
                    </h3>
                    <p className="text-gray-600">
                      There are currently no available appointment slots. Please check back later.
                    </p>
                  </div>
                ) : (
                  renderCalendar()
                )}
              </div>
            )}

            {/* Step 2: Time Selection */}
            {step === 'time' && selectedDate && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-900">
                    <CalendarIcon className="w-5 h-5" />
                    <span className="font-semibold">{formatDate(selectedDate)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Available Times</h3>
                  {availableTimeSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableTimeSlots.map((slot: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleTimeSelect(slot)}
                          className="
                            p-4 rounded-lg border-2 border-blue-200 
                            hover:border-blue-500 hover:bg-blue-50 
                            transition-all text-center group
                          "
                          data-testid={`button-select-time-${slot.startTime}`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Clock className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="font-semibold text-gray-900">
                              {formatTime(slot.startTime)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(slot.endTime)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No time slots available for this date
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setStep('date')}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Date Selection
                </Button>
              </div>
            )}

            {/* Step 3: Customer Details */}
            {step === 'details' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-900 mb-2">
                    <CalendarIcon className="w-5 h-5" />
                    <span className="font-semibold">{formatDate(selectedDate!)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-900">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">
                      {formatTime(selectedTimeSlot!.startTime)} - {formatTime(selectedTimeSlot!.endTime)}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder="John Doe"
                      required
                      data-testid="input-customer-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                      data-testid="input-customer-email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      required
                      data-testid="input-customer-phone"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('time')}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canProceed() || bookSlot.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      data-testid="button-confirm-booking"
                    >
                      {bookSlot.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Booking...
                        </>
                      ) : (
                        <>
                          Confirm Booking
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 'confirm' && bookSlot.isSuccess && (
              <div className="text-center py-8 space-y-6">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    You're All Set!
                  </h2>
                  <p className="text-gray-600">
                    Your appointment has been confirmed. You'll receive a confirmation email shortly.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto text-left">
                  <h3 className="font-semibold mb-4 text-center">Appointment Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <span>{formatDate(selectedDate!)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span>
                        {formatTime(selectedTimeSlot!.startTime)} - {formatTime(selectedTimeSlot!.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <span>{customerInfo.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span>{customerInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span>{customerInfo.phone}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setStep('date');
                    setSelectedDate(null);
                    setSelectedTimeSlot(null);
                    setCustomerInfo({ name: '', email: '', phone: '' });
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Book Another Appointment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
