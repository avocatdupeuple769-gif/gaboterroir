import { Router } from "express";
import { db } from "../lib/db.js";
import { productsTable, usersTable, insertProductSchema } from "@workspace/db";
import { eq, and, ilike, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/products", async (req, res) => {
  try {
    const { categorie, province, statut, search, limit = "50", offset = "0", flashSale } = req.query as Record<string, string>;
    const conditions = [];

    if (categorie) conditions.push(eq(productsTable.categorie, categorie));
    if (province) conditions.push(eq(productsTable.province, province));
    if (statut) conditions.push(eq(productsTable.statut, statut as "disponible" | "epuise" | "suspendu"));
    else conditions.push(eq(productsTable.statut, "disponible"));
    if (search) conditions.push(ilike(productsTable.nom, `%${search}%`));
    if (flashSale === "true") conditions.push(eq(productsTable.isFlashSale, true));

    const products = await db
      .select({
        id: productsTable.id,
        nom: productsTable.nom,
        categorie: productsTable.categorie,
        prix: productsTable.prix,
        unite: productsTable.unite,
        quantiteDisponible: productsTable.quantiteDisponible,
        description: productsTable.description,
        province: productsTable.province,
        ville: productsTable.ville,
        statut: productsTable.statut,
        photos: productsTable.photos,
        videoUrl: productsTable.videoUrl,
        isFlashSale: productsTable.isFlashSale,
        flashSalePrice: productsTable.flashSalePrice,
        flashSaleExpiry: productsTable.flashSaleExpiry,
        viaSms: productsTable.viaSms,
        viaUssd: productsTable.viaUssd,
        createdAt: productsTable.createdAt,
        producteurId: productsTable.producteurId,
        producteurNom: usersTable.nom,
        producteurPrenom: usersTable.prenom,
        producteurTelephone: usersTable.telephone,
        producteurRating: usersTable.rating,
        producteurVille: usersTable.ville,
      })
      .from(productsTable)
      .leftJoin(usersTable, eq(productsTable.producteurId, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(productsTable.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({ data: products, total: products.length });
  } catch (err) {
    req.log.error({ err }, "GET /products error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db
      .select()
      .from(productsTable)
      .leftJoin(usersTable, eq(productsTable.producteurId, usersTable.id))
      .where(eq(productsTable.id, id))
      .limit(1);

    if (!product) return res.status(404).json({ error: "Produit introuvable" });
    res.json({ data: product });
  } catch (err) {
    req.log.error({ err }, "GET /products/:id error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const parsed = insertProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const [product] = await db.insert(productsTable).values(parsed.data).returning();
    res.status(201).json({ data: product });
  } catch (err) {
    req.log.error({ err }, "POST /products error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { producteurId, ...updates } = req.body as Record<string, unknown>;
    void producteurId;

    const [product] = await db
      .update(productsTable)
      .set({ ...updates, updatedAt: new Date() } as Parameters<typeof db.update>[0]["set"])
      .where(eq(productsTable.id, id))
      .returning();

    if (!product) return res.status(404).json({ error: "Produit introuvable" });
    res.json({ data: product });
  } catch (err) {
    req.log.error({ err }, "PUT /products/:id error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(productsTable)
      .set({ statut: "suspendu", updatedAt: new Date() })
      .where(eq(productsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /products/:id error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/producteurs/:id/products", async (req, res) => {
  try {
    const producteurId = req.params.id;
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.producteurId, producteurId))
      .orderBy(desc(productsTable.createdAt));
    res.json({ data: products });
  } catch (err) {
    req.log.error({ err }, "GET /producteurs/:id/products error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/categories", async (_req, res) => {
  const categories = [
    { code: "Tubercules", label: "Tubercules", emoji: "🍠" },
    { code: "Fruits", label: "Fruits", emoji: "🍌" },
    { code: "Légumes", label: "Légumes", emoji: "🥦" },
    { code: "Maraîcher", label: "Maraîcher", emoji: "🥕" },
    { code: "Céréales", label: "Céréales", emoji: "🌾" },
    { code: "Protéines", label: "Protéines", emoji: "🐟" },
    { code: "Épices", label: "Épices", emoji: "🌿" },
    { code: "Autre", label: "Autre", emoji: "🌱" },
  ];
  res.json({ data: categories });
});

export default router;
