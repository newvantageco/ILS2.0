/**
 * Complete Diary/Schedule Management Page
 * 
 * Features:
 * - Daily schedule timeline
 * - Task management with Kanban board
 * - Notes and reminders
 * - Patient follow-ups
 * - Calendar integration
 * - Quick actions
 */

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TaskManager, type Task } from "@/components/diary/TaskManager";
import { DailySchedule } from "@/components/diary/DailySchedule";
import { SmartAppointmentCard } from "@/components/diary/SmartAppointmentCard";
import {
  Calendar,
  CheckSquare,
  StickyNote,
  Bell,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  Users,
  Package,
} from "lucide-react";
import { format, isToday, isTomorrow, addDays } from "date-fns";
import { 
  useTodayAppointments,
  useAppointmentQueue,
} from "@/hooks/useIntegratedAppointments";
import { useAppointmentWebSocket } from "@/hooks/useAppointmentWebSocket";
import { AppointmentStatusBadge, NextActionBadge } from "@/components/diary/AppointmentStatusBadge";
import { AppointmentActions } from "@/components/diary/AppointmentActions";

export default function DiaryPage() {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("schedule");

  // Fetch today's integrated appointments
  const { data: appointments = [], isLoading } = useTodayAppointments(
    user?.role === 'ecp' ? user.id : undefined
  );
  
  // Fetch queue data
  const { data: checkedInQueue = [] } = useAppointmentQueue('checked_in');
  const { data: readyForDispenseQueue = [] } = useAppointmentQueue('ready_for_dispense');
  
  // WebSocket for real-time updates
  useAppointmentWebSocket({
    companyId: user?.companyId ?? undefined,
    enableToasts: true,
  });

  // Mock tasks data (replace with actual API)
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Follow up with Mrs. Johnson about new prescription",
      priority: "high",
      status: "todo",
      dueDate: new Date(),
      patientName: "Mrs. Johnson",
      createdAt: new Date(),
    },
    {
      id: "2",
      title: "Order new inventory for contact lenses",
      priority: "medium",
      status: "in-progress",
      createdAt: new Date(),
    },
    {
      id: "3",
      title: "Review quarterly sales reports",
      priority: "low",
      status: "todo",
      dueDate: addDays(new Date(), 3),
      createdAt: new Date(),
    },
  ]);

  // Transform appointments to schedule events with isRunningLate
  const scheduleEvents = appointments.map((apt) => ({
    id: apt.id,
    title: apt.title,
    startTime: new Date(apt.startTime),
    endTime: new Date(apt.endTime),
    type: "appointment" as const,
    patient: {
      name: apt.patient.name,
    },
    status: apt.realtimeStatus.currentStage,
    isRunningLate: apt.realtimeStatus.isRunningLate,
  }));
  
  // Sorted checked-in queue by wait time (longest first)
  const sortedCheckedInQueue = [...checkedInQueue].sort((a, b) => {
    const aTime = new Date(a.realtimeStatus.lastUpdate).getTime();
    const bTime = new Date(b.realtimeStatus.lastUpdate).getTime();
    return aTime - bTime; // Oldest first (waiting longest)
  });

  // Calculate statistics
  const stats = {
    todayAppointments: appointments.length,
    checkedIn: checkedInQueue.length,
    readyForDispense: readyForDispenseQueue.length,
    pendingTasks: tasks.filter((t) => t.status !== "completed").length,
    urgentTasks: tasks.filter((t) => t.priority === "urgent" && t.status !== "completed")
      .length,
    overdueTask: tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== "completed"
    ).length,
  };

  const handleTaskAdd = (task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    setTasks([...tasks, newTask]);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" />
            My Diary
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your schedule, tasks, and reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Reminders
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">Appointments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.checkedIn}</div>
            <p className="text-xs text-muted-foreground">Waiting</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readyForDispense}</div>
            <p className="text-xs text-muted-foreground">For Dispense</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">To complete</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.urgentTasks}</div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueTask}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="schedule">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="w-4 h-4 mr-2" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Schedule Tab - Split View Layout */}
        <TabsContent value="schedule" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <p className="mt-4 text-muted-foreground">Loading appointments...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left Side - Schedule (70%) */}
              <div className="lg:w-[70%] space-y-4">
                <DailySchedule
                  date={selectedDate}
                  events={scheduleEvents}
                  onDateChange={setSelectedDate}
                  onEventClick={(event) => console.log("Event clicked:", event)}
                  onTimeSlotClick={(time) => console.log("Time slot clicked:", time)}
                />
              </div>
              
              {/* Right Side - Active Queue (30%) */}
              <div className="lg:w-[30%] space-y-4">
                {/* Checked In Queue */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-yellow-500" />
                        Waiting Room
                      </CardTitle>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {checkedInQueue.length} waiting
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                    {sortedCheckedInQueue.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No patients waiting</p>
                      </div>
                    ) : (
                      sortedCheckedInQueue.map((apt) => (
                        <SmartAppointmentCard
                          key={apt.id}
                          appointment={apt}
                          userRole={user?.role || 'ecp'}
                          compact
                          showHoverDetails
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
                
                {/* Ready for Dispense Queue */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-500" />
                        Ready for Dispense
                      </CardTitle>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {readyForDispenseQueue.length} ready
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                    {readyForDispenseQueue.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No patients ready</p>
                      </div>
                    ) : (
                      readyForDispenseQueue.map((apt) => (
                        <SmartAppointmentCard
                          key={apt.id}
                          appointment={apt}
                          userRole={user?.role || 'ecp'}
                          compact
                          showHoverDetails
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <TaskManager
            tasks={tasks}
            onTaskAdd={handleTaskAdd}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            showPatientTasks={true}
          />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="w-5 h-5" />
                Notes & Reminders
              </CardTitle>
              <CardDescription>
                Quick notes and important reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notes yet</p>
                <p className="text-sm">Create your first note to get started</p>
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  New Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">
                Common tasks and shortcuts
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Schedule Appointment
              </Button>
              <Button variant="outline" size="sm">
                Add Patient Note
              </Button>
              <Button variant="outline" size="sm">
                Create Task
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
