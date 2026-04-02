import { sendSMS } from "./africasTalking.js";
import { logger } from "../lib/logger.js";

export async function notifyProducteurVente(params: {
  producteurTelephone: string;
  produitNom: string;
  quantite: number;
  unite: string;
  montant: number;
  acheteurNom: string;
  operateur: string;
  orderId: number;
}): Promise<void> {
  const { producteurTelephone, produitNom, quantite, unite, montant, acheteurNom, operateur, orderId } = params;
  const msg = [
    `GaboTerroir #${orderId}`,
    `Votre produit "${produitNom}" a été vendu!`,
    `Quantité: ${quantite}${unite}`,
    `Paiement: ${montant.toLocaleString()} FCFA via ${operateur === "airtel_money" ? "Airtel Money" : "Moov Money"}`,
    `Acheteur: ${acheteurNom}`,
    `Les fonds seront libérés à la livraison.`,
  ].join("\n");

  const result = await sendSMS(producteurTelephone, msg);
  if (!result.success) {
    logger.warn({ producteurTelephone, orderId }, "Failed to notify producteur of sale");
  }
}

export async function notifyAcheteurConfirmation(params: {
  acheteurTelephone: string;
  orderId: number;
  codeSequestre: string;
  montant: number;
}): Promise<void> {
  const { acheteurTelephone, orderId, codeSequestre, montant } = params;
  const msg = [
    `GaboTerroir Commande #${orderId}`,
    `Paiement confirmé: ${montant.toLocaleString()} FCFA`,
    `Code séquestre: ${codeSequestre}`,
    `Donnez ce code au livreur pour libérer les fonds.`,
    `Merci de votre confiance!`,
  ].join("\n");

  await sendSMS(acheteurTelephone, msg);
}

export async function notifyTransporteurMission(params: {
  transporteurTelephone: string;
  orderId: number;
  adressePickup: string;
  adresseLivraison: string;
  montantCommission: number;
}): Promise<void> {
  const { transporteurTelephone, orderId, adressePickup, adresseLivraison, montantCommission } = params;
  const msg = [
    `GaboTerroir Mission #${orderId}`,
    `Récupérer: ${adressePickup}`,
    `Livrer à: ${adresseLivraison}`,
    `Commission: ${montantCommission.toLocaleString()} FCFA`,
    `Confirmez avec votre app GaboTerroir.`,
  ].join("\n");

  await sendSMS(transporteurTelephone, msg);
}

export async function notifyProducteurPaiementRecu(params: {
  producteurTelephone: string;
  orderId: number;
  montant: number;
  operateur: string;
}): Promise<void> {
  const { producteurTelephone, orderId, montant, operateur } = params;
  const msg = [
    `GaboTerroir Paiement #${orderId}`,
    `${montant.toLocaleString()} FCFA reçus via ${operateur === "airtel_money" ? "Airtel Money" : "Moov Money"}`,
    `Les fonds ont été transférés sur votre compte.`,
  ].join("\n");

  await sendSMS(producteurTelephone, msg);
}
