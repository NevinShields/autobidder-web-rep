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
  
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    0: { enabled: false, startTime: "09:00", endTime: "17:00", slotDuration: 60 }, // Sunday
    1: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Monday
    2: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Tuesday
    3: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Wednesday
    4: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Thursday
    5: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Friday
    6: { enabled: false, startTime: "09:00", endTime: "17:00", slotDuration: 60 }, // Saturday
  });

  // Fetch existing availability settings
  const { data: existingSettings } = useQuery({
    queryKey: ['/api/recurring-availability'],
    queryFn: () => fetch('/api/recurring-availability').then(res => res.json()),
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

  // Google Calendar integration
  const { data: googleCalendarStatus } = useQuery({
    queryKey: ['/api/google-calendar/status'],
    queryFn: () => fetch('/api/google-calendar/status').then(res => res.json()),
  });

  const handleConnectGoogleCalendar = () => {
    window.location.href = '/api/google-calendar/connect';
  };

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

  // Save availability mutation
  const saveAvailabilityMutation = useMutation({
    mutationFn: () => 
      apiRequest('POST', '/api/recurring-availability/save-schedule', { schedule: weeklySchedule }),
    onSuccess: () => {
      toast({
        title: "Schedule saved",
        description: "Your weekly availability has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-availability'] });
    },
    onError: (error: any) => {
      console.error("Save schedule error:", error);
      toast({
        title: "Error",
        description: "Failed to save your schedule. Please try again.",
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

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateForAPI(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      const dayBookings = getBookingsForDate(dateStr);
      const bookedCount = dayBookings.filter((b: any) => b.isBooked).length;
      const availableCount = dayBookings.filter((b: any) => !b.isBooked).length;
      const blocked = isDateBlocked(dateStr);
      
      days.push(
        <div
          key={day}
          className={`h-16 sm:h-20 lg:h-24 border p-1 cursor-pointer transition-all active:scale-95 ${
            blocked 
              ? 'bg-gray-200 border-gray-400 hover:bg-gray-300' 
              : blockingMode
                ? 'border-red-300 hover:bg-red-50 hover:border-red-500 hover:shadow-md'
                : 'border-gray-200 hover:bg-blue-50'
          }`}
          onClick={() => handleDateClick(day)}
        >
          <div className="font-medium text-sm mb-1 flex items-center justify-between">
            <span>{day}</span>
            {blocked && (
              <Ban className="w-3 h-3 text-gray-600" />
            )}
          </div>
          <div className="space-y-1">
            {blocked ? (
              <>
                <div className="text-xs bg-gray-400 text-white px-1 py-0.5 rounded truncate">
                  Blocked
                </div>
                {blocked.reason && (
                  <div className="text-xs text-gray-600 truncate">
                    {blocked.reason}
                  </div>
                )}
              </>
            ) : (
              <>
                {bookedCount > 0 && (
                  <div className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded truncate">
                    {bookedCount} booked
                  </div>
                )}
                {availableCount > 0 && (
                  <div className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded truncate">
                    {availableCount} available
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Mobile-First Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              {view === 'month' ? 'Calendar & Bookings' : 'Daily Schedule'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {view === 'month' 
                ? 'View monthly bookings and manage appointments' 
                : `Schedule for ${selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}`
              }
            </p>
          </div>
          
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
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveAvailabilityMutation.isPending ? "Saving..." : "Save Schedule"}
                  </Button>
                  
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
                            <div className="flex items-center justify-between sm:justify-start sm:w-40">
                              <Label className="text-sm font-medium text-gray-700">{dayName}</Label>
                              <Switch
                                checked={dayData.enabled}
                                onCheckedChange={(checked) => 
                                  updateDayAvailability(dayIndex, { enabled: !!checked })
                                }
                              />
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
        </div>

        {/* Calendar Content */}
        {view === 'month' ? (
          <div className="space-y-6">
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
                <h2 className="text-2xl font-bold text-gray-900">
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Active Days</p>
                      <p className="text-xl font-bold text-blue-900">{getEnabledDaysCount()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-full">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700">Weekly Hours</p>
                      <p className="text-xl font-bold text-green-900">{getTotalAvailableHours()}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-full">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Booked This Month</p>
                      <p className="text-xl font-bold text-purple-900">{getBookedSlots()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer ${
                  googleCalendarStatus?.connected 
                    ? 'bg-gradient-to-br from-amber-50 to-amber-100' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100'
                }`}
                onClick={() => {
                  if (googleCalendarStatus?.connected) {
                    disconnectGoogleCalendarMutation.mutate();
                  } else {
                    handleConnectGoogleCalendar();
                  }
                }}
                data-testid="card-google-calendar"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      googleCalendarStatus?.connected ? 'bg-amber-500' : 'bg-gray-500'
                    }`}>
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        googleCalendarStatus?.connected ? 'text-green-700' : 'text-gray-700'
                      }`}>
                        Google Calendar
                      </p>
                      <p className={`text-sm font-bold ${
                        googleCalendarStatus?.connected ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {googleCalendarStatus?.connected ? "Connected" : "Not Connected"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Blocking Mode Indicator */}
            {blockingMode && (
              <Card className="border-2 border-red-500 shadow-lg bg-gradient-to-r from-red-50 to-orange-50">
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

            {/* Blocked Dates Section */}
            {Array.isArray(blockedDates) && blockedDates.length > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-100 rounded-t-lg border-b">
                  <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                    <Ban className="w-5 h-5" />
                    Blocked Dates
                  </CardTitle>
                  <p className="text-sm text-gray-600">Dates when you're unavailable for bookings</p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {blockedDates.map((blocked: any) => (
                      <div key={blocked.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {new Date(blocked.startDate).toLocaleDateString()} - {new Date(blocked.endDate).toLocaleDateString()}
                          </div>
                          {blocked.reason && (
                            <div className="text-sm text-gray-600 mt-1">{blocked.reason}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unblockDateMutation.mutate(blocked.id)}
                          disabled={unblockDateMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-unblock-${blocked.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calendar Grid */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
                <CardTitle className="text-xl text-gray-800">Calendar View</CardTitle>
                <p className="text-sm text-gray-600">Click on any day to view detailed schedule</p>
              </CardHeader>
              <CardContent>
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-0 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center font-medium text-gray-700 bg-gray-50 border border-gray-200">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-0">
                  {renderCalendarGrid()}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Daily View */
          <div className="space-y-6">
            {/* Daily Schedule */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Clock className="w-5 h-5" />
                  Daily Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDaily ? (
                  <div className="text-center py-8">Loading schedule...</div>
                ) : dailyBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No appointments scheduled for this day.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dailyBookings.map((slot: AvailabilitySlot) => {
                      const leadDetails = slot.bookedBy ? getLeadDetails(slot.bookedBy) : null;
                      
                      return (
                        <div
                          key={slot.id}
                          className={`border rounded-lg p-4 ${
                            slot.isBooked 
                              ? 'border-red-200 bg-red-50' 
                              : 'border-green-200 bg-green-50'
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
                              
                              {slot.isBooked && leadDetails && (
                                <div className="mt-3 space-y-2 pl-6">
                                  <div className="flex items-center gap-2 text-sm">
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
                                <div className="mt-2 text-sm text-gray-600 pl-6">
                                  <strong>Notes:</strong> {slot.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}