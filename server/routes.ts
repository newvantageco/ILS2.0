import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth as setupReplitAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth, hashPassword } from "./localAuth";
import passport from "passport";
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
  updateUserPreferencesSchema,
  insertEyeExaminationSchema,
  insertPrescriptionSchema,
  insertProductSchema,
  insertInvoiceSchema,
  insertInvoiceLineItemSchema,
  insertPatientSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { generatePurchaseOrderPDF } from "./pdfService";
import { sendPurchaseOrderEmail, sendShipmentNotificationEmail } from "./emailService";
import { z } from "zod";
import { parseOMAFile, isValidOMAFile } from "@shared/omaParser";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment monitoring
  app.get('/health', (_req, res) => {
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  if (process.env.NODE_ENV === 'development') {
    setupLocalAuth();
  } else {
    await setupReplitAuth(app);
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithRoles(userId);
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
      const user = await storage.getUserWithRoles(userId);
      
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
          redirectPath = '/ecp/dashboard';
          break;
        case 'lab_tech':
        case 'engineer':
          redirectPath = '/lab/dashboard';
          break;
        case 'supplier':
          redirectPath = '/supplier/dashboard';
          break;
        case 'admin':
          redirectPath = '/admin/dashboard';
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

      const { role, organizationName, adminSetupKey } = req.body;
      
      if (!role || !['ecp', 'lab_tech', 'engineer', 'supplier', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      // Handle admin signup with key verification
      if (role === 'admin') {
        const expectedKey = process.env.ADMIN_SETUP_KEY;
        
        if (!expectedKey) {
          return res.status(500).json({ message: "Admin setup is not configured on this system" });
        }
        
        if (!adminSetupKey || adminSetupKey !== expectedKey) {
          return res.status(403).json({ message: "Invalid admin setup key" });
        }

        // Admin accounts are auto-approved
        const updatedUser = await storage.updateUser(userId, {
          role: 'admin',
          organizationName: organizationName || null,
          accountStatus: 'active'
        });

        // Initialize user roles
        await storage.addUserRole(userId, 'admin');

        return res.json(updatedUser);
      }

      // Update user with role and organization, set status to pending
      const updatedUser = await storage.updateUser(userId, {
        role,
        organizationName: organizationName || null,
        accountStatus: 'pending'
      });

      // Initialize user roles
      await storage.addUserRole(userId, role);

      res.json(updatedUser);
    } catch (error) {
      console.error("Error completing signup:", error);
      res.status(500).json({ message: "Failed to complete signup" });
    }
  });

  // Get user's available roles
  app.get('/api/auth/available-roles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roles = await storage.getUserAvailableRoles(userId);
      res.json({ roles });
    } catch (error) {
      console.error("Error fetching available roles:", error);
      res.status(500).json({ message: "Failed to fetch available roles" });
    }
  });

  // Add a role to user
  app.post('/api/auth/add-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Security check: only active users can add roles
      if (user.accountStatus !== 'active') {
        return res.status(403).json({ message: "Only active accounts can add additional roles" });
      }

      if (!role || !['ecp', 'lab_tech', 'engineer', 'supplier', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      // Only allow adding lab_tech/engineer or ecp roles
      if (!['ecp', 'lab_tech', 'engineer'].includes(role)) {
        return res.status(403).json({ message: "Cannot add this role type" });
      }

      // Check if user already has this role
      const existingRoles = await storage.getUserAvailableRoles(userId);
      if (existingRoles.includes(role)) {
        return res.status(400).json({ message: "Role already assigned to this user" });
      }

      await storage.addUserRole(userId, role);
      const updatedUser = await storage.getUserWithRoles(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error adding role:", error);
      res.status(500).json({ message: "Failed to add role" });
    }
  });

  // Switch active role
  app.post('/api/auth/switch-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;

      if (!role || !['ecp', 'lab_tech', 'engineer', 'supplier', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      const updatedUser = await storage.switchUserRole(userId, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error switching role:", error);
      if (error instanceof Error && error.message.includes("does not have access")) {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to switch role" });
      }
    }
  });

  // Email/Password Signup
  app.post('/api/auth/signup-email', async (req, res) => {
    try {
      const { email, password, firstName, lastName, role, organizationName, adminSetupKey } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Email, password, first name, last name, and role are required" });
      }

      if (!['ecp', 'lab_tech', 'engineer', 'supplier', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Handle admin signup with key verification
      let accountStatus: 'pending' | 'active' = 'pending';
      if (role === 'admin') {
        const expectedKey = process.env.ADMIN_SETUP_KEY;
        
        if (!expectedKey) {
          return res.status(500).json({ message: "Admin setup is not configured on this system" });
        }
        
        if (!adminSetupKey || adminSetupKey !== expectedKey) {
          return res.status(403).json({ message: "Invalid admin setup key" });
        }

        // Admin accounts are auto-approved
        accountStatus = 'active';
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const newUser = await storage.upsertUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        organizationName: organizationName || null,
        accountStatus,
      } as any);

      // Create session
      req.login({
        claims: {
          sub: newUser.id,
          id: newUser.id // Using id instead of email
        },
        local: true,
      }, (err) => {
        if (err) {
          console.error("Session creation error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        res.status(201).json({
          message: "Account created successfully",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            accountStatus: newUser.accountStatus,
          }
        });
      });
    } catch (error) {
      console.error("Email signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Email/Password Login
  app.post('/api/auth/login-email', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session error:", loginErr);
          return res.status(500).json({ message: "Failed to create session" });
        }

        // Fetch full user from database
        storage.getUser(user.claims.sub).then((dbUser) => {
          if (!dbUser) {
            return res.status(404).json({ message: "User not found" });
          }

          res.json({
            message: "Login successful",
            user: {
              id: dbUser.id,
              email: dbUser.email,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
              role: dbUser.role,
              accountStatus: dbUser.accountStatus,
            }
          });
        }).catch((dbErr) => {
          console.error("Database error:", dbErr);
          res.status(500).json({ message: "Failed to fetch user data" });
        });
      });
    })(req, res, next);
  });

  // Logout (works for both Replit and local auth)
  app.post('/api/auth/logout-local', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
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
      const { patientName, patientDOB, omaFileContent, omaFilename, ...orderData } = validation.data as any;
      
      const patient = await storage.createPatient({
        name: patientName,
        dateOfBirth: patientDOB || null,
        ecpId: userId,
      });

      // Parse OMA file if provided
      let omaParsedData = null;
      if (omaFileContent && isValidOMAFile(omaFileContent)) {
        omaParsedData = parseOMAFile(omaFileContent);
      }

      // Create order with patient ID and ECP ID
      const order = await storage.createOrder({
        ...orderData,
        patientId: patient.id,
        ecpId: userId,
        omaFileContent: omaFileContent || null,
        omaFilename: omaFilename || null,
        omaParsedData: omaParsedData as any,
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

  // OMA file upload endpoint
  app.patch('/api/orders/:id/oma', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can upload OMA files
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // ECPs can only upload to their own orders
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { fileContent, filename } = req.body;
      
      if (!fileContent || !filename) {
        return res.status(400).json({ message: "File content and filename are required" });
      }

      // Validate OMA file
      if (!isValidOMAFile(fileContent)) {
        return res.status(400).json({ message: "Invalid OMA file format" });
      }

      // Parse OMA file
      const parsedData = parseOMAFile(fileContent);

      // Update order with OMA file data
      const updatedOrder = await storage.updateOrder(req.params.id, {
        omaFileContent: fileContent,
        omaFilename: filename,
        omaParsedData: parsedData as any,
      });

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error uploading OMA file:", error);
      res.status(500).json({ message: "Failed to upload OMA file" });
    }
  });

  // Get OMA file endpoint
  app.get('/api/orders/:id/oma', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can access OMA files
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // ECPs can only access their own orders
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!order.omaFileContent) {
        return res.status(404).json({ message: "No OMA file attached to this order" });
      }

      // Return OMA file data
      res.json({
        filename: order.omaFilename,
        content: order.omaFileContent,
        parsedData: order.omaParsedData,
      });
    } catch (error) {
      console.error("Error fetching OMA file:", error);
      res.status(500).json({ message: "Failed to fetch OMA file" });
    }
  });

  // Delete OMA file endpoint
  app.delete('/api/orders/:id/oma', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only ECPs, lab techs, and engineers can delete OMA files
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer') {
        return res.status(403).json({ message: "Access denied" });
      }

      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // ECPs can only delete from their own orders
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Remove OMA file data
      const updatedOrder = await storage.updateOrder(req.params.id, {
        omaFileContent: null,
        omaFilename: null,
        omaParsedData: null,
      });

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ message: "OMA file deleted successfully" });
    } catch (error) {
      console.error("Error deleting OMA file:", error);
      res.status(500).json({ message: "Failed to delete OMA file" });
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
      if (role !== undefined && role !== null) {
        if (!['ecp', 'lab_tech', 'engineer', 'supplier', 'admin'].includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        updates.role = role;
      }
      if (accountStatus !== undefined && accountStatus !== null) {
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

  // ==================== Phase 7: ECP Clinical & Retail Module ====================
  
  // Patient routes
  app.get('/api/patients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view patients" });
      }

      const patients = await storage.getPatients(userId);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get('/api/patients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view patients" });
      }

      const patient = await storage.getPatient(req.params.id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      if (patient.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.patch('/api/patients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can update patients" });
      }

      const patient = await storage.getPatient(req.params.id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      if (patient.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedPatient = await storage.updatePatient(req.params.id, req.body);
      res.json(updatedPatient);
    } catch (error) {
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Eye Examination routes
  app.get('/api/examinations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view examinations" });
      }

      const examinations = await storage.getEyeExaminations(userId);
      res.json(examinations);
    } catch (error) {
      console.error("Error fetching examinations:", error);
      res.status(500).json({ message: "Failed to fetch examinations" });
    }
  });

  app.get('/api/examinations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view examinations" });
      }

      const examination = await storage.getEyeExamination(req.params.id);
      
      if (!examination) {
        return res.status(404).json({ message: "Examination not found" });
      }
      
      if (examination.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(examination);
    } catch (error) {
      console.error("Error fetching examination:", error);
      res.status(500).json({ message: "Failed to fetch examination" });
    }
  });

  app.get('/api/patients/:id/examinations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view examinations" });
      }

      const patient = await storage.getPatient(req.params.id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      if (patient.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const examinations = await storage.getPatientExaminations(req.params.id);
      res.json(examinations);
    } catch (error) {
      console.error("Error fetching patient examinations:", error);
      res.status(500).json({ message: "Failed to fetch patient examinations" });
    }
  });

  app.post('/api/examinations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create examinations" });
      }

      const validation = insertEyeExaminationSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message, errors: validation.error.issues });
      }

      const examination = await storage.createEyeExamination(validation.data, userId);
      res.status(201).json(examination);
    } catch (error) {
      console.error("Error creating examination:", error);
      res.status(500).json({ message: "Failed to create examination" });
    }
  });

  app.patch('/api/examinations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can update examinations" });
      }

      const examination = await storage.getEyeExamination(req.params.id);
      
      if (!examination) {
        return res.status(404).json({ message: "Examination not found" });
      }
      
      if (examination.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedExamination = await storage.updateEyeExamination(req.params.id, req.body);
      res.json(updatedExamination);
    } catch (error) {
      console.error("Error updating examination:", error);
      res.status(500).json({ message: "Failed to update examination" });
    }
  });

  app.post('/api/examinations/:id/finalize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can finalize examinations" });
      }

      const examination = await storage.getEyeExamination(req.params.id);
      
      if (!examination) {
        return res.status(404).json({ message: "Examination not found" });
      }
      
      if (examination.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (examination.status === 'finalized') {
        return res.status(400).json({ message: "Examination is already finalized" });
      }

      const finalizedExamination = await storage.finalizeExamination(req.params.id, userId);
      res.json(finalizedExamination);
    } catch (error) {
      console.error("Error finalizing examination:", error);
      res.status(500).json({ message: "Failed to finalize examination" });
    }
  });

  // Prescription routes
  app.get('/api/prescriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view prescriptions" });
      }

      const prescriptions = await storage.getPrescriptions(userId);
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.get('/api/prescriptions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view prescriptions" });
      }

      const prescription = await storage.getPrescription(req.params.id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (prescription.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(prescription);
    } catch (error) {
      console.error("Error fetching prescription:", error);
      res.status(500).json({ message: "Failed to fetch prescription" });
    }
  });

  app.post('/api/prescriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create prescriptions" });
      }

      const validation = insertPrescriptionSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message, errors: validation.error.issues });
      }

      const prescription = await storage.createPrescription(validation.data, userId);
      res.status(201).json(prescription);
    } catch (error) {
      console.error("Error creating prescription:", error);
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  app.post('/api/prescriptions/:id/sign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can sign prescriptions" });
      }

      const prescription = await storage.getPrescription(req.params.id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (prescription.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (prescription.isSigned) {
        return res.status(400).json({ message: "Prescription is already signed" });
      }

      const { signature } = req.body;
      if (!signature) {
        return res.status(400).json({ message: "Signature is required" });
      }

      const signedPrescription = await storage.signPrescription(req.params.id, userId, signature);
      res.json(signedPrescription);
    } catch (error) {
      console.error("Error signing prescription:", error);
      res.status(500).json({ message: "Failed to sign prescription" });
    }
  });

  app.get('/api/prescriptions/:id/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can download prescriptions" });
      }

      const prescription = await storage.getPrescription(req.params.id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (prescription.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { generatePrescriptionPDF } = await import('./pdfService');
      const pdfBuffer = await generatePrescriptionPDF(prescription);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescription.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating prescription PDF:", error);
      res.status(500).json({ message: "Failed to generate prescription PDF" });
    }
  });

  app.post('/api/prescriptions/:id/email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can email prescriptions" });
      }

      const prescription = await storage.getPrescription(req.params.id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (prescription.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!prescription.patient.email) {
        return res.status(400).json({ message: "Patient email not found" });
      }

      const { sendPrescriptionEmail } = await import('./emailService');
      await sendPrescriptionEmail(prescription);

      res.json({ message: "Prescription sent successfully" });
    } catch (error) {
      console.error("Error sending prescription:", error);
      res.status(500).json({ message: "Failed to send prescription" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view products" });
      }

      const products = await storage.getProducts(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view products" });
      }

      const product = await storage.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create products" });
      }

      const validation = insertProductSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message, errors: validation.error.issues });
      }

      const product = await storage.createProduct(validation.data, userId);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can update products" });
      }

      const product = await storage.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedProduct = await storage.updateProduct(req.params.id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can delete products" });
      }

      const product = await storage.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteProduct(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Invoice routes
  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view invoices" });
      }

      const invoices = await storage.getInvoices(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can view invoices" });
      }

      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can create invoices" });
      }

      const { lineItems, ...invoiceData } = req.body;

      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({ message: "Invoice must have at least one line item" });
      }

      const invoice = await storage.createInvoice({ ...invoiceData, lineItems }, userId);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.patch('/api/invoices/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can update invoice status" });
      }

      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = req.body;
      if (!status || !['draft', 'paid', 'void'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedInvoice = await storage.updateInvoiceStatus(req.params.id, status);
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });

  app.post('/api/invoices/:id/payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can record payments" });
      }

      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { amount } = req.body;
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const updatedInvoice = await storage.recordPayment(req.params.id, amount);
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error recording payment:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  // GitHub routes
  app.get('/api/github/user', async (req, res) => {
    try {
      const { getAuthenticatedUser } = await import('./github-helper');
      const user = await getAuthenticatedUser();
      res.json(user);
    } catch (error: any) {
      console.error("Error fetching GitHub user:", error);
      res.status(500).json({ message: error.message || "Failed to fetch GitHub user" });
    }
  });

  app.post('/api/github/create-repo', async (req, res) => {
    try {
      const { createGitHubRepo } = await import('./github-helper');
      const { name, isPrivate, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Repository name is required" });
      }

      const repo = await createGitHubRepo(name, isPrivate || false, description);
      res.json(repo);
    } catch (error: any) {
      console.error("Error creating GitHub repo:", error);
      res.status(500).json({ message: error.message || "Failed to create repository" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
