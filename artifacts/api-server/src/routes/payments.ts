import { Router } from "express";
import { db } from "../lib/db.js";
import { ordersTable, mobileMoneyTransactionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyPayment } from "../services/mobileMoney.js";
import { notifyProducteurPaiementRecu } from "../services/notifications.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.post("/payments/airtel/callback", async (req, res) => {
  try {
    const { transaction } = req.body as {
      transaction?: { id?: string; status?: string; message?: string };
    };

    logger.info({ body: req.body }, "Airtel Money callback received");

    if (!transaction?.id) {
      return res.status(400).json({ error: "Transaction ID manquant" });
    }

    const txId = transaction.id;
    const status = transaction.status ?? "FAILED";

    await db.update(mobileMoneyTransactionsTable)
      .set({ statut: status === "TS" || status === "SUCCESS" ? "success" : "failed" })
      .where(eq(mobileMoneyTransactionsTable.reference, txId));

    if (status === "TS" || status === "SUCCESS") {
      const [tx] = await db.select().from(mobileMoneyTransactionsTable)
        .where(eq(mobileMoneyTransactionsTable.reference, txId)).limit(1);

      if (tx?.orderId) {
        await db.update(ordersTable)
          .set({ statut: "paye", updatedAt: new Date() })
          .where(eq(ordersTable.id, tx.orderId));

        const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, tx.orderId)).limit(1);
        const [producteur] = await db.select().from(usersTable).where(eq(usersTable.id, order?.producteurId ?? "")).limit(1);

        if (producteur?.telephone && order) {
          await notifyProducteurPaiementRecu({
            producteurTelephone: producteur.telephone,
            orderId: order.id,
            montant: parseFloat(order.montantTotal),
            operateur: "airtel_money",
          });
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Airtel callback error");
    res.status(500).json({ error: "Erreur traitement callback" });
  }
});

router.post("/payments/moov/callback", async (req, res) => {
  try {
    const { transaction_id, status, external_reference } = req.body as {
      transaction_id?: string;
      status?: string;
      external_reference?: string;
    };

    logger.info({ body: req.body }, "Moov Money callback received");

    const ref = transaction_id ?? external_reference ?? "";
    const success = status === "SUCCESS";

    await db.update(mobileMoneyTransactionsTable)
      .set({ statut: success ? "success" : "failed" })
      .where(eq(mobileMoneyTransactionsTable.reference, ref));

    if (success) {
      const [tx] = await db.select().from(mobileMoneyTransactionsTable)
        .where(eq(mobileMoneyTransactionsTable.reference, ref)).limit(1);

      if (tx?.orderId) {
        await db.update(ordersTable)
          .set({ statut: "paye", updatedAt: new Date() })
          .where(eq(ordersTable.id, tx.orderId));
      }
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Moov callback error");
    res.status(500).json({ error: "Erreur traitement callback" });
  }
});

router.post("/payments/verify", async (req, res) => {
  try {
    const { transactionId, operator } = req.body as {
      transactionId: string;
      operator: "airtel_money" | "moov_money";
    };

    if (!transactionId) return res.status(400).json({ error: "transactionId requis" });

    const result = await verifyPayment(transactionId, operator);
    res.json({ data: result });
  } catch (err) {
    req.log.error({ err }, "POST /payments/verify error");
    res.status(500).json({ error: "Erreur vérification paiement" });
  }
});

export default router;
