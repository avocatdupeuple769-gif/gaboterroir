import { Router } from "express";
import { db } from "../lib/db.js";
import { usersTable, productsTable, ordersTable, smsLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { parseSMS, formatHelp, formatCommandesResponse } from "../services/smsParser.js";
import { sendSMS } from "../services/africasTalking.js";

const router = Router();

router.post("/sms/incoming", async (req, res) => {
  try {
    const { from, to, text, date } = req.body as {
      from: string;
      to: string;
      text: string;
      date: string;
    };

    if (!from || !text) {
      return res.status(400).json({ error: "Champs from et text requis" });
    }

    const phone = from.replace("+", "").replace("241", "").replace(/^0/, "");

    await db.insert(smsLogsTable).values({
      from: from,
      to: to ?? "GaboTerroir",
      message: text,
      direction: "entrant",
      processed: false,
    });

    const command = parseSMS(text, phone);
    let reply = "";
    let action = command.action;

    switch (command.action) {
      case "ENREGISTRER": {
        const existing = await db.select().from(usersTable).where(eq(usersTable.telephone, phone)).limit(1);
        if (existing.length > 0) {
          reply = `Vous êtes déjà enregistré comme ${existing[0].role}. Bienvenue sur GaboTerroir!`;
        } else {
          const nom = String(command.data.nom || "");
          const ville = String(command.data.ville || "");
          await db.insert(usersTable).values({
            id: `sms_${phone}_${Date.now()}`,
            telephone: phone,
            nom: nom,
            prenom: "",
            role: "producteur",
            ville: ville,
            province: "Estuaire",
          });
          reply = `Bienvenue sur GaboTerroir, ${nom}!\nVous êtes enregistré comme producteur à ${ville}.\nEnvoyez AIDE pour les commandes disponibles.`;
        }
        break;
      }

      case "PRODUIT": {
        const [producteur] = await db.select().from(usersTable).where(eq(usersTable.telephone, phone)).limit(1);
        if (!producteur) {
          reply = "Vous n'êtes pas enregistré. Envoyez: REG VotreNom VotreVille";
          break;
        }
        const [product] = await db.insert(productsTable).values({
          producteurId: producteur.id,
          nom: `${command.data.categorie}`,
          categorie: String(command.data.categorie),
          prix: String(command.data.prix),
          unite: String(command.data.unite || "kg"),
          quantiteDisponible: String(command.data.quantite),
          province: producteur.province,
          ville: producteur.ville,
          viaSms: true,
        }).returning();
        reply = `Produit publié!\nID: ${product.id}\n${command.data.categorie} ${command.data.quantite}${command.data.unite} à ${command.data.prix} FCFA/${command.data.unite}.\nVos acheteurs peuvent maintenant commander.`;
        break;
      }

      case "STOCK": {
        const produitId = Number(command.data.produitId);
        const quantite = Number(command.data.quantite);
        const [prod] = await db.select().from(productsTable).where(eq(productsTable.id, produitId)).limit(1);
        if (!prod) {
          reply = `Produit #${produitId} introuvable.`;
          break;
        }
        await db.update(productsTable)
          .set({ quantiteDisponible: quantite.toString(), statut: quantite > 0 ? "disponible" : "epuise", updatedAt: new Date() })
          .where(eq(productsTable.id, produitId));
        reply = `Stock mis à jour!\n${prod.nom}: ${quantite}${prod.unite} disponible(s).`;
        break;
      }

      case "PRIX": {
        const produitId = Number(command.data.produitId);
        const prix = Number(command.data.prix);
        const [prod] = await db.select().from(productsTable).where(eq(productsTable.id, produitId)).limit(1);
        if (!prod) {
          reply = `Produit #${produitId} introuvable.`;
          break;
        }
        await db.update(productsTable)
          .set({ prix: prix.toString(), updatedAt: new Date() })
          .where(eq(productsTable.id, produitId));
        reply = `Prix mis à jour!\n${prod.nom}: ${prix} FCFA/${prod.unite}.`;
        break;
      }

      case "COMMANDES": {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.telephone, phone)).limit(1);
        if (!user) {
          reply = "Vous n'êtes pas enregistré.";
          break;
        }
        const commandes = await db.select({
          id: ordersTable.id,
          statut: ordersTable.statut,
          montantTotal: ordersTable.montantTotal,
        }).from(ordersTable)
          .where(eq(ordersTable.producteurId, user.id))
          .orderBy(desc(ordersTable.createdAt))
          .limit(5);
        reply = formatCommandesResponse(commandes);
        break;
      }

      case "AIDE":
      default: {
        reply = formatHelp();
        break;
      }
    }

    await sendSMS(from, reply);

    await db.update(smsLogsTable)
      .set({ processed: true, action: action, result: reply })
      .where(eq(smsLogsTable.from, from));

    res.json({ success: true, reply });
  } catch (err) {
    req.log.error({ err }, "POST /sms/incoming error");
    res.status(500).json({ error: "Erreur traitement SMS" });
  }
});

router.post("/sms/send", async (req, res) => {
  try {
    const { to, message } = req.body as { to: string; message: string };
    if (!to || !message) return res.status(400).json({ error: "to et message requis" });

    const result = await sendSMS(to, message);
    await db.insert(smsLogsTable).values({
      from: "GaboTerroir",
      to,
      message,
      direction: "sortant",
      processed: true,
      action: "send_direct",
      result: result.success ? "sent" : result.error,
    });

    res.json({ success: result.success, messageId: result.messageId, error: result.error });
  } catch (err) {
    req.log.error({ err }, "POST /sms/send error");
    res.status(500).json({ error: "Erreur envoi SMS" });
  }
});

router.get("/sms/logs", async (req, res) => {
  try {
    const { limit = "50" } = req.query as { limit?: string };
    const logs = await db.select().from(smsLogsTable).orderBy(desc(smsLogsTable.createdAt)).limit(parseInt(limit));
    res.json({ data: logs });
  } catch (err) {
    req.log.error({ err }, "GET /sms/logs error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
