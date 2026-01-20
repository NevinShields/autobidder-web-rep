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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Settings, Save, Clock, CheckCircle, X, ChevronLeft, ChevronRight, Plus, ArrowLeft, MapPin, Phone, Mail, User, Ban, Trash2, ChevronDown, ExternalLink, Edit2 } from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

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
  // Joined lead data (when fetched with includeLeads=true)
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  leadAddress?: string;
  leadServices?: Array<{
    formulaId: number;
    formulaName: string;
    variables: Record<string, any>;
    calculatedPrice: number;
  }>;
  leadTotalPrice?: number;
  leadStage?: string;
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
  const [, navigate] = useLocation();

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
  const [blockedDatesOpen, setBlockedDatesOpen] = useState(false);
  
  // Schedule dialog state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDateForSchedule, setSelectedDateForSchedule] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<'event' | 'workorder'>('workorder');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(null);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleDuration, setScheduleDuration] = useState(60);
  const [eventTitle, setEventTitle] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  
  // Calendar selection state
  const [calendarSelectDialogOpen, setCalendarSelectDialogOpen] = useState(false);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  
  // Drag selection state
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [currentHoverDate, setCurrentHoverDate] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragActionDialogOpen, setDragActionDialogOpen] = useState(false);

  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  
  // FAB menu state
  const [fabOpen, setFabOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  // Mobile detection
  const isMobile = useIsMobile();

  // Booking details dialog state
  const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AvailabilitySlot | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // Global cleanup for drag selection
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      // Only open dialog if user actually dragged to a different date
      if (hasDragged && dragStart && currentHoverDate && dragStart !== currentHoverDate) {
        setDragActionDialogOpen(true);
      } else {
        // If not opening dialog, reset immediately
        setDragStart(null);
        setCurrentHoverDate(null);
      }
      // Always reset these flags
      setIsDragging(false);
      setHasDragged(false);
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [isDragging, hasDragged, dragStart, currentHoverDate]);
  
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

  // Fetch bookings for current month with lead data included
  const { data: monthlyBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['/api/availability-slots', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: () => {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      return fetch(`/api/availability-slots/${firstDay.toISOString().split('T')[0]}/${lastDay.toISOString().split('T')[0]}?includeLeads=true`)
        .then(res => res.json());
    },
  });

  // Fetch daily bookings when a specific date is selected (with lead data)
  const { data: dailyBookings = [], isLoading: loadingDaily } = useQuery({
    queryKey: ['/api/availability-slots', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const res = await fetch(`/api/availability-slots?date=${selectedDate}&includeLeads=true`);
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

  // Fetch unscheduled work orders
  const { data: unscheduledWorkOrders = [] } = useQuery({
    queryKey: ['/api/work-orders/unscheduled'],
    queryFn: async () => {
      const res = await fetch('/api/work-orders');
      if (!res.ok) return [];
      const allWorkOrders = await res.json();
      return allWorkOrders.filter((wo: any) => !wo.scheduledDate);
    },
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

  // Schedule work order mutation
  const scheduleWorkOrderMutation = useMutation({
    mutationFn: (data: { workOrderId: number; scheduledDate: string; scheduledTime: string; duration: number }) =>
      apiRequest('PATCH', `/api/work-orders/${data.workOrderId}`, {
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        duration: data.duration,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/unscheduled'] });
      queryClient.invalidateQueries({ queryKey: ['/api/availability-slots'] });
      setScheduleDialogOpen(false);
      toast({
        title: "Work order scheduled",
        description: "The work order has been scheduled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule work order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create calendar event mutation
  const createEventMutation = useMutation({
    mutationFn: (data: { date: string; startTime: string; endTime: string; title: string; notes?: string }) => {
      const startDateTime = `${data.date} ${data.startTime}:00`;
      const endDateTime = `${data.date} ${data.endTime}:00`;
      
      return apiRequest('POST', '/api/availability-slots', {
        date: data.date,
        startTime: startDateTime,
        endTime: endDateTime,
        isBooked: true,
        title: data.title,
        notes: data.notes || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability-slots'] });
      setScheduleDialogOpen(false);
      toast({
        title: "Event created",
        description: "The event has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
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

  // Drag selection helper functions
  const getDateRange = (startDateStr: string, endDateStr: string): string[] => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const range: string[] = [];
    
    // Normalize: ensure start is before end
    const [earlier, later] = start <= end ? [start, end] : [end, start];
    
    // Walk through each day
    const current = new Date(earlier);
    while (current <= later) {
      range.push(formatDateForAPI(current));
      current.setDate(current.getDate() + 1);
    }
    
    return range;
  };

  const isDateInDragRange = (dateStr: string): boolean => {
    if (!dragStart || !currentHoverDate || !isDragging) return false;
    const range = getDateRange(dragStart, currentHoverDate);
    return range.includes(dateStr);
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
    // Only guard against clicks if user actually dragged
    if (hasDragged && !isMobile) return;
    
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = formatDateForAPI(clickedDate);
    
    if (blockingMode) {
      // If in blocking mode, open the blocking dialog for this date
      setSelectedDateForBlocking(dateStr);
      setBlockStartDate(dateStr);
      setBlockEndDate(dateStr);
      setBlockDialogOpen(true);
    } else if (isMobile) {
      // On mobile, open the schedule sheet
      setSelectedDate(dateStr);
      setScheduleSheetOpen(true);
    } else {
      // Normal behavior: view the day
      setSelectedDate(dateStr);
      setView('day');
    }
  };

  const handleDragStart = (dateStr: string) => {
    // Don't allow drag selection in blocking mode
    if (blockingMode) return;
    
    setDragStart(dateStr);
    setCurrentHoverDate(dateStr);
    setIsDragging(true);
    setHasDragged(false);
  };

  const handleDragHover = (dateStr: string) => {
    if (isDragging && dragStart) {
      setCurrentHoverDate(dateStr);
      // Mark as dragged if moved to a different cell
      if (dateStr !== dragStart) {
        setHasDragged(true);
      }
    }
  };

  const openScheduleDialog = (dateStr: string) => {
    setSelectedDateForSchedule(dateStr);
    setScheduleTime('09:00');
    setScheduleDuration(60);
    setSelectedWorkOrderId(null);
    setEventTitle('');
    setEventNotes('');
    setScheduleType(unscheduledWorkOrders.length > 0 ? 'workorder' : 'event');
    setScheduleDialogOpen(true);
  };

  const handleScheduleSubmit = () => {
    if (!selectedDateForSchedule) return;

    if (scheduleType === 'workorder') {
      if (!selectedWorkOrderId) {
        toast({
          title: "Error",
          description: "Please select a work order to schedule.",
          variant: "destructive",
        });
        return;
      }
      scheduleWorkOrderMutation.mutate({
        workOrderId: selectedWorkOrderId,
        scheduledDate: selectedDateForSchedule,
        scheduledTime: scheduleTime,
        duration: scheduleDuration,
      });
    } else {
      if (!eventTitle.trim()) {
        toast({
          title: "Error",
          description: "Please enter an event title.",
          variant: "destructive",
        });
        return;
      }
      // Calculate end time properly by converting to total minutes
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      const totalStartMinutes = hours * 60 + minutes;
      const totalEndMinutes = totalStartMinutes + scheduleDuration;
      const endHours = Math.floor(totalEndMinutes / 60);
      const endMinutes = totalEndMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
      
      createEventMutation.mutate({
        date: selectedDateForSchedule,
        startTime: scheduleTime,
        endTime: endTime,
        title: eventTitle,
        notes: eventNotes,
      });
    }
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="border-b border-r dark:border-gray-700"></div>);
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
      const hasEvents = bookedCount > 0 || availableCount > 0 || blocked || googleEvents.length > 0 || dayWorkOrders.length > 0;
      
      const inDragRange = isDateInDragRange(dateStr);
      const isDragStart = dragStart === dateStr && isDragging;
      const isDragEnd = currentHoverDate === dateStr && isDragging;
      
      const dayContent = (
        <>
          <div className={`text-sm font-medium mb-1 flex items-center justify-between ${isMobile ? 'p-2' : ''} dark:text-white`}>
            <span>{day}</span>
            {blocked && !isMobile && (
              <Ban className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            )}
          </div>
          {!isMobile && (
            <div className="space-y-1 overflow-hidden">
              {blocked ? (
                <>
                  <div className="text-xs bg-gray-400 text-white px-1 py-0.5 rounded truncate">
                    Blocked
                  </div>
                  {blocked.reason && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {blocked.reason}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {dayWorkOrders.length > 0 && (
                    <div className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded truncate dark:bg-purple-900/40 dark:text-purple-300">
                      🔧 {dayWorkOrders.length} work order{dayWorkOrders.length > 1 ? 's' : ''}
                    </div>
                  )}
                  {googleEvents.length > 0 && (
                    <div className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate dark:bg-blue-900/40 dark:text-blue-300">
                      📅 {googleEvents.length} event{googleEvents.length > 1 ? 's' : ''}
                    </div>
                  )}
                  {bookedCount > 0 && (
                    <div className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded truncate dark:bg-red-900/40 dark:text-red-300">
                      {bookedCount} booked
                    </div>
                  )}
                  {availableCount > 0 && (
                    <div className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded truncate dark:bg-green-900/40 dark:text-green-300">
                      {availableCount} available
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {isMobile && hasEvents && !blocked && (
             <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-blue-500"></div>
          )}
          {isMobile && blocked && (
            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-gray-400"></div>
          )}
        </>
      );

      days.push(
        <div
          key={day}
          className={`relative border-b border-r p-1 cursor-pointer transition-all select-none dark:border-gray-700
            ${isMobile ? 'h-16' : 'h-24'}
            ${inDragRange
              ? `bg-blue-100 border-blue-400 dark:bg-blue-900/40 dark:border-blue-500 ${isDragStart ? 'ring-2 ring-blue-500' : ''} ${isDragEnd ? 'ring-2 ring-blue-600' : ''}`
              : blocked 
                ? 'bg-gray-100/50 dark:bg-gray-800/50' 
                : blockingMode
                  ? 'border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-500 hover:shadow-md'
                  : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95'
          }`}
          onClick={() => handleDateClick(day)}
          onMouseDown={() => handleDragStart(dateStr)}
          onMouseEnter={() => handleDragHover(dateStr)}
          data-testid={`calendar-day-${day}`}
        >
          {dayContent}
        </div>
      );
    }

    return days;
  };

  const DailyScheduleSheet = ({ date, isOpen, onOpenChange }: { date: string | null; isOpen: boolean; onOpenChange: (open: boolean) => void }) => {
    if (!date) return null;
    
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>
              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </SheetTitle>
          </SheetHeader>
          <div className="py-4 overflow-y-auto">
            {renderDayView(date)}
          </div>
        </SheetContent>
      </Sheet>
    )
  };

  const renderDayView = (dateStr: string | null) => {
    if (!dateStr) return null;

    const dayWorkOrders = getWorkOrdersForDate(dateStr);
    const dayGoogleEvents = getGoogleEventsForDate(dateStr);
    const dayBookings = dailyBookings;
    const blocked = isDateBlocked(dateStr);

    // Check if there's anything to show
    const hasContent = dayWorkOrders.length > 0 || dayGoogleEvents.length > 0 || dayBookings.length > 0 || blocked;

    return (
      <div className="space-y-4">
        {/* Blocked Date Notice */}
        {blocked && (
          <div className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium">
              <Ban className="w-4 h-4" />
              <span>This date is blocked</span>
            </div>
            {blocked.reason && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{blocked.reason}</p>
            )}
          </div>
        )}

        {/* Work Orders */}
        {dayWorkOrders.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Work Orders
            </h3>
            <div className="space-y-2">
              {dayWorkOrders.map((workOrder: any) => (
                <div
                  key={workOrder.id}
                  className="border border-purple-200 dark:border-purple-800 rounded-lg p-3 bg-purple-50 dark:bg-purple-900/30"
                >
                  <div className="font-medium text-purple-900 dark:text-purple-100 text-sm">
                    {workOrder.title || `Work Order #${workOrder.workOrderNumber}`}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-700 mt-1">
                    <User className="w-3 h-3" />
                    <span>{workOrder.customerName}</span>
                  </div>
                  {workOrder.scheduledTime && (
                    <div className="flex items-center gap-2 text-xs text-purple-700 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{workOrder.scheduledTime}</span>
                    </div>
                  )}
                  {workOrder.customerAddress && (
                    <div className="flex items-center gap-2 text-xs text-purple-600 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{workOrder.customerAddress}</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="bg-purple-200 text-purple-800 text-xs">
                      {workOrder.status || 'scheduled'}
                    </Badge>
                    <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">
                      ${(workOrder.totalAmount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Google Calendar Events */}
        {dayGoogleEvents.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Google Calendar
            </h3>
            <div className="space-y-2">
              {dayGoogleEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="border border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/30"
                >
                  <div className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                    {event.title}
                  </div>
                  {!event.isAllDay ? (
                    <div className="flex items-center gap-2 text-xs text-blue-700 mt-1">
                      <Clock className="w-3 h-3" />
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
                  ) : (
                    <div className="text-xs text-blue-700 mt-1">All Day</div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings */}
        {dayBookings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Bookings
            </h3>
            <div className="space-y-2">
              {dayBookings.map((slot: AvailabilitySlot) => {
                const leadDetails = slot.bookedBy ? getLeadDetails(slot.bookedBy) : null;

                return (
                  <div
                    key={slot.id}
                    onClick={() => {
                      if (slot.isBooked) {
                        setSelectedBooking(slot);
                        setBookingDetailsOpen(true);
                        setScheduleSheetOpen(false);
                      }
                    }}
                    className={`border rounded-lg p-3 transition-all ${
                      slot.isBooked
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 active:scale-[0.98]'
                        : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                      <Badge variant={slot.isBooked ? "destructive" : "default"} className="text-xs">
                        {slot.isBooked ? "Booked" : "Available"}
                      </Badge>
                    </div>

                    {slot.isBooked && (slot.leadName || leadDetails) && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <User className="w-3 h-3 text-gray-500" />
                          <span className="font-medium">{slot.leadName || leadDetails?.name}</span>
                        </div>
                        {(slot.leadPhone || leadDetails?.phone) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{slot.leadPhone || leadDetails?.phone}</span>
                          </div>
                        )}
                        {(slot.leadAddress || leadDetails?.address) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{slot.leadAddress || leadDetails?.address}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">Tap for details</div>
                      </div>
                    )}

                    {slot.isBooked && !slot.leadName && !leadDetails && slot.title && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span className="font-medium">{slot.title}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Tap for details</div>
                      </div>
                    )}

                    {!slot.isBooked && (
                      <div className="text-xs text-green-600 mt-1">
                        Available for booking
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasContent && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No events scheduled for this day.</p>
          </div>
        )}

        {/* Add Event Button */}
        <Button
          onClick={() => {
            setScheduleSheetOpen(false);
            openScheduleDialog(dateStr);
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>
    );
  };


  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {view === 'month' ? 'Calendar & Bookings' : 'Daily Schedule'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                {view === 'month' 
                  ? 'View monthly bookings and manage appointments' 
                  : `Schedule for ${selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}`
                }
              </p>
            </div>
            
            {view === 'day' && (
              <Button
                onClick={() => {
                  setView('month');
                  setSelectedDate(null);
                }}
                variant="outline"
                className="border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 self-start sm:self-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span>Back to Calendar</span>
              </Button>
            )}
          </div>

          {/* Action Buttons - Month View */}
          {view === 'month' && !isMobile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Block Dates Card */}
              <Card className={`${blockingMode ? 'border-red-300 bg-red-50' : 'border-gray-200 dark:border-gray-700 hover:border-red-200 transition-colors'}`}>
                <CardContent className="p-4">
                  <Button 
                    variant={blockingMode ? "default" : "outline"}
                    className={`w-full ${blockingMode ? "bg-red-600 hover:bg-red-700" : "border-red-200 hover:bg-red-50 dark:hover:bg-red-900/30"}`}
                    onClick={() => setBlockingMode(!blockingMode)}
                    data-testid="button-toggle-blocking-mode"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    {blockingMode ? "Exit Blocking Mode" : "Block Dates"}
                  </Button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                    {blockingMode ? "Click dates to block" : "Mark unavailable days"}
                  </p>
                </CardContent>
              </Card>
                
              <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Block Dates</DialogTitle>
                    <DialogDescription>
                      Select the date range you want to block from bookings.
                    </DialogDescription>
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

              {/* Google Calendar Integration Card */}
              <Card className={`${googleCalendarStatus?.connected ? 'border-amber-300 bg-amber-50' : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 transition-colors'}`}>
                <CardContent className="p-4 space-y-2">
                  <Button 
                    onClick={() => {
                      if (googleCalendarStatus?.connected) {
                        disconnectGoogleCalendarMutation.mutate();
                      } else {
                        handleConnectGoogleCalendar();
                      }
                    }}
                    className={`w-full shadow-sm ${
                      googleCalendarStatus?.connected 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    }`}
                    data-testid="button-google-calendar"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {googleCalendarStatus?.connected ? "Connected to Google" : "Connect Google Calendar"}
                  </Button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    {googleCalendarStatus?.connected ? "Syncing with Google Calendar" : "Sync with Google Calendar"}
                  </p>
                </CardContent>
              </Card>

              {/* Calendar Settings Card */}
              <Card className="border-gray-200 dark:border-gray-700 hover:border-green-200 transition-colors">
                <CardContent className="p-4 space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Calendar Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                      <DialogHeader className="pb-2">
                        <DialogTitle className="text-lg sm:text-xl">Calendar Settings</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                          Set your weekly availability and booking preferences
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 sm:space-y-6">
                        {/* Booking Window Setting */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Booking Window</h3>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <Label className="text-sm text-gray-600 dark:text-gray-400">
                              Max days in advance:
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={maxDaysOut || ''}
                                onChange={(e) => setMaxDaysOut(parseInt(e.target.value) || 90)}
                                min="1"
                                max="365"
                                className="w-20 h-10 text-center"
                                data-testid="input-max-days-out"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {maxDaysOut ?
                              `Customers can book up to ${maxDaysOut} days ahead` :
                              'Set how far ahead customers can book'}
                          </p>
                        </div>

                        {/* Weekly Schedule Setup */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-green-600" />
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Weekly Schedule</h3>
                          </div>

                          <div className="space-y-3">
                            {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                              const dayData = weeklySchedule[dayIndex];

                              return (
                                <div
                                  key={dayIndex}
                                  className={`rounded-lg border transition-colors ${
                                    dayData.enabled
                                      ? 'bg-white dark:bg-gray-800 border-green-200'
                                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
                                  }`}
                                >
                                  {/* Day Header - Always visible */}
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                      <Switch
                                        checked={dayData.enabled}
                                        onCheckedChange={(checked) =>
                                          updateDayAvailability(dayIndex, { enabled: !!checked })
                                        }
                                      />
                                      <span className={`font-medium text-sm ${
                                        dayData.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                                      }`}>
                                        {dayName}
                                      </span>
                                    </div>

                                    {dayData.enabled ? (
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                        {generateTimeSlots(dayData.startTime, dayData.endTime, dayData.slotDuration).length} slots
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-gray-400">Closed</span>
                                    )}
                                  </div>

                                  {/* Day Details - Only when enabled */}
                                  {dayData.enabled && (
                                    <div className="px-3 pb-3 pt-0 border-t border-gray-100">
                                      <div className="grid grid-cols-2 gap-2 mt-3">
                                        {/* Start Time */}
                                        <div>
                                          <Label className="text-xs text-gray-500 mb-1 block">Start</Label>
                                          <Input
                                            type="time"
                                            value={dayData.startTime}
                                            onChange={(e) => updateDayAvailability(dayIndex, { startTime: e.target.value })}
                                            className="h-10 text-sm"
                                          />
                                        </div>

                                        {/* End Time */}
                                        <div>
                                          <Label className="text-xs text-gray-500 mb-1 block">End</Label>
                                          <Input
                                            type="time"
                                            value={dayData.endTime}
                                            onChange={(e) => updateDayAvailability(dayIndex, { endTime: e.target.value })}
                                            className="h-10 text-sm"
                                          />
                                        </div>
                                      </div>

                                      {/* Slot Duration */}
                                      <div className="mt-2">
                                        <Label className="text-xs text-gray-500 mb-1 block">Appointment Duration</Label>
                                        <Select
                                          value={dayData.slotDuration.toString()}
                                          onValueChange={(value) => updateDayAvailability(dayIndex, { slotDuration: parseInt(value) })}
                                        >
                                          <SelectTrigger className="h-10 text-sm">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="15">15 minutes</SelectItem>
                                            <SelectItem value="30">30 minutes</SelectItem>
                                            <SelectItem value="45">45 minutes</SelectItem>
                                            <SelectItem value="60">1 hour</SelectItem>
                                            <SelectItem value="90">1.5 hours</SelectItem>
                                            <SelectItem value="120">2 hours</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Save Button - Sticky at bottom on mobile */}
                        <div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-3 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 border-t sm:border-t-0">
                          <Button
                            onClick={() => saveAvailabilityMutation.mutate()}
                            disabled={saveAvailabilityMutation.isPending}
                            className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-base font-medium"
                            data-testid="button-save-schedule"
                          >
                            <Save className="w-5 h-5 mr-2" />
                            {saveAvailabilityMutation.isPending ? "Saving..." : "Save Settings"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    Manage availability schedule
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Drag Selection Action Dialog */}
        <Dialog open={dragActionDialogOpen} onOpenChange={(open) => {
          setDragActionDialogOpen(open);
          if (!open) {
            // Reset drag selection when dialog closes
            setDragStart(null);
            setCurrentHoverDate(null);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Selected Dates</DialogTitle>
              <DialogDescription>
                Choose an action for the selected date range.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {dragStart && currentHoverDate && (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">You've selected:</p>
                    <p className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                      {new Date(dragStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' '}-{' '}
                      {new Date(currentHoverDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getDateRange(dragStart, currentHoverDate).length} day{getDateRange(dragStart, currentHoverDate).length > 1 ? 's' : ''}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400">What would you like to do with these dates?</p>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-2 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400"
                      onClick={() => {
                        const [start, end] = [dragStart, currentHoverDate].sort();
                        setBlockStartDate(start);
                        setBlockEndDate(end);
                        setBlockDialogOpen(true);
                        setDragActionDialogOpen(false);
                        setDragStart(null);
                        setCurrentHoverDate(null);
                      }}
                      data-testid="button-drag-action-block"
                    >
                      <Ban className="w-6 h-6 text-red-600" />
                      <span className="text-sm font-medium">Block Dates</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-2 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400"
                      onClick={() => {
                        const [start] = [dragStart, currentHoverDate].sort();
                        openScheduleDialog(start);
                        setDragActionDialogOpen(false);
                        setDragStart(null);
                        setCurrentHoverDate(null);
                      }}
                      data-testid="button-drag-action-schedule"
                    >
                      <Calendar className="w-6 h-6 text-blue-600" />
                      <span className="text-sm font-medium">Schedule Event</span>
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setDragActionDialogOpen(false);
                      setDragStart(null);
                      setCurrentHoverDate(null);
                    }}
                    data-testid="button-drag-action-cancel"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule on {selectedDateForSchedule && new Date(selectedDateForSchedule).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Schedule Type Selector */}
              <div className="flex gap-2">
                <Button
                  variant={scheduleType === 'workorder' ? 'default' : 'outline'}
                  onClick={() => setScheduleType('workorder')}
                  className="flex-1"
                  disabled={unscheduledWorkOrders.length === 0}
                  data-testid="button-schedule-type-workorder"
                >
                  Work Order{unscheduledWorkOrders.length > 0 && ` (${unscheduledWorkOrders.length})`}
                </Button>
                <Button
                  variant={scheduleType === 'event' ? 'default' : 'outline'}
                  onClick={() => setScheduleType('event')}
                  className="flex-1"
                  data-testid="button-schedule-type-event"
                >
                  Manual Event
                </Button>
              </div>

              {scheduleType === 'workorder' ? (
                <>
                  <div className="space-y-2">
                    <Label>Select Work Order</Label>
                    <Select value={selectedWorkOrderId?.toString() || ''} onValueChange={(value) => setSelectedWorkOrderId(parseInt(value))}>
                      <SelectTrigger data-testid="select-work-order">
                        <SelectValue placeholder="Choose a work order..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unscheduledWorkOrders.map((wo: any) => (
                          <SelectItem key={wo.id} value={wo.id.toString()}>
                            #{wo.workOrderNumber} - {wo.customerName} - ${(wo.totalAmount / 100).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Event Title</Label>
                    <Input
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="e.g., Meeting, Appointment"
                      data-testid="input-event-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={eventNotes}
                      onChange={(e) => setEventNotes(e.target.value)}
                      placeholder="Additional details..."
                      data-testid="textarea-event-notes"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    data-testid="input-schedule-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Select value={scheduleDuration.toString()} onValueChange={(value) => setScheduleDuration(parseInt(value))}>
                    <SelectTrigger data-testid="select-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setScheduleDialogOpen(false)}
                  className="flex-1"
                  data-testid="button-cancel-schedule"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleScheduleSubmit}
                  disabled={scheduleWorkOrderMutation.isPending || createEventMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  data-testid="button-confirm-schedule"
                >
                  {scheduleWorkOrderMutation.isPending || createEventMutation.isPending ? 'Scheduling...' : 'Schedule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Calendar Content */}
        <AnimatePresence mode="wait">
          {view === 'month' ? (
            <motion.div
              key="month-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* Month Navigation */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => navigateMonth('prev')}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <Button
                    onClick={() => navigateMonth('next')}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

            {/* Calendar Selection */}
            {googleCalendarStatus?.connected && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-full">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Selected Calendars</p>
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          {selectedCalendars.length > 0 ? `${selectedCalendars.length} calendar(s) selected` : 'All calendars'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCalendarSelectDialogOpen(true);
                      }}
                      className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      data-testid="button-manage-calendars"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calendar Selection Dialog */}
            <Dialog open={calendarSelectDialogOpen} onOpenChange={setCalendarSelectDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Select Calendars to Sync</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose which Google Calendars you want to sync with your booking calendar.
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableCalendars.map((calendar: any) => (
                      <div
                        key={calendar.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-700/50"
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

            {/* Blocking Mode Indicator */}
            {blockingMode && (
              <Card className="border-2 border-red-500 shadow-lg bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Ban className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Blocking Mode Active</p>
                      <p className="text-sm text-red-700">Click on any date in the calendar below to block it. Click "Exit Blocking Mode" when done.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calendar Grid */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-t-lg">
                <div className="grid grid-cols-7">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="p-2 text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-r dark:border-gray-700">
                      {day}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-7">
                {renderCalendarGrid()}
              </div>
            </Card>

            {/* Blocked Dates Section - Collapsible */}
            {Array.isArray(blockedDates) && blockedDates.length > 0 && (
              <Collapsible open={blockedDatesOpen} onOpenChange={setBlockedDatesOpen}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="bg-gradient-to-r from-red-50 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 rounded-t-lg border-b dark:border-gray-700 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <Ban className="w-5 h-5" />
                            Blocked Dates ({blockedDates.length})
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Dates when you're unavailable for bookings</p>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${blockedDatesOpen ? 'transform rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {blockedDates.map((blocked: any) => (
                          <div key={blocked.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {new Date(blocked.startDate).toLocaleDateString()} - {new Date(blocked.endDate).toLocaleDateString()}
                              </div>
                              {blocked.reason && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{blocked.reason}</div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => unblockDateMutation.mutate(blocked.id)}
                              disabled={unblockDateMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                              data-testid={`button-unblock-${blocked.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}
            </motion.div>
          ) : (
            /* Daily View */
            <motion.div
              key="day-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* Daily Schedule */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-t-lg border-b dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                      <Clock className="w-5 h-5" />
                      Daily Schedule
                    </CardTitle>
                    <Button
                      onClick={() => selectedDate && openScheduleDialog(selectedDate)}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      data-testid="button-open-schedule-dialog"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                {loadingDaily ? (
                  <div className="text-center py-8 dark:text-gray-400">Loading schedule...</div>
                ) : (
                  <div className="space-y-6">
                    {/* Work Orders */}
                    {selectedDate && getWorkOrdersForDate(selectedDate).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Work Orders
                        </h3>
                        <div className="space-y-2">
                          {getWorkOrdersForDate(selectedDate).map((workOrder: any) => (
                            <div
                              key={workOrder.id}
                              className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/30"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                                    {workOrder.title}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 mb-1">
                                    <User className="w-4 h-4" />
                                    <span>{workOrder.customerName}</span>
                                  </div>
                                  {workOrder.scheduledTime && (
                                    <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                                      <Clock className="w-4 h-4" />
                                      <span>{workOrder.scheduledTime}</span>
                                    </div>
                                  )}
                                  {workOrder.customerAddress && (
                                    <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 mt-1">
                                      <MapPin className="w-4 h-4" />
                                      <span>{workOrder.customerAddress}</span>
                                    </div>
                                  )}
                                  <div className="mt-2">
                                    <Badge variant="secondary" className="bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-100">
                                      {workOrder.status || 'scheduled'}
                                    </Badge>
                                    <span className="ml-2 text-sm font-semibold text-purple-900 dark:text-purple-100">
                                      ${(workOrder.totalAmount / 100).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Google Calendar Events */}
                    {selectedDate && googleCalendarStatus?.connected && getGoogleEventsForDate(selectedDate).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Google Calendar Events
                        </h3>
                        <div className="space-y-2">
                          {getGoogleEventsForDate(selectedDate).map((event: any) => (
                            <div
                              key={event.id}
                              className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/30"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                    {event.title}
                                  </div>
                                  {!event.isAllDay && (
                                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
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
                                  {event.isAllDay && (
                                    <div className="text-sm text-blue-700 dark:text-blue-300">All Day Event</div>
                                  )}
                                  {event.location && (
                                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mt-1">
                                      <MapPin className="w-4 h-4" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                  {event.description && (
                                    <div className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                                      {event.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Autobidder Bookings */}
                    {dailyBookings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No appointments scheduled for this day.
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Bookings
                        </h3>
                        <div className="space-y-3">
                          {dailyBookings.map((slot: AvailabilitySlot) => {
                            const leadDetails = slot.bookedBy ? getLeadDetails(slot.bookedBy) : null;

                            return (
                              <div
                                key={slot.id}
                                onClick={() => {
                                  if (slot.isBooked) {
                                    setSelectedBooking(slot);
                                    setBookingDetailsOpen(true);
                                  }
                                }}
                                className={`border rounded-lg p-4 transition-all ${
                                  slot.isBooked
                                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 cursor-pointer hover:border-red-300 dark:hover:border-red-700 hover:shadow-md active:scale-[0.99]'
                                    : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Clock className="w-4 h-4" />
                                      <span className="font-medium">
                                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                      </span>
                                      <Badge variant={slot.isBooked ? "destructive" : "default"}>
                                        {slot.isBooked ? "Booked" : "Available"}
                                      </Badge>
                                    </div>

                                    {slot.isBooked && (slot.leadName || leadDetails) && (
                                      <div className="mt-2 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 text-sm">
                                            <User className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">{slot.leadName || leadDetails?.name}</span>
                                          </div>
                                          <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <span>Tap for details</span>
                                            <ChevronRight className="w-3 h-3" />
                                          </div>
                                        </div>

                                        {(slot.leadPhone || leadDetails?.phone) && (
                                          <div className="flex items-center gap-2 text-sm text-gray-500 pl-6">
                                            <Phone className="w-3 h-3 flex-shrink-0" />
                                            <span>{slot.leadPhone || leadDetails?.phone}</span>
                                          </div>
                                        )}

                                        {(slot.leadAddress || leadDetails?.address) && (
                                          <div className="flex items-center gap-2 text-sm text-gray-500 pl-6">
                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{slot.leadAddress || leadDetails?.address}</span>
                                          </div>
                                        )}

                                        {((slot.leadServices && slot.leadServices.length > 0) || (leadDetails?.services && leadDetails.services.length > 0)) && (
                                          <div className="flex items-start gap-2 text-sm text-gray-500 pl-6">
                                            <Calendar className="w-3 h-3 flex-shrink-0 mt-1" />
                                            <div className="flex flex-wrap gap-1">
                                              {(slot.leadServices || leadDetails?.services || []).map((s: any, i: number) => (
                                                <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 h-4">
                                                  {s.formulaName}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {slot.isBooked && !slot.leadName && !leadDetails && slot.title && (
                                      <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm">
                                          <Calendar className="w-4 h-4 text-gray-500" />
                                          <span className="font-medium">{slot.title}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <span>Tap for details</span>
                                          <ChevronRight className="w-3 h-3" />
                                        </div>
                                      </div>
                                    )}

                                    {!slot.isBooked && (
                                      <div className="mt-1 text-sm text-green-600">
                                        Available for booking
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking Details Dialog */}
        <Dialog open={bookingDetailsOpen} onOpenChange={setBookingDetailsOpen}>
          <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
            {selectedBooking && (() => {
              // Use embedded lead data from slot (preferred) or fall back to fetched lead details
              const leadDetails = selectedBooking.bookedBy ? getLeadDetails(selectedBooking.bookedBy) : null;
              const customerName = selectedBooking.leadName || leadDetails?.name;
              const customerEmail = selectedBooking.leadEmail || leadDetails?.email;
              const customerPhone = selectedBooking.leadPhone || leadDetails?.phone;
              const customerAddress = selectedBooking.leadAddress || leadDetails?.address;
              const customerServices = selectedBooking.leadServices || leadDetails?.services;
              const customerTotalPrice = selectedBooking.leadTotalPrice || leadDetails?.totalPrice;
              const customerStage = selectedBooking.leadStage || leadDetails?.stage;
              const hasCustomerData = customerName || customerEmail || customerPhone;

              return (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
                    <DialogHeader>
                      <DialogTitle className="text-white text-lg sm:text-xl">
                        Booking Details
                      </DialogTitle>
                      <DialogDescription className="text-blue-100">
                        {selectedBooking.date && new Date(selectedBooking.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
                      <Clock className="w-5 h-5" />
                      <span>{formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6 space-y-4">
                    {hasCustomerData ? (
                      <>
                        {/* Customer Info */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Customer</h3>
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{customerName}</p>
                                <p className="text-sm text-gray-500">Customer</p>
                              </div>
                            </div>

                            {customerEmail && (
                              <a
                                href={`mailto:${customerEmail}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Mail className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-blue-600 underline">{customerEmail}</span>
                              </a>
                            )}

                            {customerPhone && (
                              <a
                                href={`tel:${customerPhone}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Phone className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-blue-600 underline">{customerPhone}</span>
                              </a>
                            )}

                            {customerAddress && (
                              <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(customerAddress)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-blue-600 underline">{customerAddress}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Services */}
                        {customerServices && customerServices.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Services</h3>
                            <div className="space-y-2">
                              {customerServices.map((service: any, index: number) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">{service.formulaName}</span>
                                  <span className="text-sm font-semibold text-green-600">
                                    ${typeof service.calculatedPrice === 'number' ? service.calculatedPrice.toFixed(2) : service.calculatedPrice}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Total */}
                        {customerTotalPrice && (
                          <div className="border-t pt-4">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                              <span className="text-xl font-bold text-green-600">${customerTotalPrice}</span>
                            </div>
                          </div>
                        )}

                        {/* Stage */}
                        {customerStage && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Status:</span>
                            <Badge variant="secondary" className="capitalize">{customerStage}</Badge>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Manual Event (no lead) */}
                        {selectedBooking.title && (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Event</h3>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.title}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Notes */}
                    {selectedBooking.notes && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notes</h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-gray-700">{selectedBooking.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      {customerPhone && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.location.href = `tel:${customerPhone}`}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                      )}
                      {customerEmail && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.location.href = `mailto:${customerEmail}`}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Button>
                      )}
                      {customerAddress && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(customerAddress)}`, '_blank')}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Directions
                        </Button>
                      )}
                    </div>

                    {/* View Lead Button */}
                    {selectedBooking.bookedBy && (
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={() => {
                          setBookingDetailsOpen(false);
                          navigate(`/leads/${selectedBooking.bookedBy}`);
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Full Lead Details
                      </Button>
                    )}
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Mobile Daily Schedule Sheet */}
        <DailyScheduleSheet
          date={selectedDate}
          isOpen={scheduleSheetOpen}
          onOpenChange={setScheduleSheetOpen}
        />

        {/* Mobile FAB Menu */}
        {isMobile && view === 'month' && (
          <>
            {/* FAB Backdrop */}
            {fabOpen && (
              <div
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setFabOpen(false)}
              />
            )}

            {/* FAB Menu Items */}
            <AnimatePresence>
              {fabOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-24 right-6 z-50 flex flex-col gap-3"
                >
                  {/* Calendar Settings */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => {
                      setFabOpen(false);
                      setMobileSettingsOpen(true);
                    }}
                    className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full pl-4 pr-5 py-3 shadow-lg border"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-blue-600 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">Availability Settings</span>
                  </motion.button>

                  {/* Block Dates */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => {
                      setFabOpen(false);
                      setBlockingMode(!blockingMode);
                    }}
                    className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full pl-4 pr-5 py-3 shadow-lg border"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${blockingMode ? 'bg-red-600' : 'bg-red-500'}`}>
                      <Ban className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">
                      {blockingMode ? 'Exit Blocking Mode' : 'Block Dates'}
                    </span>
                  </motion.button>

                  {/* Google Calendar */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => {
                      setFabOpen(false);
                      if (googleCalendarStatus?.connected) {
                        disconnectGoogleCalendarMutation.mutate();
                      } else {
                        handleConnectGoogleCalendar();
                      }
                    }}
                    className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full pl-4 pr-5 py-3 shadow-lg border"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${googleCalendarStatus?.connected ? 'bg-amber-500' : 'bg-blue-500'}`}>
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">
                      {googleCalendarStatus?.connected ? 'Google Connected' : 'Connect Google'}
                    </span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main FAB Button */}
            <motion.button
              onClick={() => setFabOpen(!fabOpen)}
              className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
                fabOpen
                  ? 'bg-gray-600'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: fabOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {fabOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Settings className="w-6 h-6 text-white" />
                )}
              </motion.div>
            </motion.button>
          </>
        )}

        {/* Mobile Settings Sheet */}
        <Sheet open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Calendar Settings
              </SheetTitle>
              <SheetDescription>
                Set your weekly availability and booking preferences
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 pb-6">
              {/* Booking Window Setting */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Booking Window</h3>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">
                    Max days in advance:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={maxDaysOut || ''}
                      onChange={(e) => setMaxDaysOut(parseInt(e.target.value) || 90)}
                      min="1"
                      max="365"
                      className="w-20 h-10 text-center"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {maxDaysOut ?
                    `Customers can book up to ${maxDaysOut} days ahead` :
                    'Set how far ahead customers can book'}
                </p>
              </div>

              {/* Weekly Schedule */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Schedule</h3>
                </div>

                <div className="space-y-2">
                  {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                    const dayData = weeklySchedule[dayIndex];

                    return (
                      <Collapsible key={dayIndex}>
                        <div
                          className={`rounded-lg border transition-colors ${
                            dayData.enabled
                              ? 'bg-white dark:bg-gray-800 border-green-200'
                              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={dayData.enabled}
                                  onCheckedChange={(checked) => {
                                    updateDayAvailability(dayIndex, { enabled: !!checked });
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className={`font-medium text-sm ${
                                  dayData.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                                }`}>
                                  {dayName.slice(0, 3)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {dayData.enabled ? (
                                  <span className="text-xs text-green-700">
                                    {dayData.startTime} - {dayData.endTime}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Closed</span>
                                )}
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            {dayData.enabled && (
                              <div className="px-3 pb-3 pt-0 border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                  <div>
                                    <Label className="text-xs text-gray-500 mb-1 block">Start</Label>
                                    <Input
                                      type="time"
                                      value={dayData.startTime}
                                      onChange={(e) => updateDayAvailability(dayIndex, { startTime: e.target.value })}
                                      className="h-10 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-500 mb-1 block">End</Label>
                                    <Input
                                      type="time"
                                      value={dayData.endTime}
                                      onChange={(e) => updateDayAvailability(dayIndex, { endTime: e.target.value })}
                                      className="h-10 text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <Label className="text-xs text-gray-500 mb-1 block">Slot Duration</Label>
                                  <Select
                                    value={dayData.slotDuration.toString()}
                                    onValueChange={(value) => updateDayAvailability(dayIndex, { slotDuration: parseInt(value) })}
                                  >
                                    <SelectTrigger className="h-10 text-sm">
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
                              </div>
                            )}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={() => {
                  saveAvailabilityMutation.mutate();
                  setMobileSettingsOpen(false);
                }}
                disabled={saveAvailabilityMutation.isPending}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-base font-medium"
              >
                <Save className="w-5 h-5 mr-2" />
                {saveAvailabilityMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </DashboardLayout>
  );
}