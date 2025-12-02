/**
 * Order Routes
 * 
 * Defines all order-related routes and maps them to controller methods.
 * This file contains no business logic - only route registration.
 */

import { Router, Request, Response } from "express";
import { OrderController } from "../controllers/order.controller";
import { authenticateHybrid } from "../middleware/auth-hybrid";

const router = Router();
const orderController = new OrderController();

// Type assertion to handle Express route handler compatibility
const asHandler = (handler: (req: any, res: Response) => Promise<void>) => handler;

/**
 * Order Management Routes
 * 
 * All routes require authentication and appropriate role permissions.
 */

// GET /api/orders - Get all orders with filtering and pagination
router.get("/", authenticateHybrid, asHandler(orderController.getOrders));

// GET /api/orders/stats - Get order statistics for dashboard
router.get("/stats", authenticateHybrid, asHandler(orderController.getOrderStats));

// GET /api/orders/:id - Get a specific order by ID
router.get("/:id", authenticateHybrid, asHandler(orderController.getOrderById));

// POST /api/orders - Create a new order
router.post("/", authenticateHybrid, asHandler(orderController.createOrder));

// PUT /api/orders/:id/status - Update order status
router.put("/:id/status", authenticateHybrid, asHandler(orderController.updateOrderStatus));

// DELETE /api/orders/:id - Delete/cancel an order
router.delete("/:id", authenticateHybrid, asHandler(orderController.deleteOrder));

export default router;
