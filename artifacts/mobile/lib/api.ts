const EXPLICIT_API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const RAW_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";
const REPL_ID = process.env.EXPO_PUBLIC_REPL_ID ?? "";

function getBaseUrl(): string {
  if (EXPLICIT_API_URL) return EXPLICIT_API_URL.replace(/\/+$/, "");
  if (RAW_DOMAIN) return `https://${RAW_DOMAIN}/api-server/api/v1`;
  if (REPL_ID) return `https://${REPL_ID}.repl.co/api-server/api/v1`;
  return "http://localhost:8080/api/v1";
}

const BASE_URL = getBaseUrl();

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface ApiProduct {
  id: number;
  nom: string;
  categorie: string;
  prix: string;
  unite: string;
  quantiteDisponible: string;
  description: string;
  province: string;
  ville: string;
  statut: string;
  photos: string[];
  videoUrl?: string;
  isFlashSale: boolean;
  flashSalePrice?: string;
  flashSaleExpiry?: string;
  producteurId: string;
  producteurNom?: string;
  producteurPrenom?: string;
  producteurTelephone?: string;
  producteurRating?: string;
  producteurVille?: string;
  createdAt: string;
}

export interface ApiUser {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  role: "acheteur" | "producteur" | "transporteur";
  ville: string;
  quartier: string;
  province: string;
  photoProfile: string;
  walletSolde: string;
  isKycVerified: boolean;
  onboardingComplete: boolean;
  rating: string;
  totalSales: number;
}

export interface ApiOrder {
  id: number;
  acheteurId: string;
  producteurId: string;
  transporteurId?: string;
  statut: string;
  montantTotal: string;
  codeSequestre: string;
  paymentMethod: string;
  paymentRef?: string;
  adresseLivraison: string;
  notes?: string;
  createdAt: string;
}

export const productsApi = {
  list: (params?: {
    categorie?: string;
    province?: string;
    search?: string;
    flashSale?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.categorie) q.set("categorie", params.categorie);
    if (params?.province) q.set("province", params.province);
    if (params?.search) q.set("search", params.search);
    if (params?.flashSale) q.set("flashSale", "true");
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    return apiFetch<{ data: ApiProduct[] }>(`/products?${q.toString()}`);
  },

  getById: (id: number) =>
    apiFetch<{ data: { products_table: ApiProduct } }>(`/products/${id}`),

  create: (data: Partial<ApiProduct>) =>
    apiFetch<{ data: ApiProduct }>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<ApiProduct>) =>
    apiFetch<{ data: ApiProduct }>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiFetch<{ success: boolean }>(`/products/${id}`, { method: "DELETE" }),

  byProducteur: (producteurId: string) =>
    apiFetch<{ data: ApiProduct[] }>(`/producteurs/${producteurId}/products`),

  categories: () =>
    apiFetch<{ data: { code: string; label: string; emoji: string }[] }>("/categories"),
};

export const usersApi = {
  create: (data: {
    id: string;
    telephone: string;
    nom?: string;
    prenom?: string;
    role?: string;
    ville?: string;
    province?: string;
  }) =>
    apiFetch<{ data: ApiUser; created: boolean }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getById: (id: string) =>
    apiFetch<{ data: ApiUser }>(`/users/${id}`),

  getByPhone: (telephone: string) =>
    apiFetch<{ data: ApiUser }>(`/users/phone/${telephone}`),

  update: (id: string, data: Partial<ApiUser>) =>
    apiFetch<{ data: ApiUser }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getTransactions: (id: string) =>
    apiFetch<{ data: unknown[] }>(`/users/${id}/transactions`),

  depositWallet: (id: string, data: {
    montant: number;
    paymentMethod: "airtel_money" | "moov_money";
    telephone: string;
  }) =>
    apiFetch<{ data: { newSolde: number; montant: number } }>(`/users/${id}/wallet/deposit`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  withdrawWallet: (id: string, data: {
    montant: number;
    paymentMethod: "airtel_money" | "moov_money";
    telephone: string;
  }) =>
    apiFetch<{ data: { newSolde: number; montant: number } }>(`/users/${id}/wallet/withdraw`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const ordersApi = {
  create: (data: {
    acheteurId: string;
    producteurId: string;
    items: { productId: number; quantite: number; prixUnitaire: number }[];
    adresseLivraison?: string;
    notes?: string;
    paymentMethod?: "airtel_money" | "moov_money" | "wallet";
    acheteurTelephone: string;
  }) =>
    apiFetch<{ data: ApiOrder }>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getById: (id: number) =>
    apiFetch<{ data: ApiOrder & { items: unknown[] } }>(`/orders/${id}`),

  getUserOrders: (userId: string, role: "acheteur" | "producteur" = "acheteur") =>
    apiFetch<{ data: ApiOrder[] }>(`/users/${userId}/orders?role=${role}`),

  confirmDelivery: (id: number, codeSequestre: string) =>
    apiFetch<{ success: boolean; message: string }>(`/orders/${id}/confirm-delivery`, {
      method: "POST",
      body: JSON.stringify({ codeSequestre }),
    }),

  updateStatus: (id: number, statut: string, transporteurId?: string) =>
    apiFetch<{ data: ApiOrder }>(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ statut, transporteurId }),
    }),
};

export const paymentsApi = {
  verify: (transactionId: string, operator: "airtel_money" | "moov_money") =>
    apiFetch<{ data: { success: boolean; status: string } }>("/payments/verify", {
      method: "POST",
      body: JSON.stringify({ transactionId, operator }),
    }),
};

export const smsApi = {
  send: (to: string, message: string) =>
    apiFetch<{ success: boolean; messageId?: string }>("/sms/send", {
      method: "POST",
      body: JSON.stringify({ to, message }),
    }),
};

export default {
  products: productsApi,
  users: usersApi,
  orders: ordersApi,
  payments: paymentsApi,
  sms: smsApi,
};
