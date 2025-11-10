import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Settings, Save, Clock, CheckCircle, X, ChevronLeft, ChevronRight, Plus, ArrowLeft, MapPin, Phone, Mail, User, Ban, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayAvailability {
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number; // in minutes
}

interface WeeklySchedule {
  [key: number]: DayAvailability;
}

interface AvailabilitySlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  bookedBy?: number;
  title: string;
  notes?: string;
  createdAt: string;
}

interface BookedLead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  services: Array<{
    formulaId: number;
    formulaName: string;
    variables: Record<string, any>;
    calculatedPrice: number;
  }>;
  totalPrice: number;
  stage: string;
  createdAt: string;
}

export default function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      toast({
        title: "Google Calendar connected",
        description: "Your Google Calendar is now connected and busy times will be blocked automatically.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/status'] });
      window.history.replaceState({}, '', '/calendar');
    } else if (params.get('error') === 'connection_failed') {
      toast({
        title: "Connection failed",
        description: "Failed to connect Google Calendar. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/calendar');
    } else if (params.get('error') === 'invalid_state') {
      toast({
        title: "Security error",
        description: "Invalid authentication state. Please try connecting again.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/calendar');
    }
  }, [toast, queryClient]);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<'month' | 'day'>('month');
  
  // Blocked dates state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockingMode, setBlockingMode] = useState(false);
  const [selectedDateForBlocking, setSelectedDateForBlocking] = useState<string | null>(null);
  const [blockWholeDay, setBlockWholeDay] = useState(true);
  const [blockTimeStart, setBlockTimeStart] = useState('09:00');
  const [blockTimeEnd, setBlockTimeEnd] = useState('17:00');
  
  // Calendar selection state
  const [calendarSelectDialogOpen, setCalendarSelectDialogOpen] = useState(false);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    0: { enabled: false, startTime: "09:00", endTime: "17:00", slotDuration: 60 }, // Sunday
    1: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Monday
    2: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Tuesday
    3: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Wednesday
    4: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Thursday
    5: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Friday
    6: { enabled: false, startTime: "09:00", endTime: "17:00", slotDuration: 60 }, // Saturday
  });

  // Max days out setting - how far in advance customers can book
  const [maxDaysOut, setMaxDaysOut] = useState<number>(90);

  // Fetch existing availability settings
  const { data: existingSettings } = useQuery({
    queryKey: ['/api/recurring-availability'],
    queryFn: () => fetch('/api/recurring-availability').then(res => res.json()),
  });

  // Fetch business settings to get maxDaysOut
  const { data: businessSettings } = useQuery({
    queryKey: ['/api/business-settings'],
    queryFn: () => fetch('/api/business-settings').then(res => res.json()),
  });

  // Fetch bookings for current month
  const { data: monthlyBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['/api/availability-slots', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: () => {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      return fetch(`/api/availability-slots/${firstDay.toISOString().split('T')[0]}/${lastDay.toISOString().split('T')[0]}`)
        .then(res => res.json());
    },
  });

  // Fetch daily bookings when a specific date is selected
  const { data: dailyBookings = [], isLoading: loadingDaily } = useQuery({
    queryKey: ['/api/availability-slots', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const res = await fetch(`/api/availability-slots?date=${selectedDate}`);
      if (!res.ok) {
        console.error('Failed to fetch daily bookings:', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedDate,
  });

  // Fetch lead details for booked appointments
  const { data: bookedLeads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['/api/multi-service-leads'],
    queryFn: () => fetch('/api/multi-service-leads').then(res => res.json()),
  });

  // Fetch blocked dates for the current month
  const { data: blockedDates = [] } = useQuery({
    queryKey: ['/api/blocked-dates', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: () => {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return fetch(`/api/blocked-dates?startDate=${firstDay.toISOString().split('T')[0]}&endDate=${lastDay.toISOString().split('T')[0]}`).then(res => res.json());
    },
  });

  // Fetch work orders for the current month
  const { data: workOrders = [] } = useQuery({
    queryKey: ['/api/work-orders', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: () => fetch('/api/work-orders').then(res => res.json()),
  });

  // Google Calendar integration
  const { data: googleCalendarStatus } = useQuery({
    queryKey: ['/api/google-calendar/status'],
    queryFn: () => fetch('/api/google-calendar/status').then(res => res.json()),
  });

  // Fetch Google Calendar events for the current month
  const { data: googleCalendarEvents = [] } = useQuery({
    queryKey: ['/api/google-calendar/events', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      if (!googleCalendarStatus?.connected) return [];
      
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const res = await fetch(`/api/google-calendar/events?startDate=${firstDay.toISOString().split('T')[0]}&endDate=${lastDay.toISOString().split('T')[0]}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: googleCalendarStatus?.connected === true,
  });

  // Fetch available Google Calendars
  const { data: availableCalendars = [] } = useQuery({
    queryKey: ['/api/google-calendar/calendars'],
    queryFn: async () => {
      const res = await fetch('/api/google-calendar/calendars');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: googleCalendarStatus?.connected === true,
  });

  // Fetch current user data to get selected calendars
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: () => fetch('/api/auth/user').then(res => res.json()),
  });

  // Update selected calendars when user data changes
  useEffect(() => {
    if (currentUser?.selectedCalendarIds) {
      setSelectedCalendars(currentUser.selectedCalendarIds);
    }
  }, [currentUser]);

  // Initialize maxDaysOut from business settings
  useEffect(() => {
    if (businessSettings?.maxDaysOut !== undefined) {
      setMaxDaysOut(businessSettings.maxDaysOut || 90);
    }
  }, [businessSettings]);

  const handleConnectGoogleCalendar = () => {
    window.location.href = '/api/google-calendar/connect';
  };

  const saveSelectedCalendarsMutation = useMutation({
    mutationFn: (calendarIds: string[]) => 
      apiRequest('POST', '/api/google-calendar/selected-calendars', { calendarIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/events'] });
      setCalendarSelectDialogOpen(false);
      toast({
        title: "Calendars updated",
        description: "Your selected calendars have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save selected calendars. Please try again.",
        variant: "destructive",
      });
    },
  });

  const disconnectGoogleCalendarMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/google-calendar/disconnect', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/status'] });
      toast({
        title: "Google Calendar disconnected",
        description: "Your Google Calendar has been disconnected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect Google Calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Block date mutation
  const blockDateMutation = useMutation({
    mutationFn: (data: { startDate: string; endDate: string; reason?: string }) =>
      apiRequest('POST', '/api/blocked-dates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-dates'] });
      setBlockDialogOpen(false);
      setBlockStartDate('');
      setBlockEndDate('');
      setBlockReason('');
      toast({
        title: "Dates blocked",
        description: "The selected dates have been blocked successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to block dates. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Unblock date mutation
  const unblockDateMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/blocked-dates/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-dates'] });
      toast({
        title: "Dates unblocked",
        description: "The dates have been unblocked successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unblock dates. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save availability mutation - saves both schedule and maxDaysOut
  const saveAvailabilityMutation = useMutation({
    mutationFn: async () => {
      // Save weekly schedule
      await apiRequest('POST', '/api/recurring-availability/save-schedule', { schedule: weeklySchedule });
      // Save maxDaysOut to business settings
      await apiRequest('PATCH', '/api/business-settings', { maxDaysOut });
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your availability schedule and booking settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-availability'] });
      queryClient.invalidateQueries({ queryKey: ['/api/business-settings'] });
    },
    onError: (error: any) => {
      console.error("Save settings error:", error);
      toast({
        title: "Error",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Load existing settings on mount
  useEffect(() => {
    if (existingSettings?.schedule) {
      setWeeklySchedule(existingSettings.schedule);
    }
  }, [existingSettings]);

  const updateDayAvailability = (dayIndex: number, updates: Partial<DayAvailability>) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], ...updates }
    }));
  };

  const generateTimeSlots = (startTime: string, endTime: string, duration: number) => {
    const slots = [];
    const start = new Date(`2024-01-01T${startTime}:00`);
    const end = new Date(`2024-01-01T${endTime}:00`);
    
    while (start < end) {
      const slotEnd = new Date(start.getTime() + duration * 60000);
      if (slotEnd <= end) {
        slots.push({
          start: start.toTimeString().slice(0, 5),
          end: slotEnd.toTimeString().slice(0, 5)
        });
      }
      start.setTime(start.getTime() + duration * 60000);
    }
    
    return slots;
  };

  const getTotalAvailableHours = () => {
    return Object.values(weeklySchedule).reduce((total, day) => {
      if (!day.enabled) return total;
      
      const start = new Date(`2024-01-01T${day.startTime}:00`);
      const end = new Date(`2024-01-01T${day.endTime}:00`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      return total + hours;
    }, 0);
  };

  const getEnabledDaysCount = () => {
    return Object.values(weeklySchedule).filter(day => day.enabled).length;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getBookedSlots = () => {
    if (!Array.isArray(monthlyBookings)) return 0;
    return monthlyBookings.filter((slot: any) => slot.isBooked).length;
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getBookingsForDate = (dateStr: string) => {
    if (!Array.isArray(monthlyBookings)) return [];
    const filtered = monthlyBookings.filter((booking: any) => booking.date === dateStr);
    return filtered;
  };

  const getLeadDetails = (leadId: number) => {
    return bookedLeads.find((lead: BookedLead) => lead.id === leadId);
  };

  const isDateBlocked = (dateStr: string) => {
    if (!Array.isArray(blockedDates)) return null;
    return blockedDates.find((blocked: any) => {
      return dateStr >= blocked.startDate && dateStr <= blocked.endDate;
    });
  };

  const getGoogleEventsForDate = (dateStr: string) => {
    if (!Array.isArray(googleCalendarEvents)) return [];
    return googleCalendarEvents.filter((event: any) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const date = new Date(dateStr);
      
      // Check if event occurs on this date
      const eventDate = eventStart.toISOString().split('T')[0];
      return eventDate === dateStr || (event.isAllDay && eventDate === dateStr);
    });
  };

  const getWorkOrdersForDate = (dateStr: string) => {
    if (!Array.isArray(workOrders)) return [];
    return workOrders.filter((workOrder: any) => {
      if (!workOrder.scheduledDate) return false;
      // Handle both "YYYY-MM-DD" and "YYYY-MM-DD HH:MM:SS" formats
      const workOrderDate = workOrder.scheduledDate.split(' ')[0];
      return workOrderDate === dateStr;
    });
  };

  const handleBlockDates = () => {
    if (!blockStartDate || !blockEndDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }
    
    if (blockStartDate > blockEndDate) {
      toast({
        title: "Error",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }
    
    blockDateMutation.mutate({
      startDate: blockStartDate,
      endDate: blockEndDate,
      reason: blockReason || undefined
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = formatDateForAPI(clickedDate);
    
    if (blockingMode) {
      // If in blocking mode, open the blocking dialog for this date
      setSelectedDateForBlocking(dateStr);
      setBlockStartDate(dateStr);
      setBlockEndDate(dateStr);
      setBlockDialogOpen(true);
    } else {
      // Normal behavior: view the day
      setSelectedDate(dateStr);
      setView('day');
    }
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();
    const todayStr = formatDateForAPI(today);

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-gray-200 bg-gray-50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateForAPI(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      const dayBookings = getBookingsForDate(dateStr);
      const bookedCount = dayBookings.filter((b: any) => b.isBooked).length;
      const availableCount = dayBookings.filter((b: any) => !b.isBooked).length;
      const blocked = isDateBlocked(dateStr);
      const googleEvents = getGoogleEventsForDate(dateStr);
      const dayWorkOrders = getWorkOrdersForDate(dateStr);
      const isToday = dateStr === todayStr;
      const totalEvents = bookedCount + googleEvents.length + dayWorkOrders.length;
      
      days.push(
        <div
          key={day}
          className={`min-h-[100px] border-r border-b border-gray-200 p-2 cursor-pointer transition-colors ${
            blocked 
              ? 'bg-gray-100 hover:bg-gray-200' 
              : blockingMode
                ? 'hover:bg-red-50'
                : 'hover:bg-blue-50'
          }`}
          onClick={() => handleDateClick(day)}
          data-testid={`calendar-day-${day}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${
              isToday 
                ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' 
                : blocked
                  ? 'text-gray-500'
                  : 'text-gray-700'
            }`}>
              {day}
            </span>
            {blocked && <Ban className="w-3 h-3 text-gray-500" />}
          </div>
          <div className="space-y-1">
            {blocked ? (
              <div className="text-xs text-gray-600 bg-gray-200 rounded px-1.5 py-0.5 truncate">
                🚫 Blocked
              </div>
            ) : (
              <>
                {(() => {
                  // Combine all events into a single array with type indicators
                  const allEvents = [
                    ...dayWorkOrders.map((wo: any) => ({ type: 'work', title: wo.title || 'Work Order', bg: 'bg-purple-100', text: 'text-purple-700' })),
                    ...googleEvents.map((e: any) => ({ type: 'google', title: e.title || 'Event', bg: 'bg-blue-100', text: 'text-blue-700' })),
                    ...dayBookings.filter((b: any) => b.isBooked).map((b: any) => ({ type: 'booking', title: b.title || `${formatTime(b.startTime)} Booking`, bg: 'bg-green-100', text: 'text-green-700' }))
                  ];
                  
                  const displayEvents = allEvents.slice(0, 2);
                  const remainingCount = allEvents.length - 2;
                  
                  return (
                    <>
                      {displayEvents.map((event, idx) => (
                        <div key={idx} className={`text-xs ${event.bg} ${event.text} rounded px-1.5 py-0.5 truncate`}>
                          {event.title}
                        </div>
                      ))}
                      {remainingCount > 0 && (
                        <div className="text-xs text-gray-500 px-1.5">
                          +{remainingCount} more
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  // Settings dialog state
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="h-full bg-white flex flex-col">
        {/* Google Calendar-style Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-normal text-gray-800">
                {view === 'month' 
                  ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''
                }
              </h1>
              {view === 'month' && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => navigateMonth('prev')}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    data-testid="button-prev-month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => navigateMonth('next')}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    data-testid="button-next-month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {view === 'day' && (
                <Button
                  onClick={() => {
                    setView('month');
                    setSelectedDate(null);
                  }}
                  variant="outline"
                  size="sm"
                  data-testid="button-back-to-month"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Month
                </Button>
              )}
              <Button
                onClick={() => {
                  const today = new Date();
                  setCurrentDate(today);
                  setView('month');
                }}
                variant="outline"
                size="sm"
                data-testid="button-today"
              >
                Today
              </Button>
              <Button
                onClick={() => setSettingsDialogOpen(true)}
                variant="outline"
                size="sm"
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">{/* Calendar Content Container */}
          
          <div className="flex gap-2 w-full sm:w-auto">
            {view === 'day' && (
              <Button
                onClick={() => {
                  setView('month');
                  setSelectedDate(null);
                }}
                variant="outline"
                className="border-blue-200 hover:bg-blue-50 flex-1 sm:flex-none"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Calendar</span>
                <span className="sm:hidden">Back</span>
              </Button>
            )}
            
            {view === 'month' && (
              <>
                <Button 
                  variant={blockingMode ? "default" : "outline"}
                  className={blockingMode ? "bg-red-600 hover:bg-red-700 flex-1 sm:flex-none" : "border-red-200 hover:bg-red-50 flex-1 sm:flex-none"}
                  onClick={() => setBlockingMode(!blockingMode)}
                  data-testid="button-toggle-blocking-mode"
                >
                  <Ban className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{blockingMode ? "Exit Blocking Mode" : "Block Dates"}</span>
                  <span className="sm:hidden">{blockingMode ? "Exit" : "Block"}</span>
                </Button>
                
                <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block Dates</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={blockStartDate}
                          onChange={(e) => setBlockStartDate(e.target.value)}
                          data-testid="input-block-start-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date (for date range)</Label>
                        <Input
                          type="date"
                          value={blockEndDate}
                          onChange={(e) => setBlockEndDate(e.target.value)}
                          data-testid="input-block-end-date"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="whole-day"
                            checked={blockWholeDay}
                            onCheckedChange={(checked) => setBlockWholeDay(!!checked)}
                            data-testid="checkbox-whole-day"
                          />
                          <Label htmlFor="whole-day">Block whole day(s)</Label>
                        </div>
                      </div>
                      
                      {!blockWholeDay && (
                        <div className="space-y-2">
                          <Label>Time Range</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="time"
                              value={blockTimeStart}
                              onChange={(e) => setBlockTimeStart(e.target.value)}
                              data-testid="input-block-time-start"
                            />
                            <span>to</span>
                            <Input
                              type="time"
                              value={blockTimeEnd}
                              onChange={(e) => setBlockTimeEnd(e.target.value)}
                              data-testid="input-block-time-end"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Note: Specific time blocking is coming soon. For now, this will block the whole day.
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Reason (Optional)</Label>
                        <Textarea
                          placeholder="e.g., Vacation, Closed for maintenance"
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          data-testid="input-block-reason"
                        />
                      </div>
                      <Button
                        onClick={handleBlockDates}
                        disabled={blockDateMutation.isPending}
                        className="w-full bg-red-600 hover:bg-red-700"
                        data-testid="button-confirm-block"
                      >
                        {blockDateMutation.isPending ? "Blocking..." : "Block Dates"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 flex-1 sm:flex-none shadow-lg">
                  <Settings className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                  <span className="sm:hidden">Set Schedule</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Calendar Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Button
                    onClick={() => saveAvailabilityMutation.mutate()}
                    disabled={saveAvailabilityMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    data-testid="button-save-schedule"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveAvailabilityMutation.isPending ? "Saving..." : "Save Schedule"}
                  </Button>
                  
                  {/* Booking Window Setting */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Booking Window
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Control how far in advance customers can book appointments
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Label className="text-sm font-medium text-gray-700 min-w-[140px]">
                          Max days in advance:
                        </Label>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="number"
                            value={maxDaysOut || ''}
                            onChange={(e) => setMaxDaysOut(parseInt(e.target.value) || 90)}
                            min="1"
                            max="365"
                            className="w-24"
                            data-testid="input-max-days-out"
                          />
                          <span className="text-sm text-gray-600">days</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        {maxDaysOut ? 
                          `Customers can book appointments up to ${maxDaysOut} days in advance` : 
                          'Set how many days ahead customers can book'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  {/* Weekly Schedule Setup */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Weekly Availability Schedule
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Configure which days you're available and set your working hours and appointment intervals
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                        const dayData = weeklySchedule[dayIndex];
                        
                        return (
                          <div key={dayIndex} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b last:border-b-0">
                            {/* Day Name and Toggle */}
                            <div className="flex items-center justify-between sm:justify-start sm:w-40 gap-3">
                              <Switch
                                checked={dayData.enabled}
                                onCheckedChange={(checked) => 
                                  updateDayAvailability(dayIndex, { enabled: !!checked })
                                }
                              />
                              <Label className="text-sm font-medium text-gray-700">{dayName}</Label>
                            </div>
                            
                            {/* Time Inputs or Closed Status */}
                            {dayData.enabled ? (
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-gray-500 w-12">From</Label>
                                  <Input
                                    type="time"
                                    value={dayData.startTime}
                                    onChange={(e) => updateDayAvailability(dayIndex, { startTime: e.target.value })}
                                    className="h-9 text-sm"
                                  />
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-gray-500 w-12">To</Label>
                                  <Input
                                    type="time"
                                    value={dayData.endTime}
                                    onChange={(e) => updateDayAvailability(dayIndex, { endTime: e.target.value })}
                                    className="h-9 text-sm"
                                  />
                                </div>
                                
                                <div className="hidden lg:flex items-center gap-2">
                                  <Label className="text-xs text-gray-500 whitespace-nowrap">Duration</Label>
                                  <Select
                                    value={dayData.slotDuration.toString()}
                                    onValueChange={(value) => updateDayAvailability(dayIndex, { slotDuration: parseInt(value) })}
                                  >
                                    <SelectTrigger className="h-9 w-28 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="15">15 min</SelectItem>
                                      <SelectItem value="30">30 min</SelectItem>
                                      <SelectItem value="45">45 min</SelectItem>
                                      <SelectItem value="60">1 hour</SelectItem>
                                      <SelectItem value="90">1.5 hours</SelectItem>
                                      <SelectItem value="120">2 hours</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <Badge variant="secondary" className="self-start sm:self-center text-xs whitespace-nowrap">
                                  {generateTimeSlots(dayData.startTime, dayData.endTime, dayData.slotDuration).length} slots
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-gray-400 flex-1">
                                <Clock className="w-4 h-4" />
                                <span>Closed</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Calendar Content */}
          {view === 'month' ? (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                variant={blockingMode ? "default" : "outline"}
                className={blockingMode ? "bg-red-600 hover:bg-red-700" : ""}
                onClick={() => setBlockingMode(!blockingMode)}
                data-testid="button-toggle-blocking-mode"
                size="sm"
              >
                <Ban className="w-4 h-4 mr-2" />
                {blockingMode ? "Exit Blocking Mode" : "Block Dates"}
              </Button>
              
              {googleCalendarStatus?.connected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalendarSelectDialogOpen(true)}
                  data-testid="button-manage-calendars"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Calendars
                </Button>
              )}
            </div>

            {/* Blocking Mode Indicator */}
            {blockingMode && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Ban className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">Blocking Mode Active</p>
                    <p className="text-sm text-red-700">Click on any date to block it</p>
                  </div>
                </div>
              </div>
            )}

            {/* Google Calendar-Style Grid */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-r last:border-r-0 border-gray-200">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {renderCalendarGrid()}
              </div>
            </div>

            {/* Calendar Selection Dialog */}
            <Dialog open={calendarSelectDialogOpen} onOpenChange={setCalendarSelectDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Select Calendars to Sync</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Choose which Google Calendars you want to sync with your booking calendar.
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableCalendars.map((calendar: any) => (
                      <div
                        key={calendar.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        <Checkbox
                          id={`calendar-${calendar.id}`}
                          checked={selectedCalendars.includes(calendar.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCalendars([...selectedCalendars, calendar.id]);
                            } else {
                              setSelectedCalendars(selectedCalendars.filter(id => id !== calendar.id));
                            }
                          }}
                          data-testid={`checkbox-calendar-${calendar.id}`}
                        />
                        <label
                          htmlFor={`calendar-${calendar.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: calendar.backgroundColor || '#4285F4' }}
                            />
                            <span className="font-medium">{calendar.summary}</span>
                            {calendar.primary && (
                              <Badge variant="outline" className="text-xs">Primary</Badge>
                            )}
                          </div>
                          {calendar.description && (
                            <p className="text-sm text-gray-500 mt-1">{calendar.description}</p>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setCalendarSelectDialogOpen(false)}
                      data-testid="button-cancel-calendars"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => saveSelectedCalendarsMutation.mutate(selectedCalendars)}
                      disabled={saveSelectedCalendarsMutation.isPending}
                      data-testid="button-save-calendars"
                    >
                      {saveSelectedCalendarsMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">{/* Daily View - Google Calendar Style */}
            {loadingDaily ? (
              <div className="text-center py-12 text-gray-500">Loading schedule...</div>
            ) : (
              <>
                {/* Work Orders Section */}
                {selectedDate && getWorkOrdersForDate(selectedDate).length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Work Orders
                    </h3>
                    <div className="space-y-2">
                      {getWorkOrdersForDate(selectedDate).map((workOrder: any) => (
                        <div
                          key={workOrder.id}
                          className="border-l-4 border-purple-500 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="font-medium text-gray-900 mb-1">{workOrder.title}</div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            {workOrder.scheduledTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{workOrder.scheduledTime}</span>
                              </div>
                            )}
                            {workOrder.customerName && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{workOrder.customerName}</span>
                              </div>
                            )}
                          </div>
                          {workOrder.customerAddress && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <MapPin className="w-4 h-4" />
                              <span>{workOrder.customerAddress}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Calendar Events */}
                {selectedDate && googleCalendarStatus?.connected && getGoogleEventsForDate(selectedDate).length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Google Calendar Events
                    </h3>
                    <div className="space-y-2">
                      {getGoogleEventsForDate(selectedDate).map((event: any) => (
                        <div
                          key={event.id}
                          className="border-l-4 border-blue-500 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="font-medium text-gray-900 mb-1">{event.title}</div>
                          {!event.isAllDay && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(event.start).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit', 
                                  hour12: true 
                                })} - {new Date(event.end).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit', 
                                  hour12: true 
                                })}
                              </span>
                            </div>
                          )}
                          {event.isAllDay && <div className="text-sm text-gray-600">All Day</div>}
                          {event.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bookings Section */}
                {selectedDate && (getWorkOrdersForDate(selectedDate).length > 0 || (googleCalendarStatus?.connected && getGoogleEventsForDate(selectedDate).length > 0) || dailyBookings.length > 0) && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Bookings
                    </h3>
                    <div className="space-y-2">
                      {dailyBookings.length === 0 && getWorkOrdersForDate(selectedDate).length === 0 && (!googleCalendarStatus?.connected || getGoogleEventsForDate(selectedDate).length === 0) ? (
                        <div className="text-center py-12 text-gray-500">
                          No appointments scheduled for this day.
                        </div>
                      ) : (
                        dailyBookings.map((slot: AvailabilitySlot) => {
                          const leadDetails = slot.bookedBy ? getLeadDetails(slot.bookedBy) : null;
                          
                          return (
                            <div
                              key={slot.id}
                              className={`border-l-4 ${
                                slot.isBooked ? 'border-green-500' : 'border-gray-300'
                              } bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-600" />
                                  <span className="font-medium text-gray-900">
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </span>
                                </div>
                                <Badge variant={slot.isBooked ? "default" : "outline"} className={slot.isBooked ? "bg-green-100 text-green-800 border-green-200" : ""}>
                                  {slot.isBooked ? "Booked" : "Available"}
                                </Badge>
                              </div>
                              
                              {slot.isBooked && leadDetails && (
                                <div className="space-y-1 pt-2 border-t border-gray-100">
                                  <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <User className="w-4 h-4" />
                                    <span className="font-medium">{leadDetails.name}</span>
                                  </div>
                                  {leadDetails.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Mail className="w-4 h-4" />
                                      <span>{leadDetails.email}</span>
                                    </div>
                                  )}
                                  {leadDetails.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Phone className="w-4 h-4" />
                                      <span>{leadDetails.phone}</span>
                                    </div>
                                  )}
                                  {leadDetails.address && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <MapPin className="w-4 h-4" />
                                      <span>{leadDetails.address}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                    <span>Total: ${leadDetails.totalPrice}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <strong>Services:</strong> {leadDetails.services.map((s: any) => s.formulaName).join(', ')}
                                  </div>
                                </div>
                              )}
                              
                              {slot.notes && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <strong>Notes:</strong> {slot.notes}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          )}{/* End of month/day view ternary */}
        </div>{/* End of max-w-7xl container */}
      </div>{/* End of flex-1 overflow-auto container */}

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Calendar Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                onClick={() => saveAvailabilityMutation.mutate()}
                disabled={saveAvailabilityMutation.isPending}
                className="w-full"
                data-testid="button-save-settings"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveAvailabilityMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
              
              {/* Availability settings content from earlier in the file */}
              <p className="text-sm text-gray-600">Configure your weekly schedule, blocked dates, and Google Calendar sync in this dialog.</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Block Dates Dialog */}
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block Dates</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={blockStartDate}
                  onChange={(e) => setBlockStartDate(e.target.value)}
                  data-testid="input-block-start"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={blockEndDate}
                  onChange={(e) => setBlockEndDate(e.target.value)}
                  data-testid="input-block-end"
                />
              </div>
              <div>
                <Label>Reason (Optional)</Label>
                <Textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g., Vacation"
                  data-testid="input-block-reason"
                />
              </div>
              <Button
                onClick={handleBlockDates}
                disabled={blockDateMutation.isPending}
                className="w-full"
                data-testid="button-submit-block"
              >
                {blockDateMutation.isPending ? "Blocking..." : "Block Dates"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}