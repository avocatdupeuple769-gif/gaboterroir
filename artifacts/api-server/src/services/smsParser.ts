export interface SmsCommand {
  action: "ENREGISTRER" | "PRODUIT" | "STOCK" | "PRIX" | "AIDE" | "COMMANDES" | "INCONNU";
  data: Record<string, string | number>;
  raw: string;
}

const CATEGORIES: Record<string, string> = {
  MAI: "Maïs", MAN: "Manioc", BAN: "Banane", PLT: "Plantain",
  IGN: "Igname", PAT: "Patate douce", ARA: "Arachide", RIZ: "Riz",
  LGM: "Légumes", FRT: "Fruits", MAR: "Maraîcher", AUT: "Autre",
};

export function parseSMS(message: string, fromPhone: string): SmsCommand {
  const raw = message.trim().toUpperCase();
  const parts = raw.split(/[\s,;]+/);
  const cmd = parts[0];

  if (cmd === "ENREGISTRER" || cmd === "REG") {
    const nom = parts[1] ?? "";
    const ville = parts[2] ?? "";
    return { action: "ENREGISTRER", data: { nom, ville, telephone: fromPhone }, raw };
  }

  if (cmd === "PRODUIT" || cmd === "P") {
    const codeCategorie = parts[1] ?? "AUT";
    const categorie = CATEGORIES[codeCategorie] ?? "Autre";
    const quantite = parseFloat(parts[2] ?? "0");
    const prix = parseFloat(parts[3] ?? "0");
    const unite = parts[4] ?? "KG";
    return {
      action: "PRODUIT",
      data: { categorie, codeCategorie, quantite, prix, unite: unite.toLowerCase() },
      raw,
    };
  }

  if (cmd === "STOCK" || cmd === "S") {
    const produitId = parseInt(parts[1] ?? "0");
    const quantite = parseFloat(parts[2] ?? "0");
    return { action: "STOCK", data: { produitId, quantite }, raw };
  }

  if (cmd === "PRIX") {
    const produitId = parseInt(parts[1] ?? "0");
    const prix = parseFloat(parts[2] ?? "0");
    return { action: "PRIX", data: { produitId, prix }, raw };
  }

  if (cmd === "COMMANDES" || cmd === "CMD") {
    return { action: "COMMANDES", data: {}, raw };
  }

  if (cmd === "AIDE" || cmd === "HELP") {
    return { action: "AIDE", data: {}, raw };
  }

  return { action: "INCONNU", data: {}, raw };
}

export function formatHelp(): string {
  return [
    "=== GaboTerroir SMS ===",
    "REG Nom Ville → S'enregistrer",
    "P CODE QTE PRIX UNITE → Ajouter produit",
    "  Ex: P MAI 100 500 KG",
    "S ID QTE → Mettre à jour stock",
    "PRIX ID MONTANT → Modifier prix",
    "CMD → Voir mes commandes",
    "AIDE → Ce menu",
    "Codes: MAI=Maïs MAN=Manioc BAN=Banane PLT=Plantain IGN=Igname PAT=Patate ARA=Arachide RIZ=Riz LGM=Légumes FRT=Fruits",
  ].join("\n");
}

export function formatCommandesResponse(commandes: { id: number; statut: string; montantTotal: string }[]): string {
  if (commandes.length === 0) return "Aucune commande en cours.";
  const lines = commandes.slice(0, 5).map(
    (c) => `#${c.id} ${c.statut.toUpperCase()} ${c.montantTotal}FCFA`
  );
  return ["Vos commandes:", ...lines].join("\n");
}
