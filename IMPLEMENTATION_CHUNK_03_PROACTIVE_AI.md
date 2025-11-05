# Implementation Chunk 3: Proactive AI Insights
## Morning Briefings - AI That Thinks Ahead

**Estimated Time:** 6-8 hours  
**Complexity:** Medium-High  
**Impact:** GAME-CHANGING - AI becomes a business partner

---

## Problem Statement

Right now, users must **ask** the AI questions. But the real power is when AI tells you things **before** you ask:

- "Good morning! You have 42 patients due for recall."
- "Your Ray-Ban frames are selling 3x faster than normal."
- "Your Oakley stock hasn't moved in 60 days."

This chunk makes your AI **proactive**.

---

## Architecture Overview

```
Cron Job (Daily at 8 AM)
    ↓
ProactiveInsightsService.generateDailyBriefing()
    ↓
Analyze: Orders, Revenue, Inventory, Patients
    ↓
Generate Insights with AI
    ↓
Save to notifications table
    ↓
User logs in → Sees notification bell
```

---

## Implementation Steps

### Step 1: Create Proactive Insights Service

**File:** `server/services/ProactiveInsightsService.ts` (NEW)

```typescript
import { db } from "../../db";
import { notifications, companies } from "@shared/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { AIDataAccess } from "./AIDataAccess";
import { ExternalAIService } from "./ExternalAIService";
import { createLogger } from "../utils/logger";
import cron from "node-cron";

const logger = createLogger("ProactiveInsightsService");

export interface DailyInsight {
  category: "revenue" | "inventory" | "patients" | "orders" | "clinical";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  actionRequired: boolean;
  data?: any;
}

export class ProactiveInsightsService {
  private externalAI: ExternalAIService;

  constructor() {
    this.externalAI = new ExternalAIService();
  }

  /**
   * Start the cron job for daily insights
   */
  startDailyInsightsCron(): void {
    // Run every day at 8:00 AM
    cron.schedule("0 8 * * *", async () => {
      logger.info("Starting daily insights generation");
      await this.generateAllCompanyInsights();
    });

    logger.info("Daily insights cron job started (8:00 AM daily)");
  }

  /**
   * Generate insights for all active companies
   */
  private async generateAllCompanyInsights(): Promise<void> {
    try {
      const activeCompanies = await db
        .select({ id: companies.id, name: companies.name })
        .from(companies)
        .where(eq(companies.status, "active"));

      logger.info(`Generating insights for ${activeCompanies.length} companies`);

      for (const company of activeCompanies) {
        try {
          await this.generateDailyBriefing(company.id);
        } catch (error) {
          logger.error(`Failed to generate insights for company ${company.id}`, error as Error);
        }
      }
    } catch (error) {
      logger.error("Error in generateAllCompanyInsights", error as Error);
    }
  }

  /**
   * Generate daily briefing for a specific company
   */
  async generateDailyBriefing(companyId: string): Promise<void> {
    try {
      logger.info("Generating daily briefing", { companyId });

      const context = {
        companyId,
        userId: "system", // System-generated insights
      };

      // Gather all data in parallel
      const [
        revenueData,
        orderStats,
        lowStock,
        patientStats,
      ] = await Promise.all([
        AIDataAccess.getRevenueData({
          ...context,
          timeframe: {
            start: this.getYesterday(),
            end: new Date(),
          },
        }),
        AIDataAccess.getOrderStats({
          ...context,
          timeframe: {
            start: this.getLastWeek(),
            end: new Date(),
          },
        }),
        AIDataAccess.getLowStockItems(context, 10),
        AIDataAccess.getPatientStats(context),
      ]);

      // Analyze data and generate insights
      const insights: DailyInsight[] = [];

      // Patient Recall Insight
      if (patientStats.needingRecall > 0) {
        insights.push({
          category: "patients",
          priority: patientStats.needingRecall > 20 ? "high" : "medium",
          title: "Patient Recall Needed",
          message: `You have ${patientStats.needingRecall} patients due for their eye examination. Consider sending recall reminders to maintain regular care schedules.`,
          actionRequired: true,
          data: { count: patientStats.needingRecall },
        });
      }

      // Low Stock Alert
      if (lowStock.length > 0) {
        insights.push({
          category: "inventory",
          priority: lowStock.length > 5 ? "high" : "medium",
          title: "Low Stock Alert",
          message: `${lowStock.length} products are running low. Top items: ${lowStock.slice(0, 3).map(i => i.name).join(", ")}`,
          actionRequired: true,
          data: { items: lowStock },
        });
      }

      // Revenue Insight
      if (revenueData.totalRevenue > 0) {
        const avgDailyRevenue = revenueData.totalRevenue / 7;
        insights.push({
          category: "revenue",
          priority: "low",
          title: "Weekly Revenue Summary",
          message: `This week you generated $${revenueData.totalRevenue.toFixed(2)} from ${revenueData.invoiceCount} sales. Average daily revenue: $${avgDailyRevenue.toFixed(2)}`,
          actionRequired: false,
          data: revenueData,
        });
      }

      // Order Backlog Insight
      const pendingCount = orderStats.byStatus.pending || 0;
      if (pendingCount > 10) {
        insights.push({
          category: "orders",
          priority: "high",
          title: "Order Backlog",
          message: `You have ${pendingCount} pending orders that need attention. Consider prioritizing order processing to maintain customer satisfaction.`,
          actionRequired: true,
          data: { pendingCount },
        });
      }

      // Generate AI-enhanced summary
      const briefingSummary = await this.generateAIBriefing(insights);

      // Save notification
      await this.saveInsightNotification(companyId, briefingSummary, insights);

      logger.info(`Daily briefing generated for company ${companyId}`, {
        insightCount: insights.length,
      });
    } catch (error) {
      logger.error("Error generating daily briefing", error as Error);
      throw error;
    }
  }

  /**
   * Use AI to create a natural language briefing
   */
  private async generateAIBriefing(insights: DailyInsight[]): Promise<string> {
    if (insights.length === 0) {
      return "Good morning! Everything looks good. No urgent items require your attention today.";
    }

    const prompt = `Generate a concise, professional morning briefing for an optical practice owner based on these insights:

${insights.map((insight, i) => 
  `${i + 1}. [${insight.priority.toUpperCase()}] ${insight.title}: ${insight.message}`
).join('\n')}

Requirements:
- Start with a greeting
- Prioritize high-priority items first
- Be actionable and specific
- Keep it under 150 words
- End with a positive note`;

    try {
      const response = await this.externalAI.generateResponse(
        [
          {
            role: 'system',
            content: 'You are a helpful business intelligence assistant for optical practices.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          maxTokens: 300,
          temperature: 0.7,
        }
      );

      return response.content;
    } catch (error) {
      logger.error("Error generating AI briefing", error as Error);
      // Fallback to simple summary
      return this.generateSimpleBriefing(insights);
    }
  }

  /**
   * Fallback: Simple briefing without AI
   */
  private generateSimpleBriefing(insights: DailyInsight[]): string {
    const highPriority = insights.filter(i => i.priority === "high");
    
    let briefing = "Good morning! Here's your daily practice briefing:\n\n";

    if (highPriority.length > 0) {
      briefing += "⚠️ URGENT ITEMS:\n";
      highPriority.forEach(insight => {
        briefing += `• ${insight.title}: ${insight.message}\n`;
      });
      briefing += "\n";
    }

    const otherInsights = insights.filter(i => i.priority !== "high");
    if (otherInsights.length > 0) {
      briefing += "📊 UPDATES:\n";
      otherInsights.forEach(insight => {
        briefing += `• ${insight.title}: ${insight.message}\n`;
      });
    }

    return briefing;
  }

  /**
   * Save insight as notification
   */
  private async saveInsightNotification(
    companyId: string,
    briefing: string,
    insights: DailyInsight[]
  ): Promise<void> {
    try {
      await db.insert(notifications).values({
        companyId,
        userId: null, // Company-wide notification
        type: "insight",
        title: "Daily Practice Briefing",
        message: briefing,
        priority: insights.some(i => i.priority === "high") ? "high" : "medium",
        isRead: false,
        metadata: { insights },
      });
    } catch (error) {
      logger.error("Error saving notification", error as Error);
    }
  }

  /**
   * Get insights on demand
   */
  async getRealtimeInsights(companyId: string, userId: string): Promise<DailyInsight[]> {
    const context = { companyId, userId };
    const insights: DailyInsight[] = [];

    // Quick checks for immediate insights
    const lowStock = await AIDataAccess.getLowStockItems(context, 5);
    if (lowStock.length > 0) {
      insights.push({
        category: "inventory",
        priority: "high",
        title: "Critical Stock Alert",
        message: `${lowStock.length} products are critically low: ${lowStock.map(i => i.name).join(", ")}`,
        actionRequired: true,
        data: { items: lowStock },
      });
    }

    return insights;
  }

  // Helper methods
  private getYesterday(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private getLastWeek(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
```

---

### Step 2: Initialize Proactive Insights in Server

**File:** `server/index.ts`

Add after other service initializations:

```typescript
import { ProactiveInsightsService } from "./services/ProactiveInsightsService";

// After app.listen()
const proactiveInsights = new ProactiveInsightsService();
proactiveInsights.startDailyInsightsCron();

console.log("✅ Proactive insights cron job started");
```

---

### Step 3: Create Notifications Schema (if not exists)

**File:** `shared/schema.ts`

Add this table if it doesn't exist:

```typescript
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id), // null = company-wide
  type: varchar("type").notNull(), // 'insight', 'alert', 'reminder', 'system'
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: varchar("priority").notNull().default("medium"), // 'high', 'medium', 'low'
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_company").on(table.companyId),
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_unread").on(table.isRead),
]);
```

---

### Step 4: Create Notification Bell UI Component

**File:** `client/src/components/notifications/NotificationBell.tsx` (NEW)

```typescript
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Poll every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">No notifications</p>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    {notification.priority === 'high' && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Step 5: Add Notification Routes

**File:** `server/routes.ts`

Add these routes:

```typescript
// Get user notifications
app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user || !user.companyId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const notifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.companyId, user.companyId),
          or(
            eq(notifications.userId, userId),
            isNull(notifications.userId) // Company-wide notifications
          )
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { id } = req.params;

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
});
```

---

## Testing

### Manual Test (Immediate Insights)

Add a test route:

```typescript
app.post('/api/test/generate-briefing', isAuthenticated, async (req: any, res) => {
  const user = await storage.getUser(req.user.claims.sub);
  if (!user?.companyId) {
    return res.status(403).json({ message: "Access denied" });
  }

  const service = new ProactiveInsightsService();
  await service.generateDailyBriefing(user.companyId);
  
  res.json({ message: "Briefing generated! Check your notifications." });
});
```

Then test: `POST /api/test/generate-briefing`

---

## What You Get

✅ **Daily Morning Briefings** at 8 AM  
✅ **Smart Insights** (patient recalls, low stock, revenue trends)  
✅ **Priority Alerts** for urgent items  
✅ **Notification Bell** with unread count  
✅ **AI-Enhanced** natural language summaries

---

**Status:** Ready to implement  
**Dependencies:** Chunk 1 & 2  
**Next:** Chunk 4 - Autonomous AI (Prescriptive Actions)
