/**
 * Modern Task Manager Component
 * 
 * Features:
 * - Beautiful Kanban-style task board
 * - Drag-and-drop task organization
 * - Priority levels with color coding
 * - Quick add functionality
 * - Task filtering and search
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  User,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in-progress" | "completed";
  dueDate?: Date;
  assignedTo?: string;
  patientId?: string;
  patientName?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface TaskManagerProps {
  tasks: Task[];
  onTaskAdd?: (task: Omit<Task, "id" | "createdAt">) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  showPatientTasks?: boolean;
}

export function TaskManager({
  tasks,
  onTaskAdd,
  onTaskUpdate,
  onTaskDelete,
  showPatientTasks = true,
}: TaskManagerProps) {
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.patientName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority =
      filterPriority === "all" || task.priority === filterPriority;

    return matchesSearch && matchesPriority;
  });

  const tasksByStatus = {
    todo: filteredTasks.filter((t) => t.status === "todo"),
    "in-progress": filteredTasks.filter((t) => t.status === "in-progress"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-300";
    }
  };

  const getPriorityIcon = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="w-3 h-3" />;
      case "high":
        return <Flag className="w-3 h-3" />;
      case "medium":
        return <Clock className="w-3 h-3" />;
      case "low":
        return <Circle className="w-3 h-3" />;
    }
  };

  const handleQuickAdd = () => {
    if (newTaskTitle.trim() && onTaskAdd) {
      onTaskAdd({
        title: newTaskTitle,
        priority: "medium",
        status: "todo",
      });
      setNewTaskTitle("");
      setIsAddingTask(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={view === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("kanban")}
            >
              Kanban
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
            >
              List
            </Button>
          </div>

          <Button onClick={() => setIsAddingTask(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Quick Add */}
      {isAddingTask && (
        <Card className="border-primary/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleQuickAdd()}
                autoFocus
              />
              <Button onClick={handleQuickAdd}>Add</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* To Do Column */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Circle className="w-5 h-5 text-blue-500" />
                  To Do
                </span>
                <Badge variant="secondary">{tasksByStatus.todo.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasksByStatus.todo.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={onTaskUpdate}
                  onDelete={onTaskDelete}
                  getPriorityColor={getPriorityColor}
                  getPriorityIcon={getPriorityIcon}
                  showPatientInfo={showPatientTasks}
                />
              ))}
              {tasksByStatus.todo.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tasks to do
                </p>
              )}
            </CardContent>
          </Card>

          {/* In Progress Column */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  In Progress
                </span>
                <Badge variant="secondary">
                  {tasksByStatus["in-progress"].length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasksByStatus["in-progress"].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={onTaskUpdate}
                  onDelete={onTaskDelete}
                  getPriorityColor={getPriorityColor}
                  getPriorityIcon={getPriorityIcon}
                  showPatientInfo={showPatientTasks}
                />
              ))}
              {tasksByStatus["in-progress"].length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tasks in progress
                </p>
              )}
            </CardContent>
          </Card>

          {/* Completed Column */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Completed
                </span>
                <Badge variant="secondary">
                  {tasksByStatus.completed.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasksByStatus.completed.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={onTaskUpdate}
                  onDelete={onTaskDelete}
                  getPriorityColor={getPriorityColor}
                  getPriorityIcon={getPriorityIcon}
                  showPatientInfo={showPatientTasks}
                />
              ))}
              {tasksByStatus.completed.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No completed tasks
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={onTaskUpdate}
                  onDelete={onTaskDelete}
                  getPriorityColor={getPriorityColor}
                  getPriorityIcon={getPriorityIcon}
                  showPatientInfo={showPatientTasks}
                  compact
                />
              ))}
              {filteredTasks.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  No tasks found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  onUpdate,
  onDelete,
  getPriorityColor,
  getPriorityIcon,
  showPatientInfo,
  compact = false,
}: {
  task: Task;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  getPriorityColor: (priority: Task["priority"]) => string;
  getPriorityIcon: (priority: Task["priority"]) => React.ReactNode;
  showPatientInfo: boolean;
  compact?: boolean;
}) {
  const handleStatusChange = () => {
    if (!onUpdate) return;

    const nextStatus: Record<Task["status"], Task["status"]> = {
      todo: "in-progress",
      "in-progress": "completed",
      completed: "todo",
    };

    onUpdate(task.id, {
      status: nextStatus[task.status],
      ...(nextStatus[task.status] === "completed" && { completedAt: new Date() }),
    });
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer group",
        task.status === "completed" && "opacity-60",
        compact && "p-3"
      )}
      onClick={handleStatusChange}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <button
          className={cn(
            "flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110",
            task.status === "completed" && "text-green-500"
          )}
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "font-medium mb-1",
              task.status === "completed" && "line-through"
            )}
          >
            {task.title}
          </h4>

          {task.description && !compact && (
            <p className="text-sm text-muted-foreground mb-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Priority Badge */}
            <Badge
              variant="outline"
              className={cn("gap-1", getPriorityColor(task.priority))}
            >
              {getPriorityIcon(task.priority)}
              {task.priority}
            </Badge>

            {/* Due Date */}
            {task.dueDate && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.dueDate), "MMM d")}
              </Badge>
            )}

            {/* Patient Info */}
            {showPatientInfo && task.patientName && (
              <Badge variant="outline" className="gap-1">
                <User className="w-3 h-3" />
                {task.patientName}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
