import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { History } from "lucide-react";
import { ChangeHistoryTimeline } from "./TimestampDisplay";

interface ChangeHistoryEntry {
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: "created" | "updated" | "deleted" | "status_changed";
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
}

interface ChangeHistoryDialogProps {
  title?: string;
  history?: ChangeHistoryEntry[];
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  triggerSize?: "default" | "sm" | "lg" | "icon";
}

/**
 * Dialog component showing full change history timeline
 * Can be triggered by a button or custom trigger element
 */
export function ChangeHistoryDialog({
  title = "Change History",
  history = [],
  triggerLabel = "View History",
  triggerVariant = "outline",
  triggerSize = "sm",
}: ChangeHistoryDialogProps) {
  const [open, setOpen] = useState(false);

  if (!history || history.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>
          <History className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Complete audit trail showing all changes made to this record
          </DialogDescription>
        </DialogHeader>
        <ChangeHistoryTimeline history={history} />
      </DialogContent>
    </Dialog>
  );
}
