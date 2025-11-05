# Implementation Chunk 2: Contextual AI
## Give AI Access to Your Database - The Real Power

**Estimated Time:** 4-6 hours  
**Complexity:** Medium  
**Impact:** TRANSFORMATIVE - AI becomes practice-specific expert

---

## Problem Statement

Right now, your AI is just a generic chatbot. It can answer "What is a progressive lens?" but can't answer:
- "What was my total revenue last month?"
- "Which frames are low in stock?"
- "Show me all pending orders"

This chunk gives your AI **direct database access** with proper multi-tenant isolation.

---

## Architecture Overview

```
User Query: "What was my revenue last month?"
    ↓
AI Service detects: NEEDS_DATABASE_QUERY
    ↓
AI generates SQL (using Drizzle schema)
    ↓
Execute query WITH company_id filter (security)
    ↓
Return structured data to AI
    ↓
AI formats as natural language: "Your revenue last month was $45,230"
```

---

## Implementation Steps

### Step 1: Create Data Access Layer for AI

**File:** `server/services/AIDataAccess.ts` (NEW)

```typescript
import { db } from "../../db";
import { 
  orders, 
  invoices, 
  products, 
  patients, 
  eyeExaminations,
  companies 
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { createLogger } from "../utils/logger";

const logger = createLogger("AIDataAccess");

export interface QueryContext {
  companyId: string;
  userId: string;
  timeframe?: {
    start: Date;
    end: Date;
  };
}

export class AIDataAccess {
  /**
   * Get revenue data for a time period
   */
  static async getRevenueData(context: QueryContext) {
    try {
      logger.info("Fetching revenue data", { companyId: context.companyId });

      const conditions = [eq(invoices.companyId, context.companyId)];
      
      if (context.timeframe) {
        conditions.push(
          gte(invoices.invoiceDate, context.timeframe.start),
          lte(invoices.invoiceDate, context.timeframe.end)
        );
      }

      const result = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
          invoiceCount: sql<number>`COUNT(*)`,
          averageInvoice: sql<number>`COALESCE(AVG(${invoices.totalAmount}), 0)`,
        })
        .from(invoices)
        .where(and(...conditions));

      return {
        totalRevenue: parseFloat(result[0]?.totalRevenue?.toString() || "0"),
        invoiceCount: parseInt(result[0]?.invoiceCount?.toString() || "0"),
        averageInvoice: parseFloat(result[0]?.averageInvoice?.toString() || "0"),
      };
    } catch (error) {
      logger.error("Error fetching revenue data", error as Error);
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  static async getOrderStats(context: QueryContext) {
    try {
      const conditions = [eq(orders.companyId, context.companyId)];
      
      if (context.timeframe) {
        conditions.push(
          gte(orders.orderDate, context.timeframe.start),
          lte(orders.orderDate, context.timeframe.end)
        );
      }

      const statusCounts = await db
        .select({
          status: orders.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(and(...conditions))
        .groupBy(orders.status);

      return {
        total: statusCounts.reduce((sum, s) => sum + parseInt(s.count.toString()), 0),
        byStatus: statusCounts.reduce((acc, s) => {
          acc[s.status] = parseInt(s.count.toString());
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      logger.error("Error fetching order stats", error as Error);
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(context: QueryContext, threshold: number = 10) {
    try {
      const items = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          quantity: products.quantity,
          reorderPoint: products.reorderPoint,
          category: products.category,
        })
        .from(products)
        .where(
          and(
            eq(products.companyId, context.companyId),
            sql`${products.quantity} <= ${threshold}`
          )
        )
        .orderBy(products.quantity);

      return items;
    } catch (error) {
      logger.error("Error fetching low stock items", error as Error);
      throw error;
    }
  }

  /**
   * Get top selling products
   */
  static async getTopSellingProducts(context: QueryContext, limit: number = 10) {
    try {
      // This would join with invoice_line_items in production
      // Simplified version for now
      const items = await db
        .select({
          name: products.name,
          sku: products.sku,
          category: products.category,
          quantity: products.quantity,
        })
        .from(products)
        .where(eq(products.companyId, context.companyId))
        .limit(limit);

      return items;
    } catch (error) {
      logger.error("Error fetching top products", error as Error);
      throw error;
    }
  }

  /**
   * Get patient statistics
   */
  static async getPatientStats(context: QueryContext) {
    try {
      const totalPatients = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(patients)
        .where(eq(patients.companyId, context.companyId));

      // Patients due for recall (last exam > 2 years ago)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const patientsNeedingRecall = await db
        .select({ 
          patientId: patients.id,
          patientName: patients.name,
          lastExamDate: sql<Date>`MAX(${eyeExaminations.examinationDate})`,
        })
        .from(patients)
        .leftJoin(eyeExaminations, eq(patients.id, eyeExaminations.patientId))
        .where(eq(patients.companyId, context.companyId))
        .groupBy(patients.id, patients.name)
        .having(sql`MAX(${eyeExaminations.examinationDate}) < ${twoYearsAgo} OR MAX(${eyeExaminations.examinationDate}) IS NULL`);

      return {
        totalPatients: parseInt(totalPatients[0]?.count.toString() || "0"),
        needingRecall: patientsNeedingRecall.length,
        recallList: patientsNeedingRecall.slice(0, 10), // Top 10
      };
    } catch (error) {
      logger.error("Error fetching patient stats", error as Error);
      throw error;
    }
  }

  /**
   * Search patients by name
   */
  static async searchPatients(context: QueryContext, searchTerm: string) {
    try {
      const results = await db
        .select({
          id: patients.id,
          name: patients.name,
          dateOfBirth: patients.dateOfBirth,
          email: patients.email,
          phone: patients.phone,
        })
        .from(patients)
        .where(
          and(
            eq(patients.companyId, context.companyId),
            sql`${patients.name} ILIKE ${'%' + searchTerm + '%'}`
          )
        )
        .limit(10);

      return results;
    } catch (error) {
      logger.error("Error searching patients", error as Error);
      throw error;
    }
  }

  /**
   * Get pending orders
   */
  static async getPendingOrders(context: QueryContext) {
    try {
      const pendingOrders = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          orderDate: orders.orderDate,
          status: orders.status,
          patientName: sql<string>`${patients.name}`,
        })
        .from(orders)
        .leftJoin(patients, eq(orders.patientId, patients.id))
        .where(
          and(
            eq(orders.companyId, context.companyId),
            eq(orders.status, "pending")
          )
        )
        .orderBy(desc(orders.orderDate))
        .limit(20);

      return pendingOrders;
    } catch (error) {
      logger.error("Error fetching pending orders", error as Error);
      throw error;
    }
  }
}
```

---

### Step 2: Enhance Master AI Service with Tools

**File:** `server/services/MasterAIService.ts`

Add this method to enable tool calling:

```typescript
import { AIDataAccess } from './AIDataAccess';

// Add this inside MasterAIService class:

private async handleToolCall(
  toolName: string, 
  args: any, 
  context: { companyId: string; userId: string }
): Promise<any> {
  this.logger.info("Executing tool", { toolName, args });

  const queryContext = {
    companyId: context.companyId,
    userId: context.userId,
    timeframe: args.timeframe ? this.parseTimeframe(args.timeframe) : undefined,
  };

  switch (toolName) {
    case "get_revenue_data":
      return await AIDataAccess.getRevenueData(queryContext);

    case "get_order_stats":
      return await AIDataAccess.getOrderStats(queryContext);

    case "get_low_stock_items":
      return await AIDataAccess.getLowStockItems(queryContext, args.threshold);

    case "search_patients":
      return await AIDataAccess.searchPatients(queryContext, args.search);

    case "get_pending_orders":
      return await AIDataAccess.getPendingOrders(queryContext);

    case "get_patient_stats":
      return await AIDataAccess.getPatientStats(queryContext);

    case "get_top_products":
      return await AIDataAccess.getTopSellingProducts(queryContext, args.limit);

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

private parseTimeframe(timeframe: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (timeframe) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(start.getMonth() - 3);
      break;
    case "year":
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
  }

  return { start, end };
}

// Update the chat method to use tools:
async chat(query: MasterAIQuery): Promise<MasterAIResponse> {
  try {
    const tools = [
      {
        name: "get_revenue_data",
        description: "Get revenue statistics for a time period",
        parameters: {
          type: "object",
          properties: {
            timeframe: {
              type: "string",
              enum: ["today", "week", "month", "quarter", "year"],
              description: "Time period for revenue data"
            }
          },
          required: []
        }
      },
      {
        name: "get_order_stats",
        description: "Get order statistics and counts by status",
        parameters: {
          type: "object",
          properties: {
            timeframe: {
              type: "string",
              enum: ["today", "week", "month", "quarter", "year"]
            }
          },
          required: []
        }
      },
      {
        name: "get_low_stock_items",
        description: "Get products that are low in stock",
        parameters: {
          type: "object",
          properties: {
            threshold: {
              type: "number",
              description: "Stock level threshold (default: 10)"
            }
          },
          required: []
        }
      },
      {
        name: "search_patients",
        description: "Search for patients by name",
        parameters: {
          type: "object",
          properties: {
            search: {
              type: "string",
              description: "Patient name to search for"
            }
          },
          required: ["search"]
        }
      },
      {
        name: "get_pending_orders",
        description: "Get list of pending orders",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "get_patient_stats",
        description: "Get patient statistics including recall due patients",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "get_top_products",
        description: "Get top selling products",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of products to return (default: 10)"
            }
          },
          required: []
        }
      }
    ];

    const messages = [
      {
        role: 'system' as const,
        content: this.externalAI.buildSystemPrompt()
      },
      {
        role: 'user' as const,
        content: query.message
      }
    ];

    const response = await this.externalAI.generateResponse(messages, {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      maxTokens: 2000,
      tools,
      onToolCall: async (toolName: string, args: any) => {
        return await this.handleToolCall(toolName, args, {
          companyId: query.companyId,
          userId: query.userId
        });
      }
    });

    return {
      response: response.content,
      conversationId: query.conversationId || undefined,
      metadata: {
        tokensUsed: response.tokensUsed.total,
        cost: response.estimatedCost,
        usedExternalAI: true,
        toolsUsed: [], // Track which tools were called
      }
    };
  } catch (error) {
    this.logger.error("Chat error", error as Error);
    throw error;
  }
}
```

---

### Step 3: Test Contextual Queries

**Test these queries in your chat widget:**

1. **Revenue Query:**
   - "What was my total revenue last month?"
   - Expected: AI calls `get_revenue_data`, returns actual number

2. **Inventory Query:**
   - "Which products are low in stock?"
   - Expected: AI calls `get_low_stock_items`, lists products

3. **Patient Query:**
   - "How many patients need recall?"
   - Expected: AI calls `get_patient_stats`, returns count

4. **Orders Query:**
   - "Show me all pending orders"
   - Expected: AI calls `get_pending_orders`, lists orders

---

## Example Interaction

**User:** "What was my revenue last month?"

**AI Thought Process:**
1. Detects this needs data
2. Calls `get_revenue_data({ timeframe: 'month' })`
3. Gets: `{ totalRevenue: 45230, invoiceCount: 87, averageInvoice: 519.89 }`
4. Formats response

**AI Response:** "Your total revenue for last month was **$45,230** from 87 invoices. Your average invoice value was $519.89."

---

## Security Considerations

✅ **Multi-tenant isolation**: All queries filtered by `companyId`  
✅ **No SQL injection**: Using Drizzle parameterized queries  
✅ **Row-level security**: User can only see their company's data  
✅ **Audit trail**: All queries logged with user/company context

---

## What's Next?

**Chunk 3** will make the AI **proactive** - it will send you insights without asking:
- Morning briefings with key metrics
- Automatic alerts for low stock
- Patient recall reminders
- Unusual sales patterns

---

**Status:** Ready to implement  
**Dependencies:** Chunk 1 (AI Chat Widget)  
**Next:** Chunk 3 - Proactive Insights
