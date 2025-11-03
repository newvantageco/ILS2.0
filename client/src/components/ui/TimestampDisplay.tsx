import { formatDistanceToNow, format } from "date-fns";
import { Clock, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface TimestampDisplayProps {
  timestamp: string | Date;
  userName?: string;
  userEmail?: string;
  action?: "created" | "updated" | "deleted" | "status_changed";
  showIcon?: boolean;
  showRelative?: boolean;
  className?: string;
}

/**
 * Display timestamp with user information and tooltips
 * Shows relative time by default with full timestamp on hover
 */
export function TimestampDisplay({
  timestamp,
  userName,
  userEmail,
  action = "updated",
  showIcon = true,
  showRelative = true,
  className = "",
}: TimestampDisplayProps) {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });
  const fullDate = format(date, "d MMM yyyy, h:mm a");
  const isoDate = date.toISOString();

  const actionLabels = {
    created: "Created",
    updated: "Updated",
    deleted: "Deleted",
    status_changed: "Status changed",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 text-sm text-muted-foreground ${className}`}>
            {showIcon && <Clock className="h-3.5 w-3.5" />}
            <time dateTime={isoDate} className="flex items-center gap-1">
              {showRelative ? relativeTime : fullDate}
              {userName && (
                <>
                  <span className="text-xs">by</span>
                  <span className="font-medium text-foreground">{userName}</span>
                </>
              )}
            </time>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1.5">
            <div className="font-semibold">{actionLabels[action]}</div>
            <div className="text-xs">{fullDate}</div>
            {userName && (
              <div className="flex items-center gap-1.5 text-xs pt-1 border-t">
                <User className="h-3 w-3" />
                <span>{userName}</span>
                {userEmail && <span className="text-muted-foreground">({userEmail})</span>}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ChangeHistoryEntry {
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: "created" | "updated" | "deleted" | "status_changed";
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
}

interface ChangeHistoryTimelineProps {
  history: ChangeHistoryEntry[];
  className?: string;
}

/**
 * Display full change history timeline with all timestamps and users
 */
export function ChangeHistoryTimeline({ history, className = "" }: ChangeHistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No change history available
      </div>
    );
  }

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const actionColors = {
    created: "bg-green-500",
    updated: "bg-blue-500",
    deleted: "bg-red-500",
    status_changed: "bg-yellow-500",
  };

  const actionLabels = {
    created: "Created",
    updated: "Updated",
    deleted: "Deleted",
    status_changed: "Status Changed",
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-semibold">Change History</h3>
      <div className="relative space-y-4">
        {/* Timeline line */}
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />

        {sortedHistory.map((entry, index) => (
          <div key={index} className="relative pl-8">
            {/* Timeline dot */}
            <div
              className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-background ${
                actionColors[entry.action]
              }`}
            />

            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {actionLabels[entry.action]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{entry.userName}</span>
                    <span className="text-xs text-muted-foreground">({entry.userEmail})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(entry.timestamp), "d MMM yyyy, h:mm:ss a")}
                  </div>
                  {entry.ipAddress && (
                    <div className="text-xs text-muted-foreground">IP: {entry.ipAddress}</div>
                  )}
                </div>
              </div>

              {/* Show what changed */}
              {entry.changes && Object.keys(entry.changes).length > 0 && (
                <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs space-y-1">
                  <div className="font-semibold">Changes:</div>
                  {Object.entries(entry.changes).map(([field, change]) => (
                    <div key={field} className="grid grid-cols-3 gap-2">
                      <span className="font-medium capitalize">{field.replace(/_/g, " ")}:</span>
                      <span className="text-red-600 line-through">
                        {JSON.stringify(change.old)}
                      </span>
                      <span className="text-green-600">→ {JSON.stringify(change.new)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AuditTimestampsProps {
  createdAt: string | Date;
  createdBy?: string;
  updatedAt?: string | Date;
  updatedBy?: string;
  className?: string;
}

/**
 * Display created and updated timestamps in a compact format
 */
export function AuditTimestamps({
  createdAt,
  createdBy,
  updatedAt,
  updatedBy,
  className = "",
}: AuditTimestampsProps) {
  return (
    <div className={`space-y-1 text-xs text-muted-foreground ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className="font-medium">Created:</span>
        <TimestampDisplay
          timestamp={createdAt}
          userName={createdBy}
          action="created"
          showIcon={false}
          showRelative={false}
        />
      </div>
      {updatedAt && (
        <div className="flex items-center gap-1.5">
          <span className="font-medium">Updated:</span>
          <TimestampDisplay
            timestamp={updatedAt}
            userName={updatedBy}
            action="updated"
            showIcon={false}
            showRelative={false}
          />
        </div>
      )}
    </div>
  );
}
