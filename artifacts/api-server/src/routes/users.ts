import { Router } from "express";
import { db } from "../lib/db.js";
import { usersTable, insertUserSchema, mobileMoneyTransactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.post("/users", async (req, res) => {
  try {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const existing = await db.select().from(usersTable).where(eq(usersTable.telephone, parsed.data.telephone)).limit(1);
    if (existing.length > 0) {
      return res.json({ data: existing[0], created: false });
    }

    const [user] = await db.insert(usersTable).values(parsed.data).returning();
    res.status(201).json({ data: user, created: true });
  } catch (err) {
    req.log.error({ err }, "POST /users error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id)).limit(1);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ data: user });
  } catch (err) {
    req.log.error({ err }, "GET /users/:id error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { id, telephone, createdAt, ...updates } = req.body as Record<string, unknown>;
    void id; void telephone; void createdAt;

    const [user] = await db.update(usersTable)
      .set({ ...updates, updatedAt: new Date() } as Parameters<typeof db.update>[0]["set"])
      .where(eq(usersTable.id, req.params.id))
      .returning();

    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ data: user });
  } catch (err) {
    req.log.error({ err }, "PUT /users/:id error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/users/phone/:telephone", async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.telephone, req.params.telephone)).limit(1);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ data: user });
  } catch (err) {
    req.log.error({ err }, "GET /users/phone/:telephone error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/users/:id/transactions", async (req, res) => {
  try {
    const transactions = await db
      .select()
      .from(mobileMoneyTransactionsTable)
      .where(eq(mobileMoneyTransactionsTable.userId, req.params.id))
      .orderBy(desc(mobileMoneyTransactionsTable.createdAt))
      .limit(50);
    res.json({ data: transactions });
  } catch (err) {
    req.log.error({ err }, "GET /users/:id/transactions error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/users/:id/wallet/deposit", async (req, res) => {
  try {
    const { montant, paymentMethod, telephone } = req.body as {
      montant: number;
      paymentMethod: "airtel_money" | "moov_money";
      telephone: string;
    };

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id)).limit(1);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    const newSolde = parseFloat(user.walletSolde) + montant;
    await db.update(usersTable)
      .set({ walletSolde: newSolde.toFixed(2), updatedAt: new Date() })
      .where(eq(usersTable.id, req.params.id));

    await db.insert(mobileMoneyTransactionsTable).values({
      userId: req.params.id,
      montant: montant.toString(),
      type: "depot",
      paymentMethod,
      telephone,
      reference: `DEP-${Date.now()}`,
      statut: "success",
    });

    res.json({ data: { newSolde, montant } });
  } catch (err) {
    req.log.error({ err }, "POST /users/:id/wallet/deposit error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/users/:id/wallet/withdraw", async (req, res) => {
  try {
    const { montant, paymentMethod, telephone } = req.body as {
      montant: number;
      paymentMethod: "airtel_money" | "moov_money";
      telephone: string;
    };

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id)).limit(1);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    const solde = parseFloat(user.walletSolde);
    if (solde < montant) return res.status(400).json({ error: "Solde insuffisant" });

    const newSolde = solde - montant;
    await db.update(usersTable)
      .set({ walletSolde: newSolde.toFixed(2), updatedAt: new Date() })
      .where(eq(usersTable.id, req.params.id));

    await db.insert(mobileMoneyTransactionsTable).values({
      userId: req.params.id,
      montant: montant.toString(),
      type: "retrait",
      paymentMethod,
      telephone,
      reference: `RET-${Date.now()}`,
      statut: "success",
    });

    res.json({ data: { newSolde, montant } });
  } catch (err) {
    req.log.error({ err }, "POST /users/:id/wallet/withdraw error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
