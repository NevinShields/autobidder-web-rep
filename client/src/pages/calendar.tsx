import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Settings, Save, Clock, CheckCircle, X } from "lucide-react";
import AppHeader from "@/components/app-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

interface DayAvailability {
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
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

export default function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    0: { enabled: false, startTime: "09:00", endTime: "17:00", slotDuration: 60 }, // Sunday
    1: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Monday
    2: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Tuesday
    3: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Wednesday
    4: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Thursday
    5: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },  // Friday
    6: { enabled: false, startTime: "09:00", endTime: "17:00", slotDuration: 60 }, // Saturday
  });

  // Fetch existing recurring availability
  const { data: recurringAvailability = [], isLoading: loadingRecurring } = useQuery({
    queryKey: ['/api/recurring-availability'],
    queryFn: () => fetch('/api/recurring-availability').then(res => res.json()),
  });

  // Fetch recent bookings
  const { data: recentBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['/api/availability-slots', 'recent'],
    queryFn: () => {
      const today = new Date();
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
      const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      return fetch(`/api/availability-slots/${twoWeeksAgo.toISOString().split('T')[0]}/${twoWeeksFromNow.toISOString().split('T')[0]}`)
        .then(res => res.json());
    },
  });

  // Load existing schedule on component mount
  useState(() => {
    if (recurringAvailability && Array.isArray(recurringAvailability) && recurringAvailability.length > 0) {
      const newSchedule: WeeklySchedule = { ...weeklySchedule };
      
      recurringAvailability.forEach((slot: any) => {
        newSchedule[slot.dayOfWeek] = {
          enabled: slot.isActive,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDuration: slot.slotDuration || 60,
        };
      });
      
      setWeeklySchedule(newSchedule);
    }
  });

  // Save availability mutation
  const saveAvailabilityMutation = useMutation({
    mutationFn: async () => {
      // First, clear existing recurring availability
      await apiRequest('DELETE', '/api/recurring-availability/all');
      
      // Then create new availability slots
      const promises = Object.entries(weeklySchedule)
        .filter(([_, dayData]) => dayData.enabled)
        .map(([dayIndex, dayData]) => 
          apiRequest('POST', '/api/recurring-availability', {
            dayOfWeek: parseInt(dayIndex),
            startTime: dayData.startTime,
            endTime: dayData.endTime,
            slotDuration: dayData.slotDuration,
            isActive: true,
            title: "Available"
          })
        );
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-availability'] });
      toast({
        title: "Availability Updated",
        description: "Your weekly schedule has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save availability. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateDayAvailability = (dayIndex: number, updates: Partial<DayAvailability>) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], ...updates }
    }));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
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
    return Object.values(weeklySchedule)
      .filter(day => day.enabled)
      .reduce((total, day) => {
        const start = new Date(`2024-01-01T${day.startTime}:00`);
        const end = new Date(`2024-01-01T${day.endTime}:00`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
  };

  const getEnabledDaysCount = () => {
    return Object.values(weeklySchedule).filter(day => day.enabled).length;
  };

  const getBookedSlots = () => {
    return recentBookings.filter((slot: AvailabilitySlot) => slot.isBooked).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppHeader />
      
      <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar & Availability</h1>
            <p className="text-gray-600 mt-1">Set your weekly schedule and manage appointment availability</p>
          </div>
          
          <Button
            onClick={() => saveAvailabilityMutation.mutate()}
            disabled={saveAvailabilityMutation.isPending}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveAvailabilityMutation.isPending ? "Saving..." : "Save Schedule"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Days</p>
                  <p className="text-xl font-bold text-gray-900">{getEnabledDaysCount()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Weekly Hours</p>
                  <p className="text-xl font-bold text-gray-900">{getTotalAvailableHours()}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Booked Slots</p>
                  <p className="text-xl font-bold text-gray-900">{getBookedSlots()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Settings className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getEnabledDaysCount() > 0 ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
          <CardContent className="space-y-6">
            {DAYS_OF_WEEK.map((dayName, dayIndex) => {
              const dayData = weeklySchedule[dayIndex];
              
              return (
                <div key={dayIndex} className="border rounded-lg p-4 space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={dayData.enabled}
                        onCheckedChange={(checked) => 
                          updateDayAvailability(dayIndex, { enabled: !!checked })
                        }
                      />
                      <Label className="text-base font-medium">{dayName}</Label>
                      {dayData.enabled && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {formatTime(dayData.startTime)} - {formatTime(dayData.endTime)}
                        </Badge>
                      )}
                    </div>
                    
                    {dayData.enabled && (
                      <Badge variant="outline">
                        {generateTimeSlots(dayData.startTime, dayData.endTime, dayData.slotDuration).length} slots
                      </Badge>
                    )}
                  </div>

                  {/* Time Configuration */}
                  {dayData.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                      <div>
                        <Label className="text-sm text-gray-600">Start Time</Label>
                        <Input
                          type="time"
                          value={dayData.startTime}
                          onChange={(e) => updateDayAvailability(dayIndex, { startTime: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600">End Time</Label>
                        <Input
                          type="time"
                          value={dayData.endTime}
                          onChange={(e) => updateDayAvailability(dayIndex, { endTime: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600">Appointment Duration</Label>
                        <Select
                          value={dayData.slotDuration.toString()}
                          onValueChange={(value) => updateDayAvailability(dayIndex, { slotDuration: parseInt(value) })}
                        >
                          <SelectTrigger className="mt-1">
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

                  {/* Time Slots Preview */}
                  {dayData.enabled && (
                    <div className="ml-6">
                      <Label className="text-sm text-gray-600 mb-2 block">Available Time Slots</Label>
                      <div className="flex flex-wrap gap-2">
                        {generateTimeSlots(dayData.startTime, dayData.endTime, dayData.slotDuration)
                          .slice(0, 8) // Show first 8 slots as preview
                          .map((slot, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </Badge>
                          ))}
                        {generateTimeSlots(dayData.startTime, dayData.endTime, dayData.slotDuration).length > 8 && (
                          <Badge variant="secondary" className="text-xs">
                            +{generateTimeSlots(dayData.startTime, dayData.endTime, dayData.slotDuration).length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Recent Appointments
            </CardTitle>
            <p className="text-sm text-gray-600">
              View recent bookings and upcoming appointments
            </p>
          </CardHeader>
          <CardContent>
            {loadingBookings ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No appointments found
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings
                  .filter((slot: AvailabilitySlot) => slot.isBooked)
                  .slice(0, 5)
                  .map((slot: AvailabilitySlot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(slot.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        Booked
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}