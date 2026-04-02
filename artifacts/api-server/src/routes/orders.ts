import { Router } from "express";
import { db } from "../lib/db.js";
import {
  ordersTable, orderItemsTable, productsTable, usersTable, mobileMoneyTransactionsTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { notifyProducteurVente, notifyAcheteurConfirmation } from "../services/notifications.js";
import { initiatePayment } from "../services/mobileMoney.js";
import crypto from "crypto";

const router = Router();

function generateEscrowCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateRef(): string {
  return `GT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

router.post("/orders", async (req, res) => {
  try {
    const {
      acheteurId, producteurId, items, adresseLivraison = "", notes = "",
      paymentMethod = "airtel_money", acheteurTelephone,
    } = req.body as {
      acheteurId: string;
      producteurId: string;
      items: { productId: number; quantite: number; prixUnitaire: number }[];
      adresseLivraison?: string;
      notes?: string;
      paymentMethod?: "airtel_money" | "moov_money" | "wallet";
      acheteurTelephone: string;
    };

    if (!acheteurId || !producteurId || !items?.length || !acheteurTelephone) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }

    const montantTotal = items.reduce((s, i) => s + i.quantite * i.prixUnitaire, 0);
    const codeSequestre = generateEscrowCode();
    const paymentRef = generateRef();

    const payResult = await initiatePayment({
      telephone: acheteurTelephone,
      montant: montantTotal,
      reference: paymentRef,
      description: `Commande GaboTerroir #${paymentRef}`,
      operator: paymentMethod === "wallet" ? "airtel_money" : paymentMethod,
    });

    if (!payResult.success) {
      return res.status(402).json({ error: `Paiement échoué: ${payResult.error}` });
    }

    const [order] = await db.insert(ordersTable).values({
      acheteurId,
      producteurId,
      montantTotal: montantTotal.toString(),
      codeSequestre,
      paymentMethod,
      paymentRef: payResult.transactionId ?? paymentRef,
      adresseLivraison,
      notes,
      statut: "paye",
    }).returning();

    const orderItemsData = items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      quantite: item.quantite.toString(),
      prixUnitaire: item.prixUnitaire.toString(),
      sousTotal: (item.quantite * item.prixUnitaire).toString(),
    }));
    await db.insert(orderItemsTable).values(orderItemsData);

    await db.insert(mobileMoneyTransactionsTable).values({
      userId: acheteurId,
      orderId: order.id,
      montant: montantTotal.toString(),
      type: "achat",
      paymentMethod: paymentMethod === "wallet" ? "airtel_money" : paymentMethod,
      telephone: acheteurTelephone,
      reference: payResult.transactionId ?? paymentRef,
      statut: "success",
    });

    for (const item of items) {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1);
      if (product) {
        const nouvelleQte = Math.max(0, parseFloat(product.quantiteDisponible) - item.quantite);
        await db.update(productsTable)
          .set({
            quantiteDisponible: nouvelleQte.toString(),
            statut: nouvelleQte <= 0 ? "epuise" : "disponible",
            updatedAt: new Date(),
          })
          .where(eq(productsTable.id, item.productId));
      }
    }

    const [producteur] = await db.select().from(usersTable).where(eq(usersTable.id, producteurId)).limit(1);
    const [acheteur] = await db.select().from(usersTable).where(eq(usersTable.id, acheteurId)).limit(1);

    if (producteur?.telephone) {
      const firstProduct = await db.select().from(productsTable).where(eq(productsTable.id, items[0].productId)).limit(1);
      await notifyProducteurVente({
        producteurTelephone: producteur.telephone,
        produitNom: firstProduct[0]?.nom ?? "Produit",
        quantite: items[0].quantite,
        unite: firstProduct[0]?.unite ?? "kg",
        montant: montantTotal,
        acheteurNom: acheteur ? `${acheteur.prenom} ${acheteur.nom}` : "Acheteur",
        operateur: paymentMethod,
        orderId: order.id,
      });
    }

    await notifyAcheteurConfirmation({
      acheteurTelephone,
      orderId: order.id,
      codeSequestre,
      montant: montantTotal,
    });

    res.status(201).json({
      data: { ...order, codeSequestre, items: orderItemsData },
    });
  } catch (err) {
    req.log.error({ err }, "POST /orders error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Commande introuvable" });
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
    res.json({ data: { ...order, items } });
  } catch (err) {
    req.log.error({ err }, "GET /orders/:id error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/users/:userId/orders", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role = "acheteur" } = req.query as { role?: string };
    const condition = role === "producteur"
      ? eq(ordersTable.producteurId, userId)
      : eq(ordersTable.acheteurId, userId);
    const orders = await db.select().from(ordersTable).where(condition).orderBy(desc(ordersTable.createdAt));
    res.json({ data: orders });
  } catch (err) {
    req.log.error({ err }, "GET /users/:userId/orders error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/orders/:id/confirm-delivery", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { codeSequestre } = req.body as { codeSequestre: string };

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Commande introuvable" });
    if (order.codeSequestre !== codeSequestre) {
      return res.status(400).json({ error: "Code séquestre incorrect" });
    }
    if (order.statut === "livre") return res.status(400).json({ error: "Commande déjà livrée" });

    await db.update(ordersTable).set({ statut: "livre", updatedAt: new Date() }).where(eq(ordersTable.id, id));

    const [producteur] = await db.select().from(usersTable).where(eq(usersTable.id, order.producteurId)).limit(1);
    if (producteur) {
      const commission = parseFloat(order.montantTotal) * 0.05;
      const montantNet = parseFloat(order.montantTotal) - commission;
      await db.update(usersTable)
        .set({
          walletSolde: (parseFloat(producteur.walletSolde) + montantNet).toFixed(2),
          totalSales: producteur.totalSales + 1,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, producteur.id));

      await db.insert(mobileMoneyTransactionsTable).values({
        userId: producteur.id,
        orderId: order.id,
        montant: montantNet.toString(),
        type: "vente",
        paymentMethod: order.paymentMethod,
        telephone: producteur.telephone,
        reference: `LIVR-${order.id}`,
        statut: "success",
      });
    }

    res.json({ success: true, message: "Livraison confirmée, paiement libéré" });
  } catch (err) {
    req.log.error({ err }, "POST /orders/:id/confirm-delivery error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/orders/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { statut, transporteurId } = req.body as { statut: string; transporteurId?: string };
    const updates: Record<string, unknown> = { statut, updatedAt: new Date() };
    if (transporteurId) updates.transporteurId = transporteurId;
    const [order] = await db.update(ordersTable).set(updates as Parameters<typeof db.update>[0]["set"]).where(eq(ordersTable.id, id)).returning();
    if (!order) return res.status(404).json({ error: "Commande introuvable" });
    res.json({ data: order });
  } catch (err) {
    req.log.error({ err }, "PUT /orders/:id/status error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
