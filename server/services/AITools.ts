/**
 * AI Tools/Functions Configuration
 * 
 * Defines the tools/functions that the AI can use to query real data
 * from the database, calculate metrics, and perform actions.
 * 
 * These tools work with OpenAI Function Calling and Anthropic Tool Use
 */

import type { IStorage } from "../storage";
import { createLogger, type Logger } from "../utils/logger";

export interface AITool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface AIToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class AIToolsService {
  private logger: Logger;

  constructor(private storage: IStorage) {
    this.logger = createLogger("AIToolsService");
  }

  /**
   * Get all available tools for the AI
   */
  getTools(): AITool[] {
    return [
      {
        name: "search_patients",
        description: "Search for patients by name, email, phone, or ID. Returns patient demographics and basic info.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search term (name, email, or phone number)"
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 10)"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_patient_details",
        description: "Get detailed information about a specific patient including contact info, purchase history, and prescriptions",
        parameters: {
          type: "object",
          properties: {
            patientId: {
              type: "string",
              description: "The patient ID"
            }
          },
          required: ["patientId"]
        }
      },
      {
        name: "search_inventory",
        description: "Search inventory for frames, lenses, or accessories. Can filter by type, brand, status, or stock level",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search term for product name, SKU, or description"
            },
            category: {
              type: "string",
              enum: ["frame", "lens", "accessory", "contact_lens"],
              description: "Product category filter"
            },
            inStock: {
              type: "boolean",
              description: "Filter for items in stock"
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 20)"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_inventory_item",
        description: "Get detailed information about a specific inventory item including stock levels, pricing, supplier info",
        parameters: {
          type: "object",
          properties: {
            itemId: {
              type: "string",
              description: "The inventory item ID"
            }
          },
          required: ["itemId"]
        }
      },
      {
        name: "get_low_stock_items",
        description: "Get list of inventory items that are low on stock or need reordering",
        parameters: {
          type: "object",
          properties: {
            threshold: {
              type: "number",
              description: "Stock level threshold (default: 5)"
            },
            category: {
              type: "string",
              enum: ["frame", "lens", "accessory", "contact_lens"],
              description: "Filter by category"
            }
          },
          required: []
        }
      },
      {
        name: "get_sales_summary",
        description: "Get sales summary for a date range including total revenue, number of orders, average order value",
        parameters: {
          type: "object",
          properties: {
            startDate: {
              type: "string",
              description: "Start date (YYYY-MM-DD)"
            },
            endDate: {
              type: "string",
              description: "End date (YYYY-MM-DD)"
            },
            groupBy: {
              type: "string",
              enum: ["day", "week", "month"],
              description: "How to group the results"
            }
          },
          required: ["startDate", "endDate"]
        }
      },
      {
        name: "get_top_selling_products",
        description: "Get the top selling products for a date range",
        parameters: {
          type: "object",
          properties: {
            startDate: {
              type: "string",
              description: "Start date (YYYY-MM-DD)"
            },
            endDate: {
              type: "string",
              description: "End date (YYYY-MM-DD)"
            },
            limit: {
              type: "number",
              description: "Number of top products to return (default: 10)"
            },
            category: {
              type: "string",
              enum: ["frame", "lens", "accessory", "contact_lens"],
              description: "Filter by product category"
            }
          },
          required: ["startDate", "endDate"]
        }
      },
      {
        name: "search_orders",
        description: "Search for orders by order number, patient name, date range, or status",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search term (order number or patient name)"
            },
            status: {
              type: "string",
              enum: ["pending", "processing", "completed", "cancelled"],
              description: "Filter by order status"
            },
            startDate: {
              type: "string",
              description: "Start date for date range filter (YYYY-MM-DD)"
            },
            endDate: {
              type: "string",
              description: "End date for date range filter (YYYY-MM-DD)"
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 20)"
            }
          },
          required: []
        }
      },
      {
        name: "get_order_details",
        description: "Get detailed information about a specific order including items, pricing, status, and history",
        parameters: {
          type: "object",
          properties: {
            orderId: {
              type: "string",
              description: "The order ID"
            }
          },
          required: ["orderId"]
        }
      },
      {
        name: "get_patient_analytics",
        description: "Get anonymized analytics about patient demographics, purchase patterns, and trends",
        parameters: {
          type: "object",
          properties: {
            metric: {
              type: "string",
              enum: ["age_distribution", "purchase_frequency", "average_spend", "preferred_products", "lens_type_distribution"],
              description: "The analytics metric to retrieve"
            },
            startDate: {
              type: "string",
              description: "Start date for analysis (YYYY-MM-DD)"
            },
            endDate: {
              type: "string",
              description: "End date for analysis (YYYY-MM-DD)"
            }
          },
          required: ["metric"]
        }
      },
      {
        name: "get_examination_history",
        description: "Get examination history for a patient including prescriptions and test results",
        parameters: {
          type: "object",
          properties: {
            patientId: {
              type: "string",
              description: "The patient ID"
            },
            limit: {
              type: "number",
              description: "Number of recent examinations to return (default: 5)"
            }
          },
          required: ["patientId"]
        }
      },
      {
        name: "calculate_metrics",
        description: "Calculate various business metrics like revenue growth, conversion rates, inventory turnover",
        parameters: {
          type: "object",
          properties: {
            metric: {
              type: "string",
              enum: ["revenue_growth", "customer_retention", "inventory_turnover", "average_order_value", "profit_margin"],
              description: "The metric to calculate"
            },
            period: {
              type: "string",
              enum: ["week", "month", "quarter", "year"],
              description: "Time period for calculation"
            }
          },
          required: ["metric", "period"]
        }
      }
    ];
  }

  /**
   * Execute a tool/function call
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>,
    companyId: string
  ): Promise<AIToolResult> {
    this.logger.info(`Executing tool: ${toolName}`, { args, companyId });

    try {
      switch (toolName) {
        case "search_patients":
          return await this.searchPatients(args, companyId);
        
        case "get_patient_details":
          return await this.getPatientDetails(args, companyId);
        
        case "search_inventory":
          return await this.searchInventory(args, companyId);
        
        case "get_inventory_item":
          return await this.getInventoryItem(args, companyId);
        
        case "get_low_stock_items":
          return await this.getLowStockItems(args, companyId);
        
        case "get_sales_summary":
          return await this.getSalesSummary(args, companyId);
        
        case "get_top_selling_products":
          return await this.getTopSellingProducts(args, companyId);
        
        case "search_orders":
          return await this.searchOrders(args, companyId);
        
        case "get_order_details":
          return await this.getOrderDetails(args, companyId);
        
        case "get_patient_analytics":
          return await this.getPatientAnalytics(args, companyId);
        
        case "get_examination_history":
          return await this.getExaminationHistory(args, companyId);
        
        case "calculate_metrics":
          return await this.calculateMetrics(args, companyId);
        
        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`
          };
      }
    } catch (error) {
      this.logger.error(`Tool execution failed: ${toolName}`, error as Error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // ============================================================================
  // Tool Implementations
  // ============================================================================

  private async searchPatients(args: any, companyId: string): Promise<AIToolResult> {
    const { query, limit = 10 } = args;
    
    // Search patients using the storage layer
    const patients = await this.storage.searchCustomers(companyId, query, limit);
    
    // Return simplified patient data (exclude sensitive info)
    const results = patients.map(p => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      phone: p.phone,
      registeredDate: p.createdAt
    }));

    return {
      success: true,
      data: {
        count: results.length,
        patients: results
      }
    };
  }

  private async getPatientDetails(args: any, companyId: string): Promise<AIToolResult> {
    const { patientId } = args;
    
    const patient = await this.storage.getCustomer(patientId);
    
    if (!patient || patient.companyId !== companyId) {
      return {
        success: false,
        error: "Patient not found"
      };
    }

    // Get purchase history
    const orders = await this.storage.getCustomerOrders(patientId);
    
    return {
      success: true,
      data: {
        patient: {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          email: patient.email,
          phone: patient.phone,
          registeredDate: patient.createdAt
        },
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + (parseFloat(order.totalAmount || '0')), 0),
        lastOrderDate: orders.length > 0 ? orders[0].createdAt : null
      }
    };
  }

  private async searchInventory(args: any, companyId: string): Promise<AIToolResult> {
    const { query, category, inStock, limit = 20 } = args;
    
    const items = await this.storage.searchInventory(companyId, {
      query,
      category,
      inStock,
      limit
    });

    const results = items.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      stockLevel: item.quantity,
      price: item.sellingPrice,
      supplier: item.supplier
    }));

    return {
      success: true,
      data: {
        count: results.length,
        items: results
      }
    };
  }

  private async getInventoryItem(args: any, companyId: string): Promise<AIToolResult> {
    const { itemId } = args;
    
    const item = await this.storage.getInventoryItem(itemId);
    
    if (!item || item.companyId !== companyId) {
      return {
        success: false,
        error: "Inventory item not found"
      };
    }

    return {
      success: true,
      data: {
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        description: item.description,
        stockLevel: item.quantity,
        reorderPoint: item.reorderPoint,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        supplier: item.supplier,
        location: item.location
      }
    };
  }

  private async getLowStockItems(args: any, companyId: string): Promise<AIToolResult> {
    const { threshold = 5, category } = args;
    
    const items = await this.storage.getLowStockItems(companyId, threshold, category);

    const results = items.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      currentStock: item.quantity,
      reorderPoint: item.reorderPoint,
      supplier: item.supplier
    }));

    return {
      success: true,
      data: {
        count: results.length,
        items: results,
        totalValueAtRisk: results.reduce((sum, item) => sum + (item.currentStock * parseFloat(item.sellingPrice || '0')), 0)
      }
    };
  }

  private async getSalesSummary(args: any, companyId: string): Promise<AIToolResult> {
    const { startDate, endDate, groupBy = 'day' } = args;
    
    const summary = await this.storage.getSalesSummary(companyId, startDate, endDate, groupBy);

    return {
      success: true,
      data: summary
    };
  }

  private async getTopSellingProducts(args: any, companyId: string): Promise<AIToolResult> {
    const { startDate, endDate, limit = 10, category } = args;
    
    const products = await this.storage.getTopSellingProducts(companyId, startDate, endDate, limit, category);

    return {
      success: true,
      data: {
        count: products.length,
        products: products.map(p => ({
          name: p.name,
          quantitySold: p.totalQuantity,
          revenue: p.totalRevenue,
          category: p.category
        }))
      }
    };
  }

  private async searchOrders(args: any, companyId: string): Promise<AIToolResult> {
    const { query, status, startDate, endDate, limit = 20 } = args;
    
    const orders = await this.storage.searchOrders(companyId, {
      query,
      status,
      startDate,
      endDate,
      limit
    });

    const results = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      patientName: order.customerName,
      date: order.createdAt,
      status: order.status,
      totalAmount: order.totalAmount
    }));

    return {
      success: true,
      data: {
        count: results.length,
        orders: results
      }
    };
  }

  private async getOrderDetails(args: any, companyId: string): Promise<AIToolResult> {
    const { orderId } = args;
    
    const order = await this.storage.getOrder(orderId);
    
    if (!order || order.companyId !== companyId) {
      return {
        success: false,
        error: "Order not found"
      };
    }

    const items = await this.storage.getOrderItems(orderId);

    return {
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          date: order.createdAt,
          status: order.status,
          customerName: order.customerName,
          totalAmount: order.totalAmount,
          paymentStatus: order.paymentStatus
        },
        items: items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        timeline: order.statusHistory || []
      }
    };
  }

  private async getPatientAnalytics(args: any, companyId: string): Promise<AIToolResult> {
    const { metric, startDate, endDate } = args;
    
    const analytics = await this.storage.getPatientAnalytics(companyId, metric, startDate, endDate);

    return {
      success: true,
      data: {
        metric,
        period: { startDate, endDate },
        results: analytics
      }
    };
  }

  private async getExaminationHistory(args: any, companyId: string): Promise<AIToolResult> {
    const { patientId, limit = 5 } = args;
    
    const examinations = await this.storage.getPatientExaminations(patientId, limit);

    const results = examinations.map(exam => ({
      id: exam.id,
      date: exam.examinationDate,
      examiner: exam.examinerName,
      prescription: {
        rightEye: exam.rightEyePrescription,
        leftEye: exam.leftEyePrescription
      },
      notes: exam.notes
    }));

    return {
      success: true,
      data: {
        patientId,
        count: results.length,
        examinations: results
      }
    };
  }

  private async calculateMetrics(args: any, companyId: string): Promise<AIToolResult> {
    const { metric, period } = args;
    
    const result = await this.storage.calculateBusinessMetric(companyId, metric, period);

    return {
      success: true,
      data: {
        metric,
        period,
        value: result.value,
        trend: result.trend,
        previousValue: result.previousValue,
        change: result.change,
        changePercentage: result.changePercentage
      }
    };
  }
}
