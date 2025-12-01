/**
 * Inventory Domain Schema
 *
 * Tables for inventory and product management including:
 * - Products and variants
 * - Inventory movements
 * - Frame characteristics
 * - Frame recommendations
 *
 * @module shared/schema/inventory
 */

import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// ============================================
// INVENTORY ENUMS
// ============================================

export const productTypeEnum = pgEnum("product_type", [
  "frame",
  "contact_lens",
  "solution",
  "service"
]);

export const movementTypeEnum = pgEnum("movement_type", [
  "sale",           // Product sold via POS
  "refund",         // Product returned/refunded
  "adjustment",     // Manual stock adjustment
  "received",       // Stock received from supplier
  "transfer_out",   // Transferred to another location
  "transfer_in",    // Received from another location
  "damaged",        // Marked as damaged/lost
  "initial"         // Initial stock entry
]);

export const frameStyleEnum = pgEnum("frame_style", [
  "rectangle",
  "square",
  "round",
  "oval",
  "cat_eye",
  "aviator",
  "wayfarer",
  "browline",
  "rimless",
  "semi_rimless",
  "geometric",
  "wrap"
]);

export const frameMaterialEnum = pgEnum("frame_material", [
  "metal",
  "plastic",
  "acetate",
  "titanium",
  "wood",
  "carbon_fiber",
  "mixed"
]);

// ============================================
// PRODUCTS
// ============================================

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  ecpId: varchar("ecp_id").notNull(),
  productType: productTypeEnum("product_type").notNull(),
  sku: text("sku"),
  brand: text("brand"),
  model: text("model"),
  name: text("name"),
  description: text("description"),
  category: text("category"), // 'frames', 'lenses', 'accessories', 'solutions', 'cases', 'cleaning'
  barcode: text("barcode"),
  imageUrl: text("image_url"),
  colorOptions: jsonb("color_options").$type<string[]>(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  isPrescriptionRequired: boolean("is_prescription_required").default(false),

  // Shopify integration
  shopifyProductId: varchar("shopify_product_id"),
  shopifyVariantId: varchar("shopify_variant_id"),
  shopifyInventoryItemId: varchar("shopify_inventory_item_id"),
  lastShopifySync: timestamp("last_shopify_sync"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_products_company").on(table.companyId),
  index("idx_products_company_barcode").on(table.companyId, table.barcode),
  index("idx_products_category").on(table.category),
  index("idx_products_type").on(table.productType),
]);

// ============================================
// PRODUCT VARIANTS
// ============================================

export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  companyId: varchar("company_id").notNull(),

  // Variant details
  variantSku: varchar("variant_sku", { length: 100 }).notNull(),
  variantName: varchar("variant_name", { length: 255 }).notNull(),

  // Variant attributes
  color: varchar("color", { length: 50 }),
  size: varchar("size", { length: 50 }),
  style: varchar("style", { length: 100 }),
  attributes: jsonb("attributes"),

  // Pricing (can override parent product)
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),

  // Stock tracking
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10),

  // Variant specific data
  barcode: varchar("barcode", { length: 100 }),
  imageUrl: text("image_url"),

  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_product_variants_product").on(table.productId),
  index("idx_product_variants_company").on(table.companyId),
  index("idx_product_variants_sku").on(table.variantSku),
  index("idx_product_variants_barcode").on(table.barcode),
]);

// ============================================
// INVENTORY MOVEMENTS
// ============================================

export const inventoryMovements = pgTable("inventory_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  productId: varchar("product_id").notNull(),

  // Movement details
  movementType: movementTypeEnum("movement_type").notNull(),
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),

  // Reference tracking
  referenceType: varchar("reference_type", { length: 50 }), // 'pos_transaction', 'manual_adjustment', 'purchase_order'
  referenceId: varchar("reference_id"),

  // Audit information
  reason: text("reason"),
  notes: text("notes"),
  performedBy: varchar("performed_by").notNull(),

  // Location tracking (for multi-location support)
  locationId: varchar("location_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_inventory_movements_company").on(table.companyId),
  index("idx_inventory_movements_product").on(table.productId),
  index("idx_inventory_movements_type").on(table.movementType),
  index("idx_inventory_movements_date").on(table.createdAt),
  index("idx_inventory_movements_performed_by").on(table.performedBy),
]);

// ============================================
// FRAME CHARACTERISTICS
// ============================================

export const frameCharacteristics = pgTable("frame_characteristics", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),

  // References
  productId: varchar("product_id", { length: 255 }).notNull().unique(),
  companyId: varchar("company_id", { length: 255 }).notNull(),

  // Frame style and characteristics
  frameStyle: frameStyleEnum("frame_style").notNull(),
  frameMaterial: frameMaterialEnum("frame_material").notNull(),
  frameSize: varchar("frame_size", { length: 50 }).notNull(),

  // Recommended face shapes
  recommendedFaceShapes: jsonb("recommended_face_shapes").$type<string[]>().notNull().default(sql`'[]'::jsonb`),

  // Physical measurements (mm)
  lensWidth: decimal("lens_width", { precision: 5, scale: 1 }),
  bridgeWidth: decimal("bridge_width", { precision: 5, scale: 1 }),
  templeLength: decimal("temple_length", { precision: 5, scale: 1 }),
  frameHeight: decimal("frame_height", { precision: 5, scale: 1 }),

  // Style attributes
  gender: varchar("gender", { length: 20 }),
  ageRange: varchar("age_range", { length: 50 }),
  style: varchar("style", { length: 100 }),
  colorFamily: varchar("color_family", { length: 50 }),

  // Features
  hasNosePads: boolean("has_nose_pads").default(false),
  isAdjustable: boolean("is_adjustable").default(false),
  isSunglasses: boolean("is_sunglasses").default(false),
  isPolarized: boolean("is_polarized").default(false),

  // AI recommendation score
  popularityScore: decimal("popularity_score", { precision: 5, scale: 2 }).default("0"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_frame_chars_product").on(table.productId),
  index("idx_frame_chars_company").on(table.companyId),
  index("idx_frame_chars_style").on(table.frameStyle),
  index("idx_frame_chars_material").on(table.frameMaterial),
]);

// ============================================
// FRAME RECOMMENDATIONS
// ============================================

export const frameRecommendations = pgTable("frame_recommendations", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),

  // References
  faceAnalysisId: varchar("face_analysis_id", { length: 255 }).notNull(),
  patientId: varchar("patient_id", { length: 255 }).notNull(),
  productId: varchar("product_id", { length: 255 }).notNull(),
  companyId: varchar("company_id", { length: 255 }).notNull(),

  // Recommendation scoring
  matchScore: decimal("match_score", { precision: 5, scale: 2 }).notNull(),
  matchReason: text("match_reason").notNull(),

  // Ranking
  rank: integer("rank").notNull(),

  // User interaction
  viewed: boolean("viewed").default(false),
  viewedAt: timestamp("viewed_at"),
  liked: boolean("liked").default(false),
  likedAt: timestamp("liked_at"),
  purchased: boolean("purchased").default(false),
  purchasedAt: timestamp("purchased_at"),
  dismissed: boolean("dismissed").default(false),
  dismissedAt: timestamp("dismissed_at"),

  // Analytics
  clickCount: integer("click_count").default(0),
  shareCount: integer("share_count").default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_frame_recs_analysis").on(table.faceAnalysisId),
  index("idx_frame_recs_patient").on(table.patientId),
  index("idx_frame_recs_product").on(table.productId),
  index("idx_frame_recs_company").on(table.companyId),
  index("idx_frame_recs_match_score").on(table.matchScore),
  index("idx_frame_recs_rank").on(table.rank),
]);

// ============================================
// FRAME RECOMMENDATION ANALYTICS
// ============================================

export const frameRecommendationAnalytics = pgTable("frame_recommendation_analytics", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull(),
  productId: varchar("product_id", { length: 255 }).notNull(),

  // Aggregated metrics
  totalRecommendations: integer("total_recommendations").default(0),
  totalViews: integer("total_views").default(0),
  totalLikes: integer("total_likes").default(0),
  totalPurchases: integer("total_purchases").default(0),
  totalDismissals: integer("total_dismissals").default(0),

  // Calculated rates
  viewRate: decimal("view_rate", { precision: 5, scale: 2 }).default("0"),
  likeRate: decimal("like_rate", { precision: 5, scale: 2 }).default("0"),
  purchaseRate: decimal("purchase_rate", { precision: 5, scale: 2 }).default("0"),
  dismissalRate: decimal("dismissal_rate", { precision: 5, scale: 2 }).default("0"),

  // Average metrics
  avgMatchScore: decimal("avg_match_score", { precision: 5, scale: 2 }).default("0"),
  avgRank: decimal("avg_rank", { precision: 5, scale: 2 }).default("0"),

  // Time-based metrics
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_frame_rec_analytics_company").on(table.companyId),
  index("idx_frame_rec_analytics_product").on(table.productId),
  index("idx_frame_rec_analytics_period").on(table.periodStart, table.periodEnd),
]);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertProductSchema = createInsertSchema(products);
export const insertProductVariantSchema = createInsertSchema(productVariants);
export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements);
export const insertFrameCharacteristicsSchema = createInsertSchema(frameCharacteristics);
export const insertFrameRecommendationSchema = createInsertSchema(frameRecommendations);
export const insertFrameRecommendationAnalyticsSchema = createInsertSchema(frameRecommendationAnalytics);

// ============================================
// TYPES
// ============================================

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = typeof inventoryMovements.$inferInsert;
export type FrameCharacteristics = typeof frameCharacteristics.$inferSelect;
export type InsertFrameCharacteristics = typeof frameCharacteristics.$inferInsert;
export type FrameRecommendation = typeof frameRecommendations.$inferSelect;
export type InsertFrameRecommendation = typeof frameRecommendations.$inferInsert;
export type FrameRecommendationAnalytics = typeof frameRecommendationAnalytics.$inferSelect;
export type InsertFrameRecommendationAnalytics = typeof frameRecommendationAnalytics.$inferInsert;
