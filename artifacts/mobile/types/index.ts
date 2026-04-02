export type UserRole = 'producteur' | 'transporteur' | 'acheteur';

export type KycStatus = 'none' | 'document_pending' | 'liveness_pending' | 'gps_pending' | 'verified' | 'rejected';

export interface KycData {
  documentPhoto: string | null;
  documentType: 'cni' | 'passport' | 'permis' | null;
  extractedName: string | null;
  extractedBirthdate: string | null;
  documentExpiry: string | null;
  selfiePhoto: string | null;
  livenessVerified: boolean;
  facialMatchScore: number;
  gpsPhoto: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsProvince: string | null;
  vehiclePhoto: string | null;
  insurancePhoto: string | null;
  verifiedAt: string | null;
}

export interface User {
  id: string;
  nom: string;
  prenom: string;
  ville: string;
  quartier: string;
  telephone: string;
  role: UserRole;
  photoProfile: string;
  cniVerified: boolean;
  province: string;
  walletSolde: number;
  note: number;
  createdAt: string;
  kycStatus: KycStatus;
  kycData: KycData | null;
  onboardingComplete: boolean;
}

export interface FlashSale {
  active: boolean;
  discountPercent: number;
  originalPrice: number;
  discountedPrice: number;
  startedAt: string;
  expiresAt: string;
}

export type Province =
  | 'Estuaire'
  | 'Haut-Ogooué'
  | 'Moyen-Ogooué'
  | 'Ngounié'
  | 'Nyanga'
  | 'Ogooué-Ivindo'
  | 'Ogooué-Lolo'
  | 'Ogooué-Maritime'
  | 'Woleu-Ntem';

export type ProductCategory =
  | 'Tubercules'
  | 'Fruits'
  | 'Légumes'
  | 'Céréales'
  | 'Viande & Poisson'
  | 'Épices'
  | 'Boissons'
  | 'Autre';

export type DeliveryMode = 'producteur' | 'acheteur' | 'transporteur';

export interface Product {
  id: string;
  idVendeur: string;
  vendeurNom: string;
  vendeurPhoto: string;
  vendeurNote: number;
  nom: string;
  categorie: ProductCategory;
  prix: number;
  quantite: number;
  unite: string;
  photoProduct: string;
  photos?: string[];
  videoProduct?: string | null;
  description?: string;
  coordonneesGPS: {
    latitude: number;
    longitude: number;
    village: string;
  };
  province: Province;
  statut: 'disponible' | 'vendu';
  createdAt: string;
  flashSale?: FlashSale;
}

export interface Transaction {
  id: string;
  idAcheteur: string;
  idVendeur: string;
  idTransporteur: string | null;
  produit: Product;
  montantTotal: number;
  commissionTransport: number;
  codeEscrow: string;
  statut: 'pending_escrow' | 'paye' | 'confirme_vendeur' | 'en_route' | 'livre' | 'confirme' | 'completed';
  createdAt: string;
  acheteurNom: string;
  vendeurNom: string;
  transporteurNom: string | null;
  distance?: number;
  modeLivraison: DeliveryMode;
  sellerConfirmPhoto?: string | null;
  deliveryPhoto?: string | null;
  quantity?: number;
}

export interface DemoVideo {
  id: string;
  title: string;
  description: string;
  uri: string;
  thumbnail: string;
  producteurNom: string;
  province: string;
  likes: number;
}

export type WalletOperationType = 'depot' | 'retrait' | 'vente' | 'achat';
export type WalletMethod = 'airtel' | 'moov';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletOperationType;
  amount: number;
  method?: WalletMethod;
  phone?: string;
  description: string;
  createdAt: string;
  statut: 'pending' | 'completed' | 'failed';
}

export interface Rating {
  id: string;
  transactionId: string;
  fromUserId: string;
  toUserId: string;
  note: number;
  comment?: string;
  produitNom: string;
  fromUserNom: string;
  createdAt: string;
}
