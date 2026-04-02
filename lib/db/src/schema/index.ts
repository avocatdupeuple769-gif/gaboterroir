import { pgTable, text, serial, integer, timestamp, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["acheteur", "producteur", "transporteur"]);
export const productStatusEnum = pgEnum("product_status", ["disponible", "epuise", "suspendu"]);
export const orderStatusEnum = pgEnum("order_status", ["en_attente", "paye", "en_livraison", "livre", "annule"]);
export const paymentMethodEnum = pgEnum("payment_method", ["airtel_money", "moov_money", "wallet"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["depot", "retrait", "vente", "achat", "commission"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull().default(""),
  prenom: text("prenom").notNull().default(""),
  telephone: text("telephone").notNull().unique(),
  role: userRoleEnum("role").notNull().default("acheteur"),
  ville: text("ville").notNull().default(""),
  quartier: text("quartier").notNull().default(""),
  province: text("province").notNull().default("Estuaire"),
  photoProfile: text("photo_profile").notNull().default(""),
  cniVerified: boolean("cni_verified").notNull().default(false),
  walletSolde: numeric("wallet_solde", { precision: 12, scale: 2 }).notNull().default("0"),
  isKycVerified: boolean("is_kyc_verified").notNull().default(false),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  totalSales: integer("total_sales").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  producteurId: text("producteur_id").notNull().references(() => usersTable.id),
  nom: text("nom").notNull(),
  categorie: text("categorie").notNull(),
  prix: numeric("prix", { precision: 10, scale: 2 }).notNull(),
  unite: text("unite").notNull().default("kg"),
  quantiteDisponible: numeric("quantite_disponible", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull().default(""),
  province: text("province").notNull().default("Estuaire"),
  ville: text("ville").notNull().default(""),
  statut: productStatusEnum("statut").notNull().default("disponible"),
  photos: text("photos").array().notNull().default([]),
  videoUrl: text("video_url"),
  isFlashSale: boolean("is_flash_sale").notNull().default(false),
  flashSalePrice: numeric("flash_sale_price", { precision: 10, scale: 2 }),
  flashSaleExpiry: timestamp("flash_sale_expiry"),
  viaSms: boolean("via_sms").notNull().default(false),
  viaUssd: boolean("via_ussd").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  acheteurId: text("acheteur_id").notNull().references(() => usersTable.id),
  producteurId: text("producteur_id").notNull().references(() => usersTable.id),
  transporteurId: text("transporteur_id").references(() => usersTable.id),
  statut: orderStatusEnum("statut").notNull().default("en_attente"),
  montantTotal: numeric("montant_total", { precision: 10, scale: 2 }).notNull(),
  codeSequestre: text("code_sequestre").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("airtel_money"),
  paymentRef: text("payment_ref"),
  adresseLivraison: text("adresse_livraison").notNull().default(""),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  quantite: numeric("quantite", { precision: 10, scale: 2 }).notNull(),
  prixUnitaire: numeric("prix_unitaire", { precision: 10, scale: 2 }).notNull(),
  sousTotal: numeric("sous_total", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;

export const mobileMoneyTransactionsTable = pgTable("mobile_money_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  orderId: integer("order_id").references(() => ordersTable.id),
  montant: numeric("montant", { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  telephone: text("telephone").notNull(),
  reference: text("reference").notNull(),
  statut: text("statut").notNull().default("en_attente"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMobileMoneyTransactionSchema = createInsertSchema(mobileMoneyTransactionsTable).omit({ id: true, createdAt: true });
export type InsertMobileMoneyTransaction = z.infer<typeof insertMobileMoneyTransactionSchema>;
export type MobileMoneyTransaction = typeof mobileMoneyTransactionsTable.$inferSelect;

export const smsLogsTable = pgTable("sms_logs", {
  id: serial("id").primaryKey(),
  from: text("from_tel").notNull(),
  to: text("to_tel").notNull(),
  message: text("message").notNull(),
  direction: text("direction").notNull().default("entrant"),
  processed: boolean("processed").notNull().default(false),
  action: text("action"),
  result: text("result"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SmsLog = typeof smsLogsTable.$inferSelect;

export const ussdSessionsTable = pgTable("ussd_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  telephone: text("telephone").notNull(),
  currentStep: text("current_step").notNull().default("menu"),
  data: text("data").notNull().default("{}"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UssdSession = typeof ussdSessionsTable.$inferSelect;