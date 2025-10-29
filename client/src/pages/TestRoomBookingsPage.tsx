import { TestRoomScheduler } from "@/components/test-room/TestRoomScheduler";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function TestRoomBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Calendar className="h-8 w-8" />
          Test Room Scheduling
        </h1>
        <p className="text-muted-foreground mt-1">
          Book and manage test room appointments
        </p>
      </div>

      <TestRoomScheduler />
    </div>
  );
}
