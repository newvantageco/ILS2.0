import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth as setupReplitAuth, isAuthenticated } from "./replitAuth";
import { hashPassword } from "./localAuth";
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
  insertPatientSchema,
  User
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { generatePurchaseOrderPDF } from "./pdfService";
import { sendPurchaseOrderEmail, sendShipmentNotificationEmail } from "./emailService";
import { pdfService, type OrderSheetData } from "./services/PDFService";
import { emailService } from "./services/EmailService";
import { z } from "zod";
import { parseOMAFile, isValidOMAFile } from "@shared/omaParser";
import { normalizeEmail } from "./utils/normalizeEmail";
import { registerAiEngineRoutes } from "./routes/aiEngine";
import { registerAiIntelligenceRoutes } from "./routes/aiIntelligence";
import { registerAiAssistantRoutes } from "./routes/aiAssistant";
import { registerMetricsRoutes } from "./routes/metrics";
import { registerPermissionRoutes } from "./routes/permissions";
import { websocketService } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment monitoring
  app.get('/health', (_req, res) => {
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  if (process.env.NODE_ENV !== 'development') {
    await setupReplitAuth(app);
  }

  // Register AI Engine routes
  registerAiEngineRoutes(app);
  
  // Register AI Intelligence routes (demand forecasting, anomaly detection, bottleneck prevention)
  registerAiIntelligenceRoutes(app);
  
  // Register AI Assistant routes (progressive learning assistant)
  registerAiAssistantRoutes(app);
  
  // Register Metrics Dashboard routes
  registerMetricsRoutes(app);
  
  // Register Permission Management routes
  registerPermissionRoutes(app);

  const FULL_PLAN = "full" as const;
  const FREE_ECP_PLAN = "free_ecp" as const;

  const isFreeEcpPlan = (user?: User | null) => user?.role === "ecp" && user.subscriptionPlan === FREE_ECP_PLAN;

  const denyFreePlanAccess = (user: User | undefined, res: Response, feature: string) => {
    if (isFreeEcpPlan(user)) {
      res.status(403).json({
        message: `Upgrade to the Full Experience plan to access ${feature}.`,
        requiredPlan: FULL_PLAN,
      });
      return true;
    }
    return false;
  };

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

  const { role, organizationName, adminSetupKey, subscriptionPlan } = req.body;
      
      if (!role || !['ecp', 'lab_tech', 'engineer', 'supplier', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      const normalizedPlan = typeof subscriptionPlan === 'string' ? subscriptionPlan : undefined;
      if (normalizedPlan && normalizedPlan !== FULL_PLAN && normalizedPlan !== FREE_ECP_PLAN) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }

      const allowedPlan = role === 'ecp' ? FREE_ECP_PLAN : FULL_PLAN;
      const chosenPlan = normalizedPlan || allowedPlan;

      if (chosenPlan !== allowedPlan) {
        return res.status(400).json({
          message: role === 'ecp'
            ? "ECP accounts start on the free plan. Upgrade after activation to unlock advanced modules."
            : "This role requires the Full Experience plan.",
          allowedPlan,
        });
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
          accountStatus: 'active',
          subscriptionPlan: chosenPlan,
        });

        // Initialize user roles
        await storage.addUserRole(userId, 'admin');

        return res.json(updatedUser);
      }

      // Update user with role and organization, set status to pending
      const updatedUser = await storage.updateUser(userId, {
        role,
        organizationName: organizationName || null,
        accountStatus: 'pending',
        subscriptionPlan: chosenPlan,
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
      const { email, password, firstName, lastName, role, organizationName, adminSetupKey, subscriptionPlan } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Email, password, first name, last name, and role are required" });
      }

      const normalizedEmail = normalizeEmail(email);

      if (!['ecp', 'lab_tech', 'engineer', 'supplier', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const normalizedPlan = typeof subscriptionPlan === 'string' ? subscriptionPlan : undefined;
      if (normalizedPlan && normalizedPlan !== FULL_PLAN && normalizedPlan !== FREE_ECP_PLAN) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }

      const allowedPlan = role === 'ecp' ? FREE_ECP_PLAN : FULL_PLAN;
      const chosenPlan = normalizedPlan || allowedPlan;

      if (chosenPlan !== allowedPlan) {
        return res.status(400).json({
          message: role === 'ecp'
            ? "ECP accounts start on the free plan. Upgrade after activation to unlock advanced modules."
            : "This role requires the Full Experience plan.",
          allowedPlan,
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(normalizedEmail);
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
        email: normalizedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        organizationName: organizationName || null,
        accountStatus,
        subscriptionPlan: chosenPlan,
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
            subscriptionPlan: newUser.subscriptionPlan,
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
    const { email, password } = req.body ?? {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    req.body.email = normalizeEmail(email);

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
              subscriptionPlan: dbUser.subscriptionPlan,
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

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
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
        companyId: user.companyId,
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
        companyId: user.companyId,
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
      if (user.role !== 'ecp' && user.role !== 'lab_tech' && user.role !== 'engineer' && user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status, search, limit, offset } = req.query;
      
      const filters: any = {
        status: status as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      // Add company filtering (admin can see all)
      if (user.role !== 'admin' && user.companyId) {
        filters.companyId = user.companyId;
      }

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

  // Generate order sheet PDF
  app.get('/api/orders/:id/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access - ECPs can view their own orders, lab techs and engineers can view all
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const orderData: OrderSheetData = {
        orderNumber: order.orderNumber || order.id.slice(-8).toUpperCase(),
        orderDate: order.orderDate.toISOString().split('T')[0],
        patientName: order.patient?.name || 'Unknown Patient',
        patientDOB: order.patient?.dateOfBirth || undefined,
        ecpName: order.ecp?.organizationName || user.organizationName || 'Unknown Provider',
        status: order.status,
        lensType: order.lensType,
        lensMaterial: order.lensMaterial,
        coating: order.coating,
        frameType: order.frameType || undefined,
        rightEye: {
          sphere: order.odSphere || undefined,
          cylinder: order.odCylinder || undefined,
          axis: order.odAxis || undefined,
          add: order.odAdd || undefined,
        },
        leftEye: {
          sphere: order.osSphere || undefined,
          cylinder: order.osCylinder || undefined,
          axis: order.osAxis || undefined,
          add: order.osAdd || undefined,
        },
        pd: order.pd || undefined,
        notes: order.notes || undefined,
        customerReferenceNumber: order.customerReferenceNumber || undefined,
      };

      const pdfBuffer = await pdfService.generateOrderSheetPDF(orderData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="order-${orderData.orderNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating order sheet PDF:", error);
      res.status(500).json({ message: "Failed to generate order sheet PDF" });
    }
  });

  // Email order sheet
  app.post('/api/orders/:id/email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access - ECPs can email their own orders
      if (user.role === 'ecp' && order.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get recipient email from request body or use patient email
      const { recipientEmail } = req.body;
      const toEmail = recipientEmail || order.patient?.email;

      if (!toEmail) {
        return res.status(400).json({ message: "No email address available for this order" });
      }

      const orderData: OrderSheetData = {
        orderNumber: order.orderNumber || order.id.slice(-8).toUpperCase(),
        orderDate: order.orderDate.toISOString().split('T')[0],
        patientName: order.patient?.name || 'Unknown Patient',
        patientDOB: order.patient?.dateOfBirth || undefined,
        ecpName: order.ecp?.organizationName || user.organizationName || 'Unknown Provider',
        status: order.status,
        lensType: order.lensType,
        lensMaterial: order.lensMaterial,
        coating: order.coating,
        frameType: order.frameType || undefined,
        rightEye: {
          sphere: order.odSphere || undefined,
          cylinder: order.odCylinder || undefined,
          axis: order.odAxis || undefined,
          add: order.odAdd || undefined,
        },
        leftEye: {
          sphere: order.osSphere || undefined,
          cylinder: order.osCylinder || undefined,
          axis: order.osAxis || undefined,
          add: order.osAdd || undefined,
        },
        pd: order.pd || undefined,
        notes: order.notes || undefined,
        customerReferenceNumber: order.customerReferenceNumber || undefined,
      };

      const pdfBuffer = await pdfService.generateOrderSheetPDF(orderData);

      await emailService.sendEmail({
        to: toEmail,
        subject: `Order Sheet #${orderData.orderNumber}`,
        text: `Your order sheet for ${order.patient?.name} is attached.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Order Sheet #${orderData.orderNumber}</h2>
            <p>Dear ${order.patient?.name || 'Valued Customer'},</p>
            <p>Please find attached the order sheet for your lens order.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
              <strong>Order Details:</strong><br/>
              Order Number: ${orderData.orderNumber}<br/>
              Order Date: ${orderData.orderDate}<br/>
              Status: ${orderData.status}<br/>
            </div>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              This email was sent by ${user.organizationName || 'Integrated Lens System'}
            </p>
          </div>
        `,
        attachments: [{
          filename: `order-${orderData.orderNumber}.pdf`,
          content: pdfBuffer,
        }],
      });

      res.json({ message: "Order sheet sent successfully via email" });
    } catch (error) {
      console.error("Error sending order sheet email:", error);
      res.status(500).json({ message: "Failed to send order sheet email" });
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

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (denyFreePlanAccess(user, res, "lab consultations")) {
        return;
      }

      const validation = insertConsultLogSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const log = await storage.createConsultLog({
        ...validation.data,
        companyId: user.companyId,
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

      if (user.role === 'ecp' && denyFreePlanAccess(user, res, "lab consultations")) {
        return;
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

      if (user.role === 'ecp' && denyFreePlanAccess(user, res, "lab consultations")) {
        return;
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

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
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
        companyId: user.companyId,
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
      pdfDoc.on('error', (error) => {
        console.error("PDF generation error:", error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Failed to generate PDF" });
        }
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to generate PDF" });
      }
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

  app.delete('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const targetUserId = req.params.id;

      // Prevent admin from deleting themselves
      if (userId === targetUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Get the target user to verify it exists and check status
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Optional: Only allow deleting suspended users
      // Uncomment the following to enforce this restriction
      // if (targetUser.accountStatus !== 'suspended') {
      //   return res.status(400).json({ message: "Can only delete suspended users" });
      // }

      const deleted = await storage.deleteUser(targetUserId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete user" });
      }

      res.json({ message: "User deleted successfully", id: targetUserId });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
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

      if (denyFreePlanAccess(user, res, "patient records")) {
        return;
      }

      const patients = await storage.getPatients(userId, user.companyId || undefined);
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

      if (denyFreePlanAccess(user, res, "patient records")) {
        return;
      }

      const patient = await storage.getPatient(req.params.id, user.companyId || undefined);
      
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

  app.post('/api/patients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can add patients" });
      }

      if (denyFreePlanAccess(user, res, "adding patients")) {
        return;
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User must be associated with a company" });
      }

      const patientData = {
        ...req.body,
        companyId: user.companyId,
        ecpId: userId,
      };

      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.patch('/api/patients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can update patients" });
      }

      if (denyFreePlanAccess(user, res, "patient records")) {
        return;
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

  // Shopify Integration routes
  app.get('/api/shopify/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can access Shopify integration" });
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User must be associated with a company" });
      }

      const { shopifyService } = await import("./services/ShopifyService");
      const status = await shopifyService.getSyncStatus(user.companyId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching Shopify status:", error);
      res.status(500).json({ message: "Failed to fetch Shopify status" });
    }
  });

  app.post('/api/shopify/verify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can configure Shopify" });
      }

      const { shopUrl, accessToken, apiVersion } = req.body;

      if (!shopUrl || !accessToken) {
        return res.status(400).json({ message: "Shop URL and access token are required" });
      }

      const { shopifyService } = await import("./services/ShopifyService");
      const result = await shopifyService.verifyConnection({
        shopUrl,
        accessToken,
        apiVersion: apiVersion || '2024-10',
      });

      res.json(result);
    } catch (error) {
      console.error("Error verifying Shopify connection:", error);
      res.status(500).json({ message: "Failed to verify connection" });
    }
  });

  app.post('/api/shopify/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can sync Shopify data" });
      }

      if (!user.companyId) {
        return res.status(400).json({ message: "User must be associated with a company" });
      }

      if (denyFreePlanAccess(user, res, "Shopify integration")) {
        return;
      }

      const { shopifyService } = await import("./services/ShopifyService");
      const result = await shopifyService.syncCustomers(user.companyId, user);
      
      res.json({
        message: "Sync completed",
        ...result,
      });
    } catch (error) {
      console.error("Error syncing Shopify customers:", error);
      res.status(500).json({ message: "Failed to sync customers" });
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

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
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

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
      }

      const examination = await storage.getEyeExamination(req.params.id, user.companyId || undefined);
      
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

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
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

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
      }

      const validation = insertEyeExaminationSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message, errors: validation.error.issues });
      }

      const examination = await storage.createEyeExamination({
        ...validation.data,
        companyId: user.companyId,
      }, userId);
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

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
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

      if (denyFreePlanAccess(user, res, "clinical examinations")) {
        return;
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

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
      }

      const prescriptions = await storage.getPatients(userId, user.companyId || undefined);
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

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
      }

      const prescription = await storage.getPrescription(req.params.id, user.companyId || undefined);
      
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

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
      }

      const validation = insertPrescriptionSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message, errors: validation.error.issues });
      }

      const prescription = await storage.createPrescription({
        ...validation.data,
        companyId: user.companyId,
      }, userId);
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

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
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

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
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

      if (denyFreePlanAccess(user, res, "digital prescriptions")) {
        return;
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

      if (denyFreePlanAccess(user, res, "practice inventory")) {
        return;
      }

      const products = await storage.getProducts(userId, user.companyId || undefined);
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

      if (denyFreePlanAccess(user, res, "practice inventory")) {
        return;
      }

      const product = await storage.getProduct(req.params.id, user.companyId || undefined);
      
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

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (denyFreePlanAccess(user, res, "practice inventory")) {
        return;
      }

      const validation = insertProductSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message, errors: validation.error.issues });
      }

      const product = await storage.createProduct({
        ...validation.data,
        companyId: user.companyId,
      }, userId);
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

      if (denyFreePlanAccess(user, res, "practice inventory")) {
        return;
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

      if (denyFreePlanAccess(user, res, "practice inventory")) {
        return;
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

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoices = await storage.getInvoices(userId, user.companyId || undefined);
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

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoice = await storage.getInvoice(req.params.id, user.companyId || undefined);
      
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

      if (!user.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const { lineItems, paymentMethod, ...invoiceData } = req.body;

      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({ message: "Invoice must have at least one line item" });
      }

      // If status is 'paid', set amountPaid to totalAmount and require payment method
      const invoicePayload: any = { 
        ...invoiceData, 
        companyId: user.companyId,
        lineItems 
      };
      
      if (invoiceData.status === 'paid') {
        if (!paymentMethod || !['cash', 'card', 'mixed'].includes(paymentMethod)) {
          return res.status(400).json({ message: "Valid payment method required for paid invoices" });
        }
        invoicePayload.paymentMethod = paymentMethod;
        invoicePayload.amountPaid = invoiceData.totalAmount;
      }

      const invoice = await storage.createInvoice(invoicePayload, userId);
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

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
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

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
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

  // Email and PDF routes for invoices
  app.get('/api/invoices/:id/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can download invoice PDFs" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { PDFService } = await import('./services/PDFService');
      const pdfService = new PDFService();
      
      // Calculate subtotal and tax from line items
      const subtotal = invoice.lineItems.reduce((sum: number, item: any) => 
        sum + parseFloat(item.totalPrice), 0
      );
      const total = parseFloat(invoice.totalAmount);
      const tax = total - subtotal;
      
      const pdfBuffer = await pdfService.generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customerName: invoice.patient?.name || 'Customer',
        customerEmail: invoice.patient?.email ? invoice.patient.email : undefined,
        items: invoice.lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          total: parseFloat(item.totalPrice)
        })),
        subtotal,
        tax,
        taxRate: subtotal > 0 ? (tax / subtotal) : 0,
        total,
        companyName: user.organizationName || 'Integrated Lens System',
        companyEmail: user.email || process.env.EMAIL_FROM,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      res.status(500).json({ message: "Failed to generate invoice PDF" });
    }
  });

  app.post('/api/invoices/:id/email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can email invoices" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if customer has email
      const customerEmail = invoice.patient?.email;
      if (!customerEmail) {
        return res.status(400).json({ message: "Customer email not found" });
      }

      const { EmailService } = await import('./services/EmailService');
      const { PDFService } = await import('./services/PDFService');
      const emailService = new EmailService();
      const pdfService = new PDFService();

      // Calculate subtotal and tax from line items
      const subtotal = invoice.lineItems.reduce((sum: number, item: any) => 
        sum + parseFloat(item.totalPrice), 0
      );
      const total = parseFloat(invoice.totalAmount);
      const tax = total - subtotal;

      // Generate PDF
      const pdfBuffer = await pdfService.generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        customerName: invoice.patient?.name || 'Customer',
        customerEmail: invoice.patient?.email ? invoice.patient.email : undefined,
        items: invoice.lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          total: parseFloat(item.totalPrice)
        })),
        subtotal,
        tax,
        taxRate: subtotal > 0 ? (tax / subtotal) : 0,
        total,
        companyName: user.organizationName || 'Integrated Lens System',
        companyEmail: user.email || process.env.EMAIL_FROM,
      });

      // Send email with PDF attachment
      await emailService.sendInvoiceEmail({
        recipientEmail: customerEmail,
        recipientName: invoice.patient?.name || 'Customer',
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        items: invoice.lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          total: parseFloat(item.totalPrice)
        })),
        subtotal,
        tax,
        total,
        companyName: user.organizationName || 'Integrated Lens System',
        companyEmail: user.email || process.env.EMAIL_FROM,
      }, pdfBuffer);

      res.json({ message: "Invoice sent successfully via email" });
    } catch (error) {
      console.error("Error sending invoice email:", error);
      res.status(500).json({ message: "Failed to send invoice email" });
    }
  });

  // Receipt PDF endpoint (for POS transactions)
  app.get('/api/invoices/:id/receipt', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can generate receipts" });
      }

      if (denyFreePlanAccess(user, res, "point of sale billing")) {
        return;
      }

      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (invoice.ecpId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { PDFService } = await import('./services/PDFService');
      const pdfService = new PDFService();
      
      const pdfBuffer = await pdfService.generateReceiptPDF({
        receiptNumber: invoice.invoiceNumber,
        date: invoice.invoiceDate.toISOString().split('T')[0],
        customerName: invoice.patient?.name || 'Customer',
        items: invoice.lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          price: parseFloat(item.unitPrice)
        })),
        total: parseFloat(invoice.totalAmount),
        paymentMethod: invoice.paymentMethod || 'cash',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating receipt PDF:", error);
      res.status(500).json({ message: "Failed to generate receipt PDF" });
    }
  });

  // Order confirmation email route
  app.post('/api/orders/:id/send-confirmation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'lab_tech' && user.role !== 'engineer')) {
        return res.status(403).json({ message: "Only lab staff can send order confirmations" });
      }

      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get ECP user details
      const ecp = await storage.getUser(order.ecpId);
      if (!ecp || !ecp.email) {
        return res.status(400).json({ message: "ECP email not found" });
      }

      const { EmailService } = await import('./services/EmailService');
      const emailService = new EmailService();

      // Build order details HTML
      const orderDetails = `
        <p><strong>Patient:</strong> ${order.patient.name}</p>
        <p><strong>Order Date:</strong> ${order.orderDate.toISOString().split('T')[0]}</p>
        <p><strong>Lens Type:</strong> ${order.lensType}</p>
        <p><strong>Lens Material:</strong> ${order.lensMaterial}</p>
        <p><strong>Coating:</strong> ${order.coating}</p>
        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
        <p><strong>Status:</strong> ${order.status}</p>
      `;

      await emailService.sendOrderConfirmation(
        ecp.email,
        `${ecp.firstName || ''} ${ecp.lastName || ''}`.trim() || 'Customer',
        order.orderNumber,
        orderDetails
      );

      res.json({ message: "Order confirmation sent successfully" });
    } catch (error) {
      console.error("Error sending order confirmation:", error);
      res.status(500).json({ message: "Failed to send order confirmation" });
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

  // LIMS Webhook routes (Flow 2: Status updates from LIMS)
  app.post('/api/webhooks/lims-status', async (req, res) => {
    try {
      const { WebhookService } = await import('./services/WebhookService');
      
      const webhookSecret = process.env.LIMS_WEBHOOK_SECRET || 'default-secret';
      const webhookService = new WebhookService(storage, {
        secret: webhookSecret,
      });

      // Verify webhook signature
      const signature = req.headers['x-lims-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!webhookService.verifyWebhookSignature(payload, signature)) {
        console.warn('Invalid webhook signature');
        return res.status(401).json({ message: 'Invalid signature' });
      }

      // Process the status update
      const success = await webhookService.handleStatusUpdate(req.body);

      if (success) {
        res.json({ message: 'Webhook processed successfully' });
      } else {
        res.status(400).json({ message: 'Failed to process webhook' });
      }
    } catch (error) {
      console.error('Error processing LIMS webhook:', error);
      res.status(500).json({ 
        message: 'Failed to process webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============================================================
  // PREDICTIVE NON-ADAPT ALERT API ENDPOINTS (Feature 1)
  // ============================================================

  // Get active prescription alerts for ECP
  app.get('/api/alerts/prescriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can access prescription alerts" });
      }

      const { PredictiveNonAdaptService } = await import('./services/PredictiveNonAdaptService');
      const alertService = PredictiveNonAdaptService.getInstance();

      const alerts = await alertService.getActiveAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching prescription alerts:', error);
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });

  // Dismiss a prescription alert
  app.post('/api/alerts/prescriptions/:id/dismiss', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can manage alerts" });
      }

      const { actionTaken } = req.body;

      const { PredictiveNonAdaptService } = await import('./services/PredictiveNonAdaptService');
      const alertService = PredictiveNonAdaptService.getInstance();

      await alertService.dismissAlert(req.params.id, userId, actionTaken);
      res.json({ message: 'Alert dismissed successfully' });
    } catch (error) {
      console.error('Error dismissing alert:', error);
      res.status(500).json({ message: 'Failed to dismiss alert' });
    }
  });

  // Analyze order for non-adapt risk (called during order creation)
  app.post('/api/orders/analyze-risk', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can analyze orders" });
      }

      const {
        lensType,
        lensMaterial,
        frameType,
        coating,
        odSphere,
        odCylinder,
        odAxis,
        odAdd,
        osSphere,
        osCylinder,
        osAxis,
        osAdd,
        pd,
      } = req.body;

      if (!lensType || !lensMaterial || !odSphere || !osSphere) {
        return res.status(400).json({ message: 'Missing required prescription fields' });
      }

      const { PredictiveNonAdaptService } = await import('./services/PredictiveNonAdaptService');
      const alertService = PredictiveNonAdaptService.getInstance();

      const analysis = await alertService.analyzeOrderForRisk({
        orderId: 'temp-' + Date.now(),
        ecpId: userId,
        lensType,
        lensMaterial,
        frameType,
        coating,
        rxProfile: {
          odSphere: parseFloat(odSphere),
          odCylinder: parseFloat(odCylinder || 0),
          odAxis: parseFloat(odAxis || 0),
          odAdd: parseFloat(odAdd || 0),
          osSphere: parseFloat(osSphere),
          osCylinder: parseFloat(osCylinder || 0),
          osAxis: parseFloat(osAxis || 0),
          osAdd: parseFloat(osAdd || 0),
          pd: parseFloat(pd || 62),
        },
      });

      res.json({ analysis });
    } catch (error) {
      console.error('Error analyzing order risk:', error);
      res.status(500).json({ message: 'Failed to analyze order risk' });
    }
  });

  // ============================================================
  // INTELLIGENT PURCHASING ASSISTANT API ENDPOINTS (Feature 2)
  // ============================================================

  // Get active BI recommendations for ECP
  app.get('/api/recommendations/bi', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can access BI recommendations" });
      }

      const { IntelligentPurchasingAssistantService } = await import('./services/IntelligentPurchasingAssistantService');
      const biService = IntelligentPurchasingAssistantService.getInstance();

      const recommendations = await biService.getActiveRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching BI recommendations:', error);
      res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
  });

  // Trigger BI analysis for an ECP
  app.post('/api/recommendations/bi/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can trigger BI analysis" });
      }

      const { IntelligentPurchasingAssistantService } = await import('./services/IntelligentPurchasingAssistantService');
      const biService = IntelligentPurchasingAssistantService.getInstance();

      const recommendations = await biService.analyzeEcpForRecommendations(userId);

      // Create recommendations in database
      const created = [];
      for (const rec of recommendations) {
        const createdRec = await biService.createRecommendation(userId, rec);
        created.push(createdRec);
      }

      res.status(201).json({
        message: `Created ${created.length} new recommendations`,
        recommendations: created,
      });
    } catch (error) {
      console.error('Error running BI analysis:', error);
      res.status(500).json({ message: 'Failed to run BI analysis' });
    }
  });

  // Acknowledge a BI recommendation
  app.post('/api/recommendations/bi/:id/acknowledge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can acknowledge recommendations" });
      }

      const { IntelligentPurchasingAssistantService } = await import('./services/IntelligentPurchasingAssistantService');
      const biService = IntelligentPurchasingAssistantService.getInstance();

      await biService.acknowledgeRecommendation(req.params.id, userId);
      res.json({ message: 'Recommendation acknowledged' });
    } catch (error) {
      console.error('Error acknowledging recommendation:', error);
      res.status(500).json({ message: 'Failed to acknowledge recommendation' });
    }
  });

  // Start implementation of a BI recommendation
  app.post('/api/recommendations/bi/:id/start-implementation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can start implementations" });
      }

      const { IntelligentPurchasingAssistantService } = await import('./services/IntelligentPurchasingAssistantService');
      const biService = IntelligentPurchasingAssistantService.getInstance();

      await biService.startImplementation(req.params.id);
      res.json({ message: 'Implementation started' });
    } catch (error) {
      console.error('Error starting implementation:', error);
      res.status(500).json({ message: 'Failed to start implementation' });
    }
  });

  // Complete implementation of a BI recommendation
  app.post('/api/recommendations/bi/:id/complete-implementation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ecp') {
        return res.status(403).json({ message: "Only ECPs can complete implementations" });
      }

      const { IntelligentPurchasingAssistantService } = await import('./services/IntelligentPurchasingAssistantService');
      const biService = IntelligentPurchasingAssistantService.getInstance();

      await biService.completeImplementation(req.params.id);
      res.json({ message: 'Implementation completed' });
    } catch (error) {
      console.error('Error completing implementation:', error);
      res.status(500).json({ message: 'Failed to complete implementation' });
    }
  });

  // ============================================
  // ADMIN COMPANY MANAGEMENT ENDPOINTS
  // ============================================

  // Get all companies (admin only)
  app.get('/api/admin/companies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allUsers = await storage.getAllUsers();
      // Filter to get company accounts (non-admin users)
      const companies = allUsers
        .filter(u => u.role !== 'admin' && u.organizationName)
        .map(u => ({
          id: u.id,
          name: u.organizationName || `${u.firstName} ${u.lastName}`,
          email: u.email || '',
          role: u.role || 'ecp',
          accountStatus: u.accountStatus || 'pending',
          createdAt: u.createdAt || new Date().toISOString(),
        }));

      res.json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ message: 'Failed to fetch companies' });
    }
  });

  // Create new company with auto-generated credentials (admin only)
  app.post('/api/admin/companies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const {
        companyName,
        email,
        firstName,
        lastName,
        role,
        contactPhone,
        address
      } = req.body;

      // Validate required fields
      if (!companyName || !email || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Generate secure random password
      const crypto = await import('crypto');
      const password = crypto.randomBytes(12).toString('base64').slice(0, 16);
      const hashedPassword = await hashPassword(password);

      // Create company user
      const newUser = await storage.upsertUser({
        id: crypto.randomUUID(),
        email: normalizeEmail(email),
        password: hashedPassword,
        firstName,
        lastName,
        organizationName: companyName,
        role,
        contactPhone,
        address: address ? { street: address } : undefined,
        accountStatus: 'active',
        subscriptionPlan: 'full',
        isActive: true,
        isVerified: true,
      });

      // Send welcome email with credentials
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .credentials-box {
              background-color: white;
              padding: 25px;
              border-radius: 8px;
              margin: 25px 0;
              border-left: 4px solid #667eea;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .credential-item {
              margin: 15px 0;
              padding: 12px;
              background-color: #f3f4f6;
              border-radius: 6px;
            }
            .credential-label {
              font-weight: bold;
              color: #4b5563;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .credential-value {
              font-size: 16px;
              color: #111827;
              font-family: 'Courier New', monospace;
              margin-top: 5px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .warning-box {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 0.9em;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to Integrated Lens System</h1>
            <p>Your account has been created successfully</p>
          </div>
          <div class="content">
            <p>Dear ${firstName} ${lastName},</p>
            <p>Your company account for <strong>${companyName}</strong> has been created in the Integrated Lens System.</p>
            
            <div class="credentials-box">
              <h3 style="margin-top: 0; color: #667eea;">🔐 Your Login Credentials</h3>
              
              <div class="credential-item">
                <div class="credential-label">Email Address</div>
                <div class="credential-value">${email}</div>
              </div>
              
              <div class="credential-item">
                <div class="credential-label">Password</div>
                <div class="credential-value">${password}</div>
              </div>
              
              <div class="credential-item">
                <div class="credential-label">Role</div>
                <div class="credential-value">${role.toUpperCase()}</div>
              </div>
            </div>

            <div class="warning-box">
              <strong>⚠️ Security Notice:</strong> Please change your password after your first login for security purposes.
            </div>

            <div style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" class="button">
                Log In to Your Account
              </a>
            </div>

            <h3 style="color: #374151;">📋 Next Steps:</h3>
            <ol style="color: #6b7280;">
              <li>Click the button above to access the login page</li>
              <li>Enter your email and temporary password</li>
              <li>Complete your profile setup</li>
              <li>Start managing your optical business efficiently</li>
            </ol>

            <p style="color: #6b7280; margin-top: 30px;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>

            <div class="footer">
              <p><strong>Integrated Lens System</strong></p>
              <p>The complete solution for optical practice management</p>
              <p style="font-size: 0.85em; color: #9ca3af;">
                This email contains sensitive information. Please keep it secure.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail({
        to: email,
        subject: `Welcome to Integrated Lens System - Your Login Credentials`,
        html: emailHtml,
      });

      console.log(`Company created: ${companyName} with user ${email}`);

      res.json({
        message: 'Company created successfully',
        userId: newUser.id,
        email: newUser.email,
        password, // Return password for admin to show in dialog
      });
    } catch (error) {
      console.error('Error creating company:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to create company' 
      });
    }
  });

  // Resend credentials to company (admin only)
  app.post('/api/admin/companies/:id/resend-credentials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const companyUser = await storage.getUser(req.params.id);
      if (!companyUser) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Generate new password
      const crypto = await import('crypto');
      const newPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await storage.updateUser(req.params.id, { password: hashedPassword });

      // Send email with new credentials
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .credentials-box {
              background-color: white;
              padding: 25px;
              border-radius: 8px;
              margin: 25px 0;
              border-left: 4px solid #667eea;
            }
            .credential-item {
              margin: 15px 0;
              padding: 12px;
              background-color: #f3f4f6;
              border-radius: 6px;
            }
            .credential-value {
              font-size: 16px;
              color: #111827;
              font-family: 'Courier New', monospace;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔑 Password Reset - Integrated Lens System</h1>
          </div>
          <div class="content">
            <p>Dear ${companyUser.firstName} ${companyUser.lastName},</p>
            <p>Your login credentials have been reset. Here are your new login details:</p>
            
            <div class="credentials-box">
              <div class="credential-item">
                <strong>Email:</strong>
                <div class="credential-value">${companyUser.email}</div>
              </div>
              <div class="credential-item">
                <strong>New Password:</strong>
                <div class="credential-value">${newPassword}</div>
              </div>
            </div>

            <p style="color: #dc2626; font-weight: bold;">
              ⚠️ Please change this password after logging in for security.
            </p>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail({
        to: companyUser.email!,
        subject: 'Your New Login Credentials - Integrated Lens System',
        html: emailHtml,
      });

      res.json({ message: 'Credentials sent successfully' });
    } catch (error) {
      console.error('Error resending credentials:', error);
      res.status(500).json({ message: 'Failed to resend credentials' });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time updates
  websocketService.initialize(httpServer);
  
  return httpServer;
}
