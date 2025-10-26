import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertOrderSchema, 
  updateOrderStatusSchema,
  insertConsultLogSchema,
  insertPurchaseOrderSchema,
  insertPOLineItemSchema,
  insertTechnicalDocumentSchema,
  updatePOStatusSchema,
  insertSupplierSchema,
  updateSupplierSchema,
  updateOrganizationSettingsSchema,
  updateUserPreferencesSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { generatePurchaseOrderPDF } from "./pdfService";
import { sendPurchaseOrderEmail, sendShipmentNotificationEmail } from "./emailService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Bootstrap endpoint - returns user and role-based redirect path
  app.get('/api/auth/bootstrap', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user needs to complete signup
      if (!user.role) {
        return res.json({
          user,
          redirectPath: '/signup',
          requiresSetup: true
        });
      }

      // Check account status
      if (user.accountStatus === 'pending') {
        return res.json({
          user,
          redirectPath: '/pending-approval',
          isPending: true
        });
      }

      if (user.accountStatus === 'suspended') {
        return res.json({
          user,
          redirectPath: '/account-suspended',
          isSuspended: true,
          suspensionReason: user.statusReason
        });
      }

      // Determine redirect path based on user role
      let redirectPath = '/';
      switch (user.role) {
        case 'ecp':
          redirectPath = '/ecp-dashboard';
          break;
        case 'lab_tech':
        case 'engineer':
          redirectPath = '/lab-dashboard';
          break;
        case 'supplier':
          redirectPath = '/supplier-dashboard';
          break;
        case 'admin':
          redirectPath = '/admin-dashboard';
          break;
        default:
          redirectPath = '/';
      }

      res.json({
        user,
        redirectPath
      });
    } catch (error) {
      console.error("Error in bootstrap:", error);
      res.status(500).json({ message: "Failed to bootstrap" });
    }
  });

  // Complete signup endpoint
  app.post('/api/auth/complete-signup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has a role
      if (user.role) {
        return res.status(400).json({ message: "User already has a role assigned" });
      }

      const { role, organizationName } = req.body;
      
      if (!role || !['ecp', 'lab_tech', 'engineer', 'supplier'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      // Update user with role and organization, set status to pending
      const updatedUser = await storage.updateUser(userId, {
        role,
        organizationName: organizationName || null,
        accountStatus: 'pending'
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error completing signup:", error);
      res.status(500).json({ message: "Failed to complete signup" });
    }
  });

  // Order routes
  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create orders" });
      }

      const validation = insertOrderSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message, errors: validation.error.issues });
      }

      // Create patient record
      const { patientName, patientDOB, ...orderData } = validation.data as any;
      
      const patient = await storage.createPatient({
        name: patientName,
        dateOfBirth: patientDOB || null,
        ecpId: userId,
      });

      // Create order with patient ID and ECP ID
      const order = await storage.createOrder({
        ...orderData,
        patientId: patient.id,
        ecpId: userId,
      } as any);

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can access orders
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status, search, limit, offset } = req.query;
      
      const filters: any = {
        status: status as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      // ECPs can only see their own orders
      if (user.role === 'ecp') {
        filters.ecpId = userId;
      }

      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can access orders
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // ECPs can only see their own orders
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.patch('/api/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Suppliers don't have access to order data in Phase 1
      if (user.role === 'supplier') {
        return res.status(403).json({ message: "Access denied. Purchase order functionality coming in Phase 2." });
      }
      
      // Only lab techs and engineers can update order status
      if (user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const validation = updateOrderStatusSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const order = await storage.updateOrderStatus(req.params.id, validation.data.status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Suppliers routes
  app.get('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can view suppliers" });
      }

      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can create suppliers" });
      }

      const validation = insertSupplierSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const supplier = await storage.createSupplier(validation.data);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.patch('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can update suppliers" });
      }

      const validation = updateSupplierSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const supplier = await storage.updateSupplier(req.params.id, validation.data);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can delete suppliers" });
      }

      const deleted = await storage.deleteSupplier(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Stats routes
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can access stats
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      // ECPs get stats for their own orders
      const ecpId = user.role === 'ecp' ? userId : undefined;
      const stats = await storage.getOrderStats(ecpId);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Consult Log routes (Phase 2)
  app.post('/api/consult-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create consult logs" });
      }

      const validation = insertConsultLogSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const log = await storage.createConsultLog({
        ...validation.data,
        ecpId: userId,
      });

      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating consult log:", error);
      res.status(500).json({ message: "Failed to create consult log" });
    }
  });

  app.get('/api/consult-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can view consult logs
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const logs = await storage.getAllConsultLogs(user.role === 'ecp' ? userId : undefined);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching consult logs:", error);
      res.status(500).json({ message: "Failed to fetch consult logs" });
    }
  });

  app.get('/api/orders/:orderId/consult-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can view consult logs
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const logs = await storage.getConsultLogs(req.params.orderId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching consult logs:", error);
      res.status(500).json({ message: "Failed to fetch consult logs" });
    }
  });

  app.patch('/api/consult-logs/:id/respond', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can respond to consult logs" });
      }

      const { response } = req.body;
      if (!response || typeof response !== 'string') {
        return res.status(400).json({ message: "Response is required" });
      }

      const log = await storage.respondToConsultLog(req.params.id, response);
      
      if (!log) {
        return res.status(404).json({ message: "Consult log not found" });
      }

      res.json(log);
    } catch (error) {
      console.error("Error responding to consult log:", error);
      res.status(500).json({ message: "Failed to respond to consult log" });
    }
  });

  // Purchase Order routes (Phase 2)
  app.post('/api/purchase-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can create purchase orders" });
      }

      const { lineItems, ...poData } = req.body;
      
      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({ message: "At least one line item is required" });
      }

      const poValidation = insertPurchaseOrderSchema.safeParse(poData);
      if (!poValidation.success) {
        const validationError = fromZodError(poValidation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const po = await storage.createPurchaseOrder({
        ...poValidation.data,
        lineItems,
      }, userId);

      res.status(201).json(po);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });

  app.get('/api/purchase-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, limit, offset } = req.query;
      
      const filters: any = {
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      // Suppliers can only see their own POs
      if (user.role === 'supplier') {
        filters.supplierId = userId;
      }

      const pos = await storage.getPurchaseOrders(filters);
      res.json(pos);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.get('/api/purchase-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const po = await storage.getPurchaseOrder(req.params.id);
      
      if (!po) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      // Suppliers can only see their own POs
      if (user.role === 'supplier' && po.supplierId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(po);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });

  app.patch('/api/purchase-orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validation = updatePOStatusSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { status, trackingNumber, actualDeliveryDate } = validation.data;

      const po = await storage.updatePOStatus(
        req.params.id, 
        status,
        trackingNumber,
        actualDeliveryDate ? new Date(actualDeliveryDate) : undefined
      );
      
      if (!po) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      res.json(po);
    } catch (error) {
      console.error("Error updating purchase order status:", error);
      res.status(500).json({ message: "Failed to update purchase order status" });
    }
  });

  // Technical Document routes (Phase 2)
  app.post('/api/technical-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'supplier') {
        return res.status(403).json({ message: "Only suppliers can upload technical documents" });
      }

      const validation = insertTechnicalDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const doc = await storage.createTechnicalDocument(validation.data, userId);

      res.status(201).json(doc);
    } catch (error) {
      console.error("Error creating technical document:", error);
      res.status(500).json({ message: "Failed to create technical document" });
    }
  });

  app.get('/api/technical-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Suppliers can only see their own documents
      const supplierId = user.role === 'supplier' ? userId : undefined;
      const docs = await storage.getTechnicalDocuments(supplierId);
      
      res.json(docs);
    } catch (error) {
      console.error("Error fetching technical documents:", error);
      res.status(500).json({ message: "Failed to fetch technical documents" });
    }
  });

  app.delete('/api/technical-documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'supplier') {
        return res.status(403).json({ message: "Only suppliers can delete their own documents" });
      }

      const deleted = await storage.deleteTechnicalDocument(req.params.id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Technical document not found or access denied" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting technical document:", error);
      res.status(500).json({ message: "Failed to delete technical document" });
    }
  });

  // PDF and Email routes
  app.get('/api/purchase-orders/:id/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer' && user.role !== 'supplier')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const po = await storage.getPurchaseOrderById(req.params.id);
      
      if (!po) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      // Suppliers can only access their own POs
      if (user.role === 'supplier' && po.supplierId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const pdfDoc = generatePurchaseOrderPDF(po as any);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="PO-${po.poNumber}.pdf"`);
      
      pdfDoc.pipe(res);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.post('/api/purchase-orders/:id/email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can email purchase orders" });
      }

      const po = await storage.getPurchaseOrderById(req.params.id);
      
      if (!po) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      if (!po.supplier.email) {
        return res.status(400).json({ message: "Supplier email not found" });
      }

      // Generate PDF as buffer
      const pdfDoc = generatePurchaseOrderPDF(po as any);
      const chunks: Buffer[] = [];
      
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      
      await new Promise<void>((resolve, reject) => {
        pdfDoc.on('end', () => resolve());
        pdfDoc.on('error', reject);
      });

      const pdfBuffer = Buffer.concat(chunks);

      await sendPurchaseOrderEmail(
        po.supplier.email,
        po.supplier.organizationName || 'Supplier',
        po.poNumber,
        pdfBuffer,
        po.supplier.accountNumber || undefined
      );

      res.json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  const markOrderShippedSchema = z.object({
    trackingNumber: z.string().min(1, "Tracking number is required"),
  });

  app.patch('/api/orders/:id/ship', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can mark orders as shipped" });
      }

      const validation = markOrderShippedSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const order = await storage.markOrderAsShipped(req.params.id, validation.data.trackingNumber);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Send email to ECP
      const ecp = await storage.getUser(order.ecpId);
      if (ecp && ecp.email) {
        await sendShipmentNotificationEmail(
          ecp.email,
          `${ecp.firstName || ''} ${ecp.lastName || ''}`.trim() || 'Customer',
          order.orderNumber,
          order.patient.name,
          validation.data.trackingNumber
        );
      }

      res.json(order);
    } catch (error) {
      console.error("Error marking order as shipped:", error);
      res.status(500).json({ message: "Failed to mark order as shipped" });
    }
  });

  // Settings routes
  app.get('/api/settings/organization', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can view organization settings" });
      }

      const settings = await storage.getOrganizationSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching organization settings:", error);
      res.status(500).json({ message: "Failed to fetch organization settings" });
    }
  });

  app.put('/api/settings/organization', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can update organization settings" });
      }

      const validation = updateOrganizationSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const settings = await storage.updateOrganizationSettings(validation.data, userId);
      res.json(settings);
    } catch (error) {
      console.error("Error updating organization settings:", error);
      res.status(500).json({ message: "Failed to update organization settings" });
    }
  });

  app.get('/api/settings/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences || {});
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  app.put('/api/settings/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = updateUserPreferencesSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const preferences = await storage.updateUserPreferences(userId, validation.data);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.patch('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const targetUserId = req.params.id;
      const { role, accountStatus, statusReason } = req.body;

      // Validate updates
      const updates: any = {};
      if (role !== undefined) {
        if (!['ecp', 'lab_tech', 'engineer', 'supplier'].includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        updates.role = role;
      }
      if (accountStatus !== undefined) {
        if (!['pending', 'active', 'suspended'].includes(accountStatus)) {
          return res.status(400).json({ message: "Invalid account status" });
        }
        updates.accountStatus = accountStatus;
      }
      if (statusReason !== undefined) {
        updates.statusReason = statusReason;
      }

      const updatedUser = await storage.updateUser(targetUserId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
