import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Clock, Plus, Trash2, Edit, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AppHeader from "@/components/app-header";
import type { AvailabilitySlot, RecurringAvailability } from "@shared/schema";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

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

export default function CalendarPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false);
  
  const [slotForm, setSlotForm] = useState<SlotFormData>({
    date: selectedDate,
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

  // Fetch availability slots for the selected date
  const { data: availabilitySlots, isLoading: slotsLoading } = useQuery({
    queryKey: ['/api/availability-slots', selectedDate],
    queryFn: () => apiRequest(`/api/availability-slots?date=${selectedDate}`),
  });

  // Fetch recurring availability
  const { data: recurringAvailability, isLoading: recurringLoading } = useQuery({
    queryKey: ['/api/recurring-availability'],
    queryFn: () => apiRequest('/api/recurring-availability'),
  });

  // Create availability slot mutation
  const createSlotMutation = useMutation({
    mutationFn: (data: SlotFormData) => 
      fetch('/api/availability-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability-slots'] });
      setIsSlotDialogOpen(false);
      setSlotForm({
        date: selectedDate,
        startTime: "09:00",
        endTime: "10:00",
        title: "Available"
      });
      toast({
        title: "Availability slot created",
        description: "Your time slot has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create availability slot.",
        variant: "destructive",
      });
    },
  });

  // Create recurring availability mutation
  const createRecurringMutation = useMutation({
    mutationFn: (data: RecurringFormData) => 
      fetch('/api/recurring-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-availability'] });
      setIsRecurringDialogOpen(false);
      setRecurringForm({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 60,
        title: "Available"
      });
      toast({
        title: "Recurring availability created",
        description: "Your weekly schedule has been set up successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create recurring availability.",
        variant: "destructive",
      });
    },
  });

  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/availability-slots/${id}`, {
        method: 'DELETE',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability-slots'] });
      toast({
        title: "Slot deleted",
        description: "The availability slot has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete slot.",
        variant: "destructive",
      });
    },
  });

  // Delete recurring availability mutation
  const deleteRecurringMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/recurring-availability/${id}`, {
        method: 'DELETE',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-availability'] });
      toast({
        title: "Recurring schedule deleted",
        description: "The weekly schedule has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete recurring schedule.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSlot = () => {
    if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createSlotMutation.mutate(slotForm);
  };

  const handleCreateRecurring = () => {
    if (!recurringForm.startTime || !recurringForm.endTime || !recurringForm.slotDuration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createRecurringMutation.mutate(recurringForm);
  };

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar Management</h1>
          <p className="text-lg text-gray-600">
            Set your availability and manage appointment bookings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Calendar and Daily View */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Date Picker */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {getNextWeekDates().map((date) => {
                    const dateObj = new Date(date);
                    const isSelected = date === selectedDate;
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    
                    return (
                      <Button
                        key={date}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDate(date)}
                        className={`flex flex-col p-2 md:p-3 h-auto text-center ${isSelected ? 'bg-blue-600' : ''}`}
                      >
                        <span className="text-xs font-medium">{dayName}</span>
                        <span className="text-sm md:text-lg font-bold">{dayNum}</span>
                      </Button>
                    );
                  })}
                </div>
                <div className="mt-4">
                  <Label htmlFor="custom-date">Or pick a custom date:</Label>
                  <Input
                    id="custom-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-1 w-auto"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Daily Schedule */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Schedule for {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
                <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Time Slot
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Availability Slot</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="slot-date">Date</Label>
                        <Input
                          id="slot-date"
                          type="date"
                          value={slotForm.date}
                          onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-time">Start Time</Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={slotForm.startTime}
                            onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-time">End Time</Label>
                          <Input
                            id="end-time"
                            type="time"
                            value={slotForm.endTime}
                            onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="slot-title">Title</Label>
                        <Input
                          id="slot-title"
                          value={slotForm.title}
                          onChange={(e) => setSlotForm({ ...slotForm, title: e.target.value })}
                          placeholder="Available"
                        />
                      </div>
                      <Button 
                        onClick={handleCreateSlot} 
                        className="w-full"
                        disabled={createSlotMutation.isPending}
                      >
                        {createSlotMutation.isPending ? "Creating..." : "Create Slot"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {slotsLoading ? (
                  <div className="text-center py-8">Loading slots...</div>
                ) : availabilitySlots && Array.isArray(availabilitySlots) && availabilitySlots.length > 0 ? (
                  <div className="space-y-2">
                    {(availabilitySlots as AvailabilitySlot[])
                      .sort((a: AvailabilitySlot, b: AvailabilitySlot) => a.startTime.localeCompare(b.startTime))
                      .map((slot: AvailabilitySlot) => (
                        <div 
                          key={slot.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            slot.isBooked 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              slot.isBooked ? 'bg-red-500' : 'bg-green-500'
                            }`} />
                            <div>
                              <div className="font-medium">
                                {slot.startTime} - {slot.endTime}
                              </div>
                              <div className="text-sm text-gray-600">{slot.title}</div>
                              {slot.isBooked && (
                                <Badge variant="secondary" className="mt-1">
                                  <User className="w-3 h-3 mr-1" />
                                  Booked
                                </Badge>
                              )}
                            </div>
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
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No availability slots for this date. Click "Add Time Slot" to create one.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recurring Availability */}
          <div className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Weekly Schedule</CardTitle>
                <Dialog open={isRecurringDialogOpen} onOpenChange={setIsRecurringDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Weekly Schedule</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="day-of-week">Day of Week</Label>
                        <Select 
                          value={recurringForm.dayOfWeek.toString()} 
                          onValueChange={(value) => setRecurringForm({ ...recurringForm, dayOfWeek: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="recurring-start">Start Time</Label>
                          <Input
                            id="recurring-start"
                            type="time"
                            value={recurringForm.startTime}
                            onChange={(e) => setRecurringForm({ ...recurringForm, startTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="recurring-end">End Time</Label>
                          <Input
                            id="recurring-end"
                            type="time"
                            value={recurringForm.endTime}
                            onChange={(e) => setRecurringForm({ ...recurringForm, endTime: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="slot-duration">Slot Duration (minutes)</Label>
                        <Select 
                          value={recurringForm.slotDuration.toString()} 
                          onValueChange={(value) => setRecurringForm({ ...recurringForm, slotDuration: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="recurring-title">Title</Label>
                        <Input
                          id="recurring-title"
                          value={recurringForm.title}
                          onChange={(e) => setRecurringForm({ ...recurringForm, title: e.target.value })}
                          placeholder="Available"
                        />
                      </div>
                      <Button 
                        onClick={handleCreateRecurring} 
                        className="w-full"
                        disabled={createRecurringMutation.isPending}
                      >
                        {createRecurringMutation.isPending ? "Creating..." : "Create Schedule"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {recurringLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : recurringAvailability && Array.isArray(recurringAvailability) && recurringAvailability.length > 0 ? (
                  <div className="space-y-2">
                    {(recurringAvailability as RecurringAvailability[])
                      .sort((a: RecurringAvailability, b: RecurringAvailability) => a.dayOfWeek - b.dayOfWeek)
                      .map((recurring: RecurringAvailability) => (
                        <div key={recurring.id} className="flex items-center justify-between p-3 rounded-lg border bg-blue-50 border-blue-200">
                          <div>
                            <div className="font-medium">
                              {DAYS_OF_WEEK[recurring.dayOfWeek]}
                            </div>
                            <div className="text-sm text-gray-600">
                              {recurring.startTime} - {recurring.endTime}
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
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No weekly schedules set up. Click "Add Schedule" to create one.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• <strong>Time Slots:</strong> Create individual slots for specific dates</p>
                <p>• <strong>Weekly Schedule:</strong> Set recurring availability that repeats each week</p>
                <p>• <strong>Booking:</strong> Customers can book available slots when requesting quotes</p>
                <p>• <strong>Status:</strong> Green = Available, Red = Booked</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}