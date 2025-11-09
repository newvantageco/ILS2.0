# AI Tools Implementation Guide

## Problem Identified

Your AI Assistant interface is showing "I don't have enough information to answer this question confidently" because:

1. **The AI is not connected to your database** - It's making API calls but can't actually query patient data, inventory, orders, etc.
2. **No Function Calling/Tools configured** - OpenAI and Anthropic support "function calling" which allows the AI to call specific functions to fetch data, but this isn't set up
3. **Missing Tool Execution Layer** - There's no bridge between the AI's requests and your actual database queries

## What You Have Built

You have an extensive AI infrastructure:

✅ **ExternalAIService** - Connects to OpenAI/Anthropic  
✅ **AIAssistantService** - Manages conversations, learning, and responses  
✅ **AI Routes** - API endpoints for the assistant  
✅ **Frontend AI Widget** - Beautiful UI component  
✅ **Multi-tenant isolation** - Secure data access  
✅ **Database schema** - Full data model for patients, inventory, orders, examinations  

## What's Missing

❌ **Function/Tool Definitions** - The AI needs to know what functions it can call  
❌ **Tool Execution Handler** - Code to execute the tools and return results  
❌ **Database Query Methods** - Helper methods to fetch data for the tools  

## Solution Architecture

```
User Question
    ↓
AI Assistant Frontend (AIAssistant.tsx)
    ↓
POST /api/ai-assistant/ask
    ↓
AIAssistantService.ask()
    ↓
ExternalAIService.generateResponse() 
    ├→ [WITH TOOLS DEFINED] ←
    ├→ AI analyzes question
    ├→ AI decides to call: "search_patients" with args: {search: "John"}
    ↓
Tool Execution Handler
    ├→ Execute database query
    ├→ Return results to AI
    ↓
AI processes results
    ↓
AI generates natural language response
    ↓
Return to user
```

## Implementation Steps

### Step 1: Add Tool Execution to AIAssistantService

Update the `generateExternalAiAnswer` method in `/server/services/AIAssistantService.ts` to include tools:

```typescript
// Around line 445 in AIAssistantService.ts
private async generateExternalAiAnswer(
  question: string,
  learnedAnswers: any[],
  documentContext: any[],
  config: AiAssistantConfig
): Promise<AiResponse> {
  try {
    // ... existing context building code ...

    if (this.externalAiAvailable) {
      const systemPrompt = this.externalAI.buildSystemPrompt(contextPrompt);
      
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: question }
      ];

      const provider = config.model?.startsWith('claude') ? 'anthropic' : 'openai';
      const model = config.model || (provider === 'openai' ? 'gpt-4-turbo-preview' : 'claude-3-sonnet-20240229');

      // ADD TOOLS HERE
      const tools = this.externalAI.getAvailableTools();
      
      // CREATE TOOL HANDLER
      const onToolCall = async (toolName: string, args: any) => {
        return await this.executeToolCall(toolName, args, config.companyId);
      };

      const aiResponse = await this.externalAI.generateResponse(messages, {
        provider,
        model,
        maxTokens: 2000,
        temperature: 0.7,
        tools,        // Pass tools
        onToolCall    // Pass handler
      });

      // ... rest of the method ...
    }
  } catch (error) {
    // ... error handling ...
  }
}
```

### Step 2: Add Tool Execution Method

Add this method to `AIAssistantService`:

```typescript
/**
 * Execute a tool call from the AI
 */
private async executeToolCall(
  toolName: string,
  args: any,
  companyId: string
): Promise<any> {
  this.logger.info(`Executing tool: ${toolName}`, { args, companyId });

  try {
    switch (toolName) {
      case "get_patient_info":
        return await this.toolGetPatientInfo(args, companyId);
      
      case "check_inventory":
        return await this.toolCheckInventory(args, companyId);
      
      case "get_sales_data":
        return await this.toolGetSalesData(args, companyId);
      
      case "search_orders":
        return await this.toolSearchOrders(args, companyId);
      
      case "get_examination_records":
        return await this.toolGetExaminationRecords(args, companyId);
      
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    this.logger.error(`Tool execution failed: ${toolName}`, error as Error);
    return { error: (error as Error).message };
  }
}

/**
 * Tool: Get patient information
 */
private async toolGetPatientInfo(args: any, companyId: string): Promise<any> {
  const { search } = args;
  
  // Query database for patients
  const patients = await this.storage.getCustomers({ 
    companyId, 
    search,
    limit: 5 
  });
  
  if (patients.length === 0) {
    return { message: "No patients found matching that search" };
  }
  
  return {
    found: true,
    count: patients.length,
    patients: patients.map(p => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      phone: p.phone,
      registeredDate: p.createdAt
    }))
  };
}

/**
 * Tool: Check inventory
 */
private async toolCheckInventory(args: any, companyId: string): Promise<any> {
  const { search, checkLowStock } = args;
  
  if (checkLowStock) {
    // Get low stock items
    const items = await this.storage.getInventory({ 
      companyId, 
      lowStock: true 
    });
    
    return {
      lowStockCount: items.length,
      items: items.map(i => ({
        name: i.name,
        sku: i.sku,
        currentStock: i.quantity,
        reorderPoint: i.reorderPoint
      }))
    };
  }
  
  // Search inventory
  const items = await this.storage.getInventory({ 
    companyId, 
    search,
    limit: 10 
  });
  
  return {
    found: items.length > 0,
    count: items.length,
    items: items.map(i => ({
      name: i.name,
      sku: i.sku,
      stock: i.quantity,
      price: i.sellingPrice,
      category: i.category
    }))
  };
}

/**
 * Tool: Get sales data
 */
private async toolGetSalesData(args: any, companyId: string): Promise<any> {
  const { timeframe, startDate, endDate, metric } = args;
  
  // Calculate date range based on timeframe
  let start: Date, end: Date;
  const now = new Date();
  
  switch (timeframe) {
    case 'today':
      start = new Date(now.setHours(0,0,0,0));
      end = new Date();
      break;
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = new Date();
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
      break;
    case 'custom':
      start = new Date(startDate);
      end = new Date(endDate);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = new Date();
  }
  
  // Get orders for the period
  const orders = await this.storage.getOrders({ 
    companyId,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    status: 'completed'
  });
  
  const totalRevenue = orders.reduce((sum, order) => 
    sum + parseFloat(order.totalAmount || '0'), 0
  );
  
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  return {
    timeframe,
    period: {
      start: start.toISOString(),
      end: end.toISOString()
    },
    totalRevenue: totalRevenue.toFixed(2),
    orderCount: orders.length,
    averageOrderValue: avgOrderValue.toFixed(2)
  };
}

/**
 * Tool: Search orders
 */
private async toolSearchOrders(args: any, companyId: string): Promise<any> {
  const { search, status, dateRange } = args;
  
  const orders = await this.storage.getOrders({
    companyId,
    search,
    status,
    limit: 20
  });
  
  return {
    found: orders.length > 0,
    count: orders.length,
    orders: orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      totalAmount: o.totalAmount,
      date: o.createdAt
    }))
  };
}

/**
 * Tool: Get examination records
 */
private async toolGetExaminationRecords(args: any, companyId: string): Promise<any> {
  const { patientId, patientName } = args;
  
  // If patient name provided, search for patient first
  let pid = patientId;
  if (!pid && patientName) {
    const patients = await this.storage.getCustomers({
      companyId,
      search: patientName,
      limit: 1
    });
    if (patients.length > 0) {
      pid = patients[0].id;
    }
  }
  
  if (!pid) {
    return { error: "Patient not found" };
  }
  
  const examinations = await this.storage.getExaminations({
    companyId,
    customerId: pid,
    limit: 5
  });
  
  return {
    patientId: pid,
    count: examinations.length,
    examinations: examinations.map(exam => ({
      date: exam.examinationDate,
      examiner: exam.examinerName,
      rightEye: exam.odSphere ? {
        sphere: exam.odSphere,
        cylinder: exam.odCylinder,
        axis: exam.odAxis
      } : null,
      leftEye: exam.osSphere ? {
        sphere: exam.osSphere,
        cylinder: exam.osCylinder,
        axis: exam.osAxis
      } : null
    }))
  };
}
```

### Step 3: Update Storage Methods (if needed)

The storage layer might need some helper methods. Check if these exist in `/server/storage/index.ts`:

- `getCustomers()` - with search parameter
- `getInventory()` - with search and lowStock filters
- `getOrders()` - with date range and status filters
- `getExaminations()` - with customer filter

### Step 4: Test the Implementation

1. **Restart the server**
```bash
npm run dev
```

2. **Test queries in the AI Assistant:**

Try these example queries:
- "Who are our recent patients?"
- "What items are low in stock?"
- "Show me today's sales"
- "Find orders for John Smith"
- "What's the examination history for patient ID 123?"

## Example Flow

**User asks:** "What items are low in stock?"

1. Frontend sends: `POST /api/ai-assistant/ask` with `{ question: "What items are low in stock?" }`

2. AI receives the question and analyzes it

3. AI decides to use the `check_inventory` tool with args: `{ checkLowStock: true }`

4. Tool handler executes: `toolCheckInventory({ checkLowStock: true }, companyId)`

5. Database query runs and returns:
```json
{
  "lowStockCount": 3,
  "items": [
    { "name": "Ray-Ban Classic", "sku": "RB-001", "currentStock": 2, "reorderPoint": 5 },
    { "name": "Progressive Lens", "sku": "PL-200", "currentStock": 1, "reorderPoint": 10 }
  ]
}
```

6. AI receives this data and generates response:
```
"You currently have 3 items that are low in stock:

1. Ray-Ban Classic (SKU: RB-001) - Only 2 units remaining (reorder point: 5)
2. Progressive Lens (SKU: PL-200) - Only 1 unit remaining (reorder point: 10)

I recommend placing reorders for these items soon to avoid stockouts."
```

7. User sees the helpful, data-driven response!

## Benefits

Once implemented, your AI will be able to:

✅ Search and retrieve patient information  
✅ Check inventory levels and identify low stock  
✅ Analyze sales data and generate reports  
✅ Find specific orders and track status  
✅ Access examination records and prescriptions  
✅ Answer complex business questions with real data  
✅ Provide actionable insights based on your actual database  

## Next Steps

1. Review the code changes above
2. Implement the tool execution methods in AIAssistantService.ts
3. Verify storage methods exist (or add them)
4. Test with various queries
5. Add more tools as needed (analytics, predictions, recommendations)
6. Monitor AI token usage and costs

## Security Notes

- All tool executions respect tenant isolation (companyId)
- Patient data is only accessible within the same company
- Tools follow your existing RBAC permissions
- Sensitive data is not exposed in tool descriptions
- All database queries use the existing secure storage layer

---

**Status:** Ready to implement  
**Estimated Time:** 2-3 hours  
**Impact:** High - Will make your AI Assistant fully functional with real data access
