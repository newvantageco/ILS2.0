/**
 * Company Marketplace Routes
 * 
 * REST API for B2B marketplace functionality
 * Part of Chunk 6: Company Marketplace and Network Effects
 */

import type { Express } from "express";
import { db } from "../../db";
import { 
  companies, 
  companyProfiles, 
  companyRelationships, 
  connectionRequests, 
  users 
} from "@shared/schema";
import { eq, and, desc, or, like, sql, ne } from "drizzle-orm";
import { createLogger } from "../utils/logger";

const logger = createLogger("MarketplaceRoutes");

/**
 * Helper function to get user info from session
 */
async function getUserInfo(req: any): Promise<{ userId: string; companyId: string } | null> {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!userId) {
      return null;
    }

    if (req.user.companyId) {
      return { userId, companyId: req.user.companyId };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        companyId: true,
      },
    });

    if (!user || !user.companyId) {
      return null;
    }

    req.user.id = userId;
    req.user.companyId = user.companyId;

    return { userId, companyId: user.companyId };
  } catch (error) {
    logger.error("Failed to get user info", error as Error);
    return null;
  }
}

/**
 * Helper to check if company type can connect to target type
 */
function canConnect(fromType: string, toType: string): boolean {
  const allowedConnections: Record<string, string[]> = {
    'ecp': ['lab', 'supplier'],
    'lab': ['ecp', 'supplier', 'lab'],
    'supplier': ['ecp', 'lab'],
    'hybrid': ['ecp', 'lab', 'supplier', 'hybrid'],
  };
  
  return allowedConnections[fromType]?.includes(toType) || false;
}

/**
 * Helper to determine relationship type from company types
 */
function getRelationshipType(fromType: string, toType: string): "ecp_to_lab" | "lab_to_supplier" | "ecp_to_supplier" | "lab_to_lab" {
  if ((fromType === 'ecp' && toType === 'lab') || (fromType === 'lab' && toType === 'ecp')) {
    return 'ecp_to_lab';
  }
  if ((fromType === 'lab' && toType === 'supplier') || (fromType === 'supplier' && toType === 'lab')) {
    return 'lab_to_supplier';
  }
  if ((fromType === 'ecp' && toType === 'supplier') || (fromType === 'supplier' && toType === 'ecp')) {
    return 'ecp_to_supplier';
  }
  if (fromType === 'lab' && toType === 'lab') {
    return 'lab_to_lab';
  }
  return 'ecp_to_lab'; // default
}

export function registerMarketplaceRoutes(app: Express) {
  
  /**
   * GET /api/marketplace/search
   * Search companies in marketplace with filters
   */
  app.get("/api/marketplace/search", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const { 
        companyType, 
        search, 
        limit = 50,
        offset = 0 
      } = req.query;

      logger.info("Searching marketplace", { companyId, companyType, search });

      // Get current company info
      const currentCompany = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
      });

      if (!currentCompany) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Build search conditions
      const conditions: any[] = [
        ne(companies.id, companyId), // Exclude self
        eq(companies.status, 'active'), // Only active companies
      ];

      if (companyType) {
        conditions.push(eq(companies.type, companyType as any));
      }

      if (search) {
        conditions.push(
          like(companies.name, `%${search}%`)
        );
      }

      // Query companies
      const foundCompanies = await db.query.companies.findMany({
        where: and(...conditions),
        limit: Number(limit),
        offset: Number(offset),
        orderBy: [desc(companies.createdAt)],
      });

      // Get profiles and connection status for each
      const results = await Promise.all(
        foundCompanies.map(async (company) => {
          // Get profile if exists
          const profile = await db.query.companyProfiles.findFirst({
            where: eq(companyProfiles.companyId, company.id),
          });

          // Check if already connected (bidirectional check)
          const existingRelationship = await db.query.companyRelationships.findFirst({
            where: or(
              and(
                eq(companyRelationships.companyAId, companyId),
                eq(companyRelationships.companyBId, company.id)
              ),
              and(
                eq(companyRelationships.companyBId, companyId),
                eq(companyRelationships.companyAId, company.id)
              )
            ),
          });

          // Check if pending request exists (bidirectional)
          const pendingRequest = await db.query.connectionRequests.findFirst({
            where: and(
              or(
                and(
                  eq(connectionRequests.fromCompanyId, companyId),
                  eq(connectionRequests.toCompanyId, company.id)
                ),
                and(
                  eq(connectionRequests.toCompanyId, companyId),
                  eq(connectionRequests.fromCompanyId, company.id)
                )
              ),
              eq(connectionRequests.status, 'pending')
            ),
          });

          return {
            ...company,
            profile,
            connectionStatus: existingRelationship ? existingRelationship.status : 
                              pendingRequest ? 'pending_request' : 'not_connected',
            canConnect: canConnect(currentCompany.type, company.type),
          };
        })
      );

      res.json({
        companies: results,
        total: results.length,
        limit: Number(limit),
        offset: Number(offset),
      });

    } catch (error) {
      logger.error("Failed to search marketplace", error as Error);
      res.status(500).json({ message: "Failed to search marketplace" });
    }
  });

  /**
   * GET /api/marketplace/companies/:id
   * Get detailed company profile
   */
  app.get("/api/marketplace/companies/:id", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const targetCompanyId = req.params.id;

      logger.info("Getting company profile", { companyId, targetCompanyId });

      // Get company
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, targetCompanyId),
      });

      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Get profile
      const profile = await db.query.companyProfiles.findFirst({
        where: eq(companyProfiles.companyId, targetCompanyId),
      });

      // Check connection status (bidirectional)
      const existingRelationship = await db.query.companyRelationships.findFirst({
        where: or(
          and(
            eq(companyRelationships.companyAId, companyId),
            eq(companyRelationships.companyBId, targetCompanyId)
          ),
          and(
            eq(companyRelationships.companyBId, companyId),
            eq(companyRelationships.companyAId, targetCompanyId)
          )
        ),
      });

      // Check pending request (bidirectional)
      const pendingRequest = await db.query.connectionRequests.findFirst({
        where: and(
          or(
            and(
              eq(connectionRequests.fromCompanyId, companyId),
              eq(connectionRequests.toCompanyId, targetCompanyId)
            ),
            and(
              eq(connectionRequests.toCompanyId, companyId),
              eq(connectionRequests.fromCompanyId, targetCompanyId)
            )
          ),
          eq(connectionRequests.status, 'pending')
        ),
      });

      // Get current company for connection rules
      const currentCompany = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
      });

      res.json({
        ...company,
        profile,
        connectionStatus: existingRelationship ? existingRelationship.status : 
                          pendingRequest ? 'pending_request' : 'not_connected',
        canConnect: currentCompany ? canConnect(currentCompany.type, company.type) : false,
        isOwnCompany: companyId === targetCompanyId,
      });

    } catch (error) {
      logger.error("Failed to get company profile", error as Error);
      res.status(500).json({ message: "Failed to get company profile" });
    }
  });

  /**
   * GET /api/marketplace/my-profile
   * Get current company's marketplace profile
   */
  app.get("/api/marketplace/my-profile", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;

      logger.info("Getting my profile", { companyId });

      // Get company
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
      });

      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Get profile
      const profile = await db.query.companyProfiles.findFirst({
        where: eq(companyProfiles.companyId, companyId),
      });

      res.json({
        ...company,
        profile,
      });

    } catch (error) {
      logger.error("Failed to get my profile", error as Error);
      res.status(500).json({ message: "Failed to get my profile" });
    }
  });

  /**
   * PUT /api/marketplace/my-profile
   * Update current company's marketplace profile
   */
  app.put("/api/marketplace/my-profile", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const profileData = req.body;

      logger.info("Updating my profile", { companyId });

      // Check if profile exists
      const existingProfile = await db.query.companyProfiles.findFirst({
        where: eq(companyProfiles.companyId, companyId),
      });

      if (existingProfile) {
        // Update existing profile
        const [updated] = await db.update(companyProfiles)
          .set({
            ...profileData,
            updatedAt: new Date(),
          })
          .where(eq(companyProfiles.companyId, companyId))
          .returning();

        res.json(updated);
      } else {
        // Create new profile
        const [created] = await db.insert(companyProfiles)
          .values({
            companyId,
            ...profileData,
          })
          .returning();

        res.json(created);
      }

    } catch (error) {
      logger.error("Failed to update profile", error as Error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  /**
   * POST /api/marketplace/connections/request
   * Request connection with another company
   */
  app.post("/api/marketplace/connections/request", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId, userId } = userInfo;
      const { targetCompanyId, message, proposedTerms } = req.body;

      logger.info("Requesting connection", { companyId, targetCompanyId });

      if (companyId === targetCompanyId) {
        return res.status(400).json({ message: "Cannot connect to yourself" });
      }

      // Get both companies
      const [requestingCompany, targetCompany] = await Promise.all([
        db.query.companies.findFirst({ where: eq(companies.id, companyId) }),
        db.query.companies.findFirst({ where: eq(companies.id, targetCompanyId) }),
      ]);

      if (!requestingCompany || !targetCompany) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Check if connection is allowed
      if (!canConnect(requestingCompany.type, targetCompany.type)) {
        return res.status(400).json({ 
          message: `${requestingCompany.type} cannot connect to ${targetCompany.type}` 
        });
      }

      // Check if already connected (bidirectional)
      const existingRelationship = await db.query.companyRelationships.findFirst({
        where: or(
          and(
            eq(companyRelationships.companyAId, companyId),
            eq(companyRelationships.companyBId, targetCompanyId)
          ),
          and(
            eq(companyRelationships.companyBId, companyId),
            eq(companyRelationships.companyAId, targetCompanyId)
          )
        ),
      });

      if (existingRelationship) {
        return res.status(400).json({ message: "Already connected or relationship exists" });
      }

      // Check if pending request exists (bidirectional)
      const existingRequest = await db.query.connectionRequests.findFirst({
        where: and(
          or(
            and(
              eq(connectionRequests.fromCompanyId, companyId),
              eq(connectionRequests.toCompanyId, targetCompanyId)
            ),
            and(
              eq(connectionRequests.toCompanyId, companyId),
              eq(connectionRequests.fromCompanyId, targetCompanyId)
            )
          ),
          eq(connectionRequests.status, 'pending')
        ),
      });

      if (existingRequest) {
        return res.status(400).json({ message: "Connection request already pending" });
      }

      // Determine relationship type
      const relationshipType = getRelationshipType(
        requestingCompany.type, 
        targetCompany.type
      );

      // Create connection request
      const [request] = await db.insert(connectionRequests)
        .values({
          fromCompanyId: companyId,
          toCompanyId: targetCompanyId,
          fromUserId: userId,
          requestedRelationshipType: relationshipType,
          message: message || null,
          proposedTerms: proposedTerms || null,
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        })
        .returning();

      res.json(request);

    } catch (error) {
      logger.error("Failed to request connection", error as Error);
      res.status(500).json({ message: "Failed to request connection" });
    }
  });

  /**
   * GET /api/marketplace/connections/requests
   * Get incoming and outgoing connection requests
   */
  app.get("/api/marketplace/connections/requests", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const { type = 'all' } = req.query;

      logger.info("Getting connection requests", { companyId, type });

      const conditions: any[] = [eq(connectionRequests.status, 'pending')];

      if (type === 'incoming') {
        conditions.push(eq(connectionRequests.toCompanyId, companyId));
      } else if (type === 'outgoing') {
        conditions.push(eq(connectionRequests.fromCompanyId, companyId));
      } else {
        conditions.push(
          or(
            eq(connectionRequests.toCompanyId, companyId),
            eq(connectionRequests.fromCompanyId, companyId)
          )
        );
      }

      const requests = await db.query.connectionRequests.findMany({
        where: and(...conditions),
        orderBy: [desc(connectionRequests.createdAt)],
      });

      // Enrich with company details
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const [fromCompany, toCompany] = await Promise.all([
            db.query.companies.findFirst({
              where: eq(companies.id, request.fromCompanyId),
            }),
            db.query.companies.findFirst({
              where: eq(companies.id, request.toCompanyId),
            }),
          ]);

          return {
            ...request,
            fromCompany,
            toCompany,
            direction: request.toCompanyId === companyId ? 'incoming' : 'outgoing',
          };
        })
      );

      res.json(enrichedRequests);

    } catch (error) {
      logger.error("Failed to get connection requests", error as Error);
      res.status(500).json({ message: "Failed to get connection requests" });
    }
  });

  /**
   * PUT /api/marketplace/connections/requests/:id/approve
   * Approve a connection request
   */
  app.put("/api/marketplace/connections/requests/:id/approve", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId, userId } = userInfo;
      const requestId = req.params.id;
      const { responseMessage, agreedTerms } = req.body;

      logger.info("Approving connection request", { companyId, requestId });

      // Get request
      const request = await db.query.connectionRequests.findFirst({
        where: eq(connectionRequests.id, requestId),
      });

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Verify user is the target
      if (request.toCompanyId !== companyId) {
        return res.status(403).json({ message: "Not authorized to approve this request" });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ message: "Request is not pending" });
      }

      // Check if expired
      if (request.expiresAt && new Date() > request.expiresAt) {
        await db.update(connectionRequests)
          .set({ status: 'rejected' })
          .where(eq(connectionRequests.id, requestId));
        return res.status(400).json({ message: "Request has expired" });
      }

      // Update request status
      const [updatedRequest] = await db.update(connectionRequests)
        .set({
          status: 'active',
          responseMessage: responseMessage || null,
          reviewedAt: new Date(),
          reviewedByUserId: userId,
        })
        .where(eq(connectionRequests.id, requestId))
        .returning();

      // Create bidirectional relationship
      const [relationship] = await db.insert(companyRelationships)
        .values({
          companyAId: request.fromCompanyId,
          companyBId: request.toCompanyId,
          relationshipType: request.requestedRelationshipType,
          status: 'active',
          initiatedByCompanyId: request.fromCompanyId,
          connectionTerms: agreedTerms || request.proposedTerms || null,
          connectionMessage: request.message,
          requestedAt: request.createdAt,
          approvedAt: new Date(),
          reviewedByUserId: userId,
        })
        .returning();

      // Update connection counts in profiles (create profiles if they don't exist)
      await Promise.all([
        db.execute(sql`
          INSERT INTO company_profiles (company_id, connections_count)
          VALUES (${request.fromCompanyId}, 1)
          ON CONFLICT (company_id) 
          DO UPDATE SET connections_count = COALESCE(company_profiles.connections_count, 0) + 1
        `),
        db.execute(sql`
          INSERT INTO company_profiles (company_id, connections_count)
          VALUES (${request.toCompanyId}, 1)
          ON CONFLICT (company_id) 
          DO UPDATE SET connections_count = COALESCE(company_profiles.connections_count, 0) + 1
        `),
      ]);

      res.json({
        request: updatedRequest,
        relationship,
      });

    } catch (error) {
      logger.error("Failed to approve connection request", error as Error);
      res.status(500).json({ message: "Failed to approve connection request" });
    }
  });

  /**
   * PUT /api/marketplace/connections/requests/:id/reject
   * Reject a connection request
   */
  app.put("/api/marketplace/connections/requests/:id/reject", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId, userId } = userInfo;
      const requestId = req.params.id;
      const { responseMessage } = req.body;

      logger.info("Rejecting connection request", { companyId, requestId });

      // Get request
      const request = await db.query.connectionRequests.findFirst({
        where: eq(connectionRequests.id, requestId),
      });

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Verify user is the target
      if (request.toCompanyId !== companyId) {
        return res.status(403).json({ message: "Not authorized to reject this request" });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ message: "Request is not pending" });
      }

      // Update request status
      const [updatedRequest] = await db.update(connectionRequests)
        .set({
          status: 'rejected',
          responseMessage: responseMessage || null,
          reviewedAt: new Date(),
          reviewedByUserId: userId,
        })
        .where(eq(connectionRequests.id, requestId))
        .returning();

      res.json(updatedRequest);

    } catch (error) {
      logger.error("Failed to reject connection request", error as Error);
      res.status(500).json({ message: "Failed to reject connection request" });
    }
  });

  /**
   * DELETE /api/marketplace/connections/requests/:id
   * Cancel a connection request (by requester)
   */
  app.delete("/api/marketplace/connections/requests/:id", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const requestId = req.params.id;

      logger.info("Canceling connection request", { companyId, requestId });

      // Get request
      const request = await db.query.connectionRequests.findFirst({
        where: eq(connectionRequests.id, requestId),
      });

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Verify user is the requester
      if (request.fromCompanyId !== companyId) {
        return res.status(403).json({ message: "Not authorized to cancel this request" });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ message: "Request is not pending" });
      }

      // Update request status
      const [updatedRequest] = await db.update(connectionRequests)
        .set({
          status: 'rejected',
        })
        .where(eq(connectionRequests.id, requestId))
        .returning();

      res.json(updatedRequest);

    } catch (error) {
      logger.error("Failed to cancel connection request", error as Error);
      res.status(500).json({ message: "Failed to cancel connection request" });
    }
  });

  /**
   * GET /api/marketplace/connections
   * Get active connections
   */
  app.get("/api/marketplace/connections", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const { relationshipType, status = 'active' } = req.query;

      logger.info("Getting connections", { companyId, relationshipType, status });

      // Build conditions for bidirectional relationships
      const conditions: any[] = [
        or(
          eq(companyRelationships.companyAId, companyId),
          eq(companyRelationships.companyBId, companyId)
        ),
      ];

      if (status) {
        conditions.push(eq(companyRelationships.status, status as any));
      }

      if (relationshipType) {
        conditions.push(eq(companyRelationships.relationshipType, relationshipType as any));
      }

      const relationships = await db.query.companyRelationships.findMany({
        where: and(...conditions),
        orderBy: [desc(companyRelationships.approvedAt)],
      });

      // Enrich with company details
      const enrichedRelationships = await Promise.all(
        relationships.map(async (relationship) => {
          const [companyA, companyB] = await Promise.all([
            db.query.companies.findFirst({
              where: eq(companies.id, relationship.companyAId),
            }),
            db.query.companies.findFirst({
              where: eq(companies.id, relationship.companyBId),
            }),
          ]);

          // Determine which is "them" from perspective of current user
          const isCompanyA = relationship.companyAId === companyId;
          const connectedCompany = isCompanyA ? companyB : companyA;

          return {
            ...relationship,
            connectedCompany,
            myRole: isCompanyA ? 'companyA' : 'companyB',
          };
        })
      );

      res.json(enrichedRelationships);

    } catch (error) {
      logger.error("Failed to get connections", error as Error);
      res.status(500).json({ message: "Failed to get connections" });
    }
  });

  /**
   * PUT /api/marketplace/connections/:id/disconnect
   * Disconnect from a company
   */
  app.put("/api/marketplace/connections/:id/disconnect", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const relationshipId = req.params.id;

      logger.info("Disconnecting", { companyId, relationshipId });

      // Get relationship
      const relationship = await db.query.companyRelationships.findFirst({
        where: eq(companyRelationships.id, relationshipId),
      });

      if (!relationship) {
        return res.status(404).json({ message: "Relationship not found" });
      }

      // Verify user is part of relationship
      if (relationship.companyAId !== companyId && relationship.companyBId !== companyId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Update status
      const [updatedRelationship] = await db.update(companyRelationships)
        .set({
          status: 'disconnected',
          disconnectedAt: new Date(),
        })
        .where(eq(companyRelationships.id, relationshipId))
        .returning();

      // Update connection counts in profiles
      await Promise.all([
        db.execute(sql`
          UPDATE company_profiles 
          SET connections_count = GREATEST(COALESCE(connections_count, 0) - 1, 0) 
          WHERE company_id = ${relationship.companyAId}
        `),
        db.execute(sql`
          UPDATE company_profiles 
          SET connections_count = GREATEST(COALESCE(connections_count, 0) - 1, 0) 
          WHERE company_id = ${relationship.companyBId}
        `),
      ]);

      res.json(updatedRelationship);

    } catch (error) {
      logger.error("Failed to disconnect", error as Error);
      res.status(500).json({ message: "Failed to disconnect" });
    }
  });

  /**
   * GET /api/marketplace/stats
   * Get marketplace statistics
   */
  app.get("/api/marketplace/stats", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      logger.info("Getting marketplace stats");

      // Get counts
      const [totalCompaniesResult, totalConnectionsResult] = await Promise.all([
        db.execute(sql`SELECT COUNT(*) as count FROM companies WHERE status = 'active'`),
        db.execute(sql`SELECT COUNT(*) as count FROM company_relationships WHERE status = 'active'`),
      ]);

      // Count by company type
      const companiesByTypeResult = await db.execute(sql`
        SELECT type, COUNT(*) as count 
        FROM companies 
        WHERE status = 'active'
        GROUP BY type
      `);

      const stats = {
        totalCompanies: Number((totalCompaniesResult.rows[0] as any)?.count || 0),
        totalConnections: Number((totalConnectionsResult.rows[0] as any)?.count || 0),
        companiesByType: companiesByTypeResult.rows.reduce((acc: any, row: any) => {
          acc[row.type] = Number(row.count);
          return acc;
        }, {}),
      };

      res.json(stats);

    } catch (error) {
      logger.error("Failed to get marketplace stats", error as Error);
      res.status(500).json({ message: "Failed to get marketplace stats" });
    }
  });

  logger.info("Marketplace routes registered");
}
