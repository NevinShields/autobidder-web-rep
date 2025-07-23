import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Edit, User, CheckCircle, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AppHeader from "@/components/app-header";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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

interface SlotFormData {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
}

interface RecurringFormData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  title: string;
}

interface WeeklyAvailability {
  [key: number]: {
    enabled: boolean;
    timeSlots: {
      startTime: string;
      endTime: string;
      duration: number;
    }[];
  };
}

export default function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false);
  
  const [slotForm, setSlotForm] = useState<SlotFormData>({
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    title: "Available"
  });

  const [recurringForm, setRecurringForm] = useState<RecurringFormData>({
    dayOfWeek: 1, // Monday
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 60,
    title: "Available"
  });

  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability>({
    0: { enabled: false, timeSlots: [] }, // Sunday
    1: { enabled: false, timeSlots: [] }, // Monday
    2: { enabled: false, timeSlots: [] }, // Tuesday
    3: { enabled: false, timeSlots: [] }, // Wednesday
    4: { enabled: false, timeSlots: [] }, // Thursday
    5: { enabled: false, timeSlots: [] }, // Friday
    6: { enabled: false, timeSlots: [] }, // Saturday
  });

  // Get current month's first and last day
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Fetch availability slots for the current month
  const startDate = firstDayOfMonth.toISOString().split('T')[0];
  const endDate = lastDayOfMonth.toISOString().split('T')[0];
  
  const { data: availabilitySlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['/api/availability-slots', startDate, endDate],
  });

  // Fetch recurring availability
  const { data: recurringAvailability = [], isLoading: recurringLoading } = useQuery({
    queryKey: ['/api/recurring-availability'],
  });

  // Create availability slot mutation
  const createSlotMutation = useMutation({
    mutationFn: (data: SlotFormData) => apiRequest('/api/availability-slots', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability-slots'] });
      setIsSlotDialogOpen(false);
      toast({
        title: "Success",
        description: "Availability slot created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create recurring availability mutation
  const createRecurringMutation = useMutation({
    mutationFn: (data: RecurringFormData) => apiRequest('/api/recurring-availability', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-availability'] });
      setIsRecurringDialogOpen(false);
      toast({
        title: "Success",
        description: "Recurring schedule created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/availability-slots/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability-slots'] });
      toast({
        title: "Success",
        description: "Availability slot deleted",
      });
    },
  });

  // Delete recurring mutation
  const deleteRecurringMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/recurring-availability/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-availability'] });
      toast({
        title: "Success",
        description: "Recurring schedule deleted",
      });
    },
  });

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = clickedDate.toISOString().split('T')[0];
    setSelectedDate(dateString);
    setSlotForm({ ...slotForm, date: dateString });
  };

  const getDaySlotsCount = (day: number): number => {
    if (!availabilitySlots || !Array.isArray(availabilitySlots)) return 0;
    const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return availabilitySlots.filter((slot: any) => slot.date === dateString).length;
  };

  const getSelectedDaySlots = (): any[] => {
    if (!selectedDate || !availabilitySlots || !Array.isArray(availabilitySlots)) return [];
    return availabilitySlots.filter((slot: any) => slot.date === selectedDate);
  };

  const handleCreateSlot = () => {
    if (!slotForm.date) {
      toast({
        title: "Error",
        description: "Please select a date first",
        variant: "destructive",
      });
      return;
    }
    createSlotMutation.mutate(slotForm);
  };

  const handleCreateRecurring = () => {
    // Convert the weekly availability format to individual recurring slots
    const recurringSlots = [];
    
    Object.entries(weeklyAvailability).forEach(([dayIndex, dayData]) => {
      if (dayData.enabled && dayData.timeSlots.length > 0) {
        dayData.timeSlots.forEach(slot => {
          recurringSlots.push({
            dayOfWeek: parseInt(dayIndex),
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDuration: slot.duration,
            title: "Available"
          });
        });
      }
    });

    // Create each recurring slot
    if (recurringSlots.length > 0) {
      Promise.all(
        recurringSlots.map(slot => 
          apiRequest('/api/recurring-availability', 'POST', slot)
        )
      ).then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/recurring-availability'] });
        setIsRecurringDialogOpen(false);
        toast({
          title: "Success",
          description: `Created ${recurringSlots.length} recurring availability slots`,
        });
      }).catch((error) => {
        toast({
          title: "Error",
          description: "Failed to create recurring availability",
          variant: "destructive",
        });
      });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
            <p className="text-gray-600 mt-1">Manage your availability and appointments</p>
          </div>
          
          <Dialog open={isRecurringDialogOpen} onOpenChange={setIsRecurringDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                Set Weekly Availability
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Set Your Weekly Availability</DialogTitle>
                <p className="text-sm text-gray-600">Select which days you're available and set your time slots</p>
              </DialogHeader>
              <div className="space-y-6">
                {DAYS_OF_WEEK.map((dayName, dayIndex) => (
                  <div key={dayIndex} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Checkbox
                        checked={weeklyAvailability[dayIndex].enabled}
                        onCheckedChange={(checked) => {
                          setWeeklyAvailability(prev => ({
                            ...prev,
                            [dayIndex]: {
                              ...prev[dayIndex],
                              enabled: !!checked,
                              timeSlots: checked && prev[dayIndex].timeSlots.length === 0 
                                ? [{ startTime: "09:00", endTime: "17:00", duration: 60 }]
                                : prev[dayIndex].timeSlots
                            }
                          }));
                        }}
                      />
                      <Label className="text-base font-medium">{dayName}</Label>
                    </div>
                    
                    {weeklyAvailability[dayIndex].enabled && (
                      <div className="space-y-3 ml-6">
                        {weeklyAvailability[dayIndex].timeSlots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <div className="grid grid-cols-3 gap-3 flex-1">
                              <div>
                                <Label className="text-xs">Start Time</Label>
                                <Input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => {
                                    setWeeklyAvailability(prev => ({
                                      ...prev,
                                      [dayIndex]: {
                                        ...prev[dayIndex],
                                        timeSlots: prev[dayIndex].timeSlots.map((s, i) => 
                                          i === slotIndex ? { ...s, startTime: e.target.value } : s
                                        )
                                      }
                                    }));
                                  }}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">End Time</Label>
                                <Input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => {
                                    setWeeklyAvailability(prev => ({
                                      ...prev,
                                      [dayIndex]: {
                                        ...prev[dayIndex],
                                        timeSlots: prev[dayIndex].timeSlots.map((s, i) => 
                                          i === slotIndex ? { ...s, endTime: e.target.value } : s
                                        )
                                      }
                                    }));
                                  }}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Duration</Label>
                                <Select 
                                  value={slot.duration.toString()} 
                                  onValueChange={(value) => {
                                    setWeeklyAvailability(prev => ({
                                      ...prev,
                                      [dayIndex]: {
                                        ...prev[dayIndex],
                                        timeSlots: prev[dayIndex].timeSlots.map((s, i) => 
                                          i === slotIndex ? { ...s, duration: parseInt(value) } : s
                                        )
                                      }
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="30">30 min</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                    <SelectItem value="90">1.5 hours</SelectItem>
                                    <SelectItem value="120">2 hours</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setWeeklyAvailability(prev => ({
                                  ...prev,
                                  [dayIndex]: {
                                    ...prev[dayIndex],
                                    timeSlots: prev[dayIndex].timeSlots.filter((_, i) => i !== slotIndex)
                                  }
                                }));
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setWeeklyAvailability(prev => ({
                              ...prev,
                              [dayIndex]: {
                                ...prev[dayIndex],
                                timeSlots: [...prev[dayIndex].timeSlots, 
                                  { startTime: "09:00", endTime: "17:00", duration: 60 }
                                ]
                              }
                            }));
                          }}
                          className="ml-0"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Time Slot
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsRecurringDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateRecurring}
                    disabled={createRecurringMutation.isPending}
                    className="flex-1"
                  >
                    {createRecurringMutation.isPending ? "Saving..." : "Save Availability"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="xl:col-span-2">
            <Card className="border-2">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 border-b">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="p-3 text-center font-medium text-gray-600 border-r last:border-r-0 bg-gray-50">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.slice(0, 3)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 min-h-[400px]">
                  {calendarDays.map((day, index) => {
                    const isToday = day && 
                      new Date().toDateString() === 
                      new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    
                    const isSelected = day && selectedDate === 
                      new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
                    
                    const slotsCount = day ? getDaySlotsCount(day) : 0;
                    
                    return (
                      <div
                        key={index}
                        className={`border-r border-b last:border-r-0 p-2 h-20 cursor-pointer transition-colors ${
                          day 
                            ? isSelected 
                              ? 'bg-blue-100 hover:bg-blue-200' 
                              : isToday 
                                ? 'bg-purple-50 hover:bg-purple-100' 
                                : 'hover:bg-gray-50'
                            : 'bg-gray-25'
                        }`}
                        onClick={() => day && handleDayClick(day)}
                      >
                        {day && (
                          <>
                            <div className={`text-sm font-medium ${isToday ? 'text-purple-600' : 'text-gray-900'}`}>
                              {day}
                            </div>
                            {slotsCount > 0 && (
                              <div className="mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {slotsCount} slot{slotsCount !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Selected Date Details */}
            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Slot
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Availability Slot</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={slotForm.date}
                              onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Start Time</Label>
                              <Input
                                type="time"
                                value={slotForm.startTime}
                                onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>End Time</Label>
                              <Input
                                type="time"
                                value={slotForm.endTime}
                                onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Title</Label>
                            <Input
                              value={slotForm.title}
                              onChange={(e) => setSlotForm({ ...slotForm, title: e.target.value })}
                              placeholder="Available"
                            />
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setIsSlotDialogOpen(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCreateSlot}
                              disabled={createSlotMutation.isPending}
                              className="flex-1"
                            >
                              {createSlotMutation.isPending ? "Creating..." : "Create Slot"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getSelectedDaySlots().length === 0 ? (
                      <p className="text-gray-500 text-sm">No availability slots for this date</p>
                    ) : (
                      getSelectedDaySlots().map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{slot.title}</div>
                            <div className="text-xs text-gray-600">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </div>
                            {slot.isBooked && (
                              <Badge variant="secondary" className="mt-1">
                                Booked
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSlotMutation.mutate(slot.id)}
                            disabled={deleteSlotMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recurring Schedules */}
            <Card>
              <CardHeader>
                <CardTitle>Recurring Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recurringLoading ? (
                    <p className="text-gray-500 text-sm">Loading...</p>
                  ) : recurringAvailability.length === 0 ? (
                    <p className="text-gray-500 text-sm">No recurring schedules set</p>
                  ) : (
                    recurringAvailability.map((recurring) => (
                      <div key={recurring.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">
                            {DAYS_OF_WEEK[recurring.dayOfWeek]}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatTime(recurring.startTime)} - {formatTime(recurring.endTime)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {recurring.slotDuration}min slots
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRecurringMutation.mutate(recurring.id)}
                          disabled={deleteRecurringMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}