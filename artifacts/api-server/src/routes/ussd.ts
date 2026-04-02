import { Router } from "express";
import { db } from "../lib/db.js";
import { usersTable, productsTable, ordersTable, ussdSessionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

const MENU_PRINCIPAL = `CON Bienvenue sur GaboTerroir
1. Mes produits
2. Ajouter un produit
3. Mes commandes
4. Mon solde
5. Aide`;

const MENU_CATEGORIES = `CON Choisissez la catégorie:
1. Tubercules (Manioc/Igname)
2. Fruits/Bananes
3. Légumes
4. Céréales (Maïs/Riz)
5. Autres`;

const CATEGORIES_MAP: Record<string, string> = {
  "1": "Tubercules",
  "2": "Fruits",
  "3": "Légumes",
  "4": "Céréales",
  "5": "Autre",
};

router.post("/ussd", async (req, res) => {
  try {
    const { sessionId, serviceCode, phoneNumber, text } = req.body as {
      sessionId: string;
      serviceCode: string;
      phoneNumber: string;
      text: string;
    };

    void serviceCode;
    const phone = phoneNumber.replace("+241", "").replace("+", "").replace(/^0/, "");
    const inputs = text ? text.split("*") : [];
    const lastInput = inputs[inputs.length - 1] ?? "";

    const [existingSession] = await db.select().from(ussdSessionsTable)
      .where(eq(ussdSessionsTable.sessionId, sessionId)).limit(1);

    let sessionData: Record<string, string | number> = {};
    if (existingSession) {
      try { sessionData = JSON.parse(existingSession.data) as Record<string, string | number>; } catch { sessionData = {}; }
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.telephone, phone)).limit(1);

    let response = "";

    if (!text) {
      if (!user) {
        response = `CON Bienvenue sur GaboTerroir!\nVotre numéro: +241${phone}\n\n1. S'enregistrer comme producteur\n2. S'enregistrer comme acheteur\n0. Quitter`;
      } else {
        response = MENU_PRINCIPAL;
      }
      if (!existingSession) {
        await db.insert(ussdSessionsTable).values({
          sessionId, telephone: phone, currentStep: "menu", data: JSON.stringify(sessionData), active: true,
        });
      }
    } else if (!user) {
      if (inputs.length === 1) {
        const role = lastInput === "1" ? "producteur" : "acheteur";
        sessionData.pendingRole = role;
        await upsertSession(sessionId, phone, "saisir_nom", sessionData);
        response = "CON Entrez votre prénom et nom:\n(ex: Jean Moussavou)";
      } else if (inputs.length === 2) {
        const [prenom, ...nomParts] = lastInput.split(" ");
        sessionData.prenom = prenom;
        sessionData.nom = nomParts.join(" ") || prenom;
        await upsertSession(sessionId, phone, "saisir_ville", sessionData);
        response = "CON Entrez votre ville:\n(ex: Libreville, Oyem, Franceville)";
      } else {
        const ville = lastInput;
        await db.insert(usersTable).values({
          id: `ussd_${phone}_${Date.now()}`,
          telephone: phone,
          nom: String(sessionData.nom || ""),
          prenom: String(sessionData.prenom || ""),
          role: (sessionData.pendingRole as "acheteur" | "producteur" | "transporteur") || "acheteur",
          ville,
          province: "Estuaire",
        });
        response = `END Bienvenue ${sessionData.prenom} ${sessionData.nom}!\nVotre compte est créé.\nTéléchargez l'app GaboTerroir pour plus de fonctionnalités.`;
      }
    } else if (inputs.length === 1) {
      switch (lastInput) {
        case "1": {
          const products = await db.select({
            id: productsTable.id, nom: productsTable.nom, prix: productsTable.prix,
            unite: productsTable.unite, quantiteDisponible: productsTable.quantiteDisponible,
          }).from(productsTable).where(eq(productsTable.producteurId, user.id)).limit(5);

          if (products.length === 0) {
            response = "CON Vous n'avez aucun produit.\n1. Ajouter un produit\n0. Menu principal";
          } else {
            const lines = products.map((p, i) => `${i + 1}. ${p.nom} ${p.quantiteDisponible}${p.unite} à ${p.prix}FCFA/${p.unite}`);
            response = `CON Vos produits:\n${lines.join("\n")}\n\n0. Menu principal`;
          }
          break;
        }
        case "2": {
          await upsertSession(sessionId, phone, "choisir_categorie", sessionData);
          response = MENU_CATEGORIES;
          break;
        }
        case "3": {
          const commandes = await db.select({
            id: ordersTable.id, statut: ordersTable.statut, montantTotal: ordersTable.montantTotal,
          }).from(ordersTable).where(eq(ordersTable.producteurId, user.id)).orderBy(desc(ordersTable.createdAt)).limit(5);

          if (commandes.length === 0) {
            response = "END Aucune commande reçue.";
          } else {
            const lines = commandes.map((c) => `#${c.id} ${c.statut.toUpperCase()} ${c.montantTotal}FCFA`);
            response = `END Vos commandes récentes:\n${lines.join("\n")}`;
          }
          break;
        }
        case "4": {
          response = `END Votre solde: ${parseFloat(user.walletSolde).toLocaleString()} FCFA\n\nPour recharger, utilisez l'app GaboTerroir.`;
          break;
        }
        case "5": {
          response = `END Aide GaboTerroir:\nSMS disponibles:\nREG Nom Ville → S'enregistrer\nP CODE QTE PRIX → Ajouter produit\nS ID QTE → Modifier stock\nPRIX ID MONTANT → Modifier prix\nCMD → Voir commandes\n\nApp: Téléchargez GaboTerroir sur votre smartphone.`;
          break;
        }
        default:
          response = MENU_PRINCIPAL;
      }
    } else if (inputs.length === 2 && inputs[0] === "2") {
      const categorie = CATEGORIES_MAP[lastInput] ?? "Autre";
      sessionData.categorie = categorie;
      await upsertSession(sessionId, phone, "saisir_quantite", sessionData);
      response = `CON Catégorie: ${categorie}\nEntrez la quantité disponible (en kg):`;
    } else if (inputs.length === 3 && inputs[0] === "2") {
      sessionData.quantite = lastInput;
      await upsertSession(sessionId, phone, "saisir_prix", sessionData);
      response = `CON Quantité: ${lastInput} kg\nEntrez le prix par kg (en FCFA):`;
    } else if (inputs.length === 4 && inputs[0] === "2") {
      const prix = parseFloat(lastInput);
      const quantite = parseFloat(String(sessionData.quantite || "0"));
      const categorie = String(sessionData.categorie || "Autre");
      const [product] = await db.insert(productsTable).values({
        producteurId: user.id,
        nom: categorie,
        categorie,
        prix: prix.toString(),
        unite: "kg",
        quantiteDisponible: quantite.toString(),
        province: user.province,
        ville: user.ville,
        viaUssd: true,
      }).returning();
      response = `END Produit publié!\nID: ${product.id}\n${categorie}: ${quantite}kg à ${prix} FCFA/kg\nVisible sur GaboTerroir maintenant.`;
    } else {
      response = MENU_PRINCIPAL;
    }

    res.set("Content-Type", "text/plain");
    res.send(response);
  } catch (err) {
    req.log.error({ err }, "POST /ussd error");
    res.set("Content-Type", "text/plain");
    res.send("END Une erreur s'est produite. Veuillez réessayer.");
  }
});

async function upsertSession(
  sessionId: string,
  telephone: string,
  step: string,
  data: Record<string, string | number>,
): Promise<void> {
  const [existing] = await db.select().from(ussdSessionsTable).where(eq(ussdSessionsTable.sessionId, sessionId)).limit(1);
  if (existing) {
    await db.update(ussdSessionsTable)
      .set({ currentStep: step, data: JSON.stringify(data), updatedAt: new Date() })
      .where(eq(ussdSessionsTable.sessionId, sessionId));
  } else {
    await db.insert(ussdSessionsTable).values({
      sessionId, telephone, currentStep: step, data: JSON.stringify(data), active: true,
    });
  }
}

export default router;
