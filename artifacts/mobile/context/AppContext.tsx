import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  query, orderBy, setDoc,
} from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import { uploadPhoto, uploadVideo } from '@/lib/storageUpload';
import {
  notifySellerNewOrder,
  notifyBuyerSellerConfirmed,
  notifyBuyerDeliveryReady,
  notifySellerPaymentReleased,
} from '@/lib/notifications';
import { Product, FlashSale, Transaction } from '@/types';
import { productsApi, ApiProduct } from '@/lib/api';

export interface MappedProduct {
  id: string;
  name: string;
  category: string;
  province: string;
  pricePerUnit: number;
  unit: string;
  quantity: number;
  farmerName: string;
  farmerPhoto: string;
  farmerNote: number;
  city: string;
  createdAt: string;
  photoProduct: string;
  flashSale?: FlashSale;
  raw: Product;
}

function mapApiProductToMapped(p: ApiProduct): MappedProduct {
  const isFlash = p.isFlashSale && p.flashSalePrice != null && p.flashSaleExpiry != null;
  const originalPrice = parseFloat(p.prix);
  const discountedPrice = p.flashSalePrice ? parseFloat(p.flashSalePrice) : originalPrice;
  const discountPercent = isFlash ? Math.round((1 - discountedPrice / originalPrice) * 100) : 0;

  const fakeRaw: Product = {
    id: String(p.id),
    nom: p.nom,
    categorie: p.categorie as Product['categorie'],
    unite: p.unite,
    prix: originalPrice,
    quantite: parseFloat(p.quantiteDisponible),
    province: p.province as Product['province'],
    statut: (p.statut === 'disponible' ? 'disponible' : 'vendu') as Product['statut'],
    description: p.description ?? '',
    idVendeur: p.producteurId,
    vendeurNom: p.producteurPrenom ? `${p.producteurPrenom} ${p.producteurNom ?? ''}`.trim() : (p.producteurNom ?? 'Producteur'),
    vendeurPhoto: '',
    vendeurNote: p.producteurRating ? parseFloat(p.producteurRating) : 0,
    coordonneesGPS: { latitude: 0, longitude: 0, village: p.ville ?? p.province },
    photoProduct: p.photos?.[0] ?? '',
    photos: p.photos ?? [],
    videoProduct: p.videoUrl ?? null,
    flashSale: isFlash ? {
      active: true,
      discountedPrice,
      originalPrice,
      discountPercent,
      startedAt: p.createdAt,
      expiresAt: p.flashSaleExpiry ?? '',
    } : undefined,
    createdAt: p.createdAt,
  };

  return {
    id: String(p.id),
    name: p.nom,
    category: p.categorie,
    province: p.province,
    pricePerUnit: isFlash ? discountedPrice : originalPrice,
    unit: p.unite,
    quantity: parseFloat(p.quantiteDisponible),
    farmerName: fakeRaw.vendeurNom,
    farmerPhoto: '',
    farmerNote: fakeRaw.vendeurNote,
    city: p.ville ?? p.province,
    createdAt: p.createdAt,
    photoProduct: p.photos?.[0] ?? '',
    flashSale: fakeRaw.flashSale ?? undefined,
    raw: fakeRaw,
  };
}

export interface CartItem {
  product: MappedProduct;
  quantity: number;
}

function mapProduct(p: Product): MappedProduct {
  return {
    id: p.id,
    name: p.nom,
    category: p.categorie,
    province: p.province,
    pricePerUnit: p.flashSale?.active ? p.flashSale.discountedPrice : p.prix,
    unit: p.unite,
    quantity: p.quantite,
    farmerName: p.vendeurNom,
    farmerPhoto: p.vendeurPhoto,
    farmerNote: p.vendeurNote,
    city: p.coordonneesGPS.village,
    createdAt: p.createdAt,
    photoProduct: p.photoProduct,
    flashSale: p.flashSale,
    raw: p,
  };
}

interface AppContextType {
  products: MappedProduct[];
  flashSaleProducts: MappedProduct[];
  cart: CartItem[];
  cartTotal: number;
  transactions: Transaction[];
  productsLoading: boolean;
  transactionsLoading: boolean;
  addToCart: (product: MappedProduct, qty: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  checkoutCart: (buyerName: string, buyerId: string) => Promise<Transaction[]>;
  addProduct: (product: Product) => Promise<void>;
  sellerConfirmTransaction: (transactionId: string, photo: string) => Promise<void>;
  addDeliveryPhoto: (transactionId: string, photo: string) => Promise<void>;
  buyerConfirmDelivery: (transactionId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [apiMappedProducts, setApiMappedProducts] = useState<MappedProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const transactionsRef = useRef<Transaction[]>([]);
  const useApiProducts = useRef(false);

  // Try REST API first, fall back to Firestore
  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);

    productsApi.list({ limit: 100 })
      .then(res => {
        if (cancelled) return;
        if (res.data && res.data.length > 0) {
          useApiProducts.current = true;
          setApiMappedProducts(res.data.map(mapApiProductToMapped));
          setProductsLoading(false);
        } else {
          useApiProducts.current = false;
          setProductsLoading(false);
        }
      })
      .catch(() => {
        useApiProducts.current = false;
        if (!cancelled) setProductsLoading(false);
      });

    // Also subscribe to Firestore for real-time updates
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      if (cancelled) return;
      const firestoreProducts = snap.docs.map(d => d.data() as Product);
      setRawProducts(firestoreProducts);
      if (!useApiProducts.current) setProductsLoading(false);
    }, (err) => {
      console.warn('Firestore products error:', err);
      if (!cancelled && !useApiProducts.current) setProductsLoading(false);
    });

    return () => { cancelled = true; unsub(); };
  }, []);

  // --- Feature 4: Real-time transactions from Firestore ---
  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const txs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Transaction));
      transactionsRef.current = txs;
      setTransactions(txs);
      setTransactionsLoading(false);
    }, (err) => {
      console.warn('Firestore transactions error:', err);
      setTransactionsLoading(false);
    });
    return unsub;
  }, []);

  const products = useMemo<MappedProduct[]>(() => {
    if (useApiProducts.current && apiMappedProducts.length > 0) {
      return apiMappedProducts;
    }
    return rawProducts.filter(p => p.statut === 'disponible').map(mapProduct);
  }, [rawProducts, apiMappedProducts]);

  const flashSaleProducts = useMemo<MappedProduct[]>(() => {
    const now = new Date().getTime();
    return products.filter(p => {
      if (!p.flashSale?.active) return false;
      return new Date(p.flashSale.expiresAt).getTime() > now;
    });
  }, [products]);

  const addToCart = useCallback((product: MappedProduct, qty: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { product, quantity: qty }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateCartQty = useCallback((productId: string, qty: number) => {
    setCart(prev => {
      if (qty <= 0) return prev.filter(i => i.product.id !== productId);
      return prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i);
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + i.product.pricePerUnit * i.quantity, 0),
    [cart]
  );

  // --- Feature 4: Checkout writes to Firestore ---
  const checkoutCart = useCallback(async (buyerName: string, buyerId: string): Promise<Transaction[]> => {
    const created: Transaction[] = [];
    for (let idx = 0; idx < cart.length; idx++) {
      const item = cart[idx];
      const code = String(Math.floor(1000 + Math.random() * 9000));
      const tx: Transaction = {
        id: `tx_${Date.now()}_${idx}`,
        idAcheteur: buyerId,
        idVendeur: item.product.raw.idVendeur,
        idTransporteur: null,
        produit: item.product.raw,
        montantTotal: item.product.pricePerUnit * item.quantity,
        commissionTransport: 0,
        codeEscrow: code,
        statut: 'pending_escrow',
        createdAt: new Date().toISOString(),
        acheteurNom: buyerName,
        vendeurNom: item.product.farmerName,
        transporteurNom: null,
        modeLivraison: 'transporteur',
        sellerConfirmPhoto: null,
        deliveryPhoto: null,
        quantity: item.quantity,
      };
      try {
        const docRef = await addDoc(collection(db, 'transactions'), tx);
        const savedTx = { ...tx, id: docRef.id };
        created.push(savedTx);
        // Notify seller
        notifySellerNewOrder(
          tx.idVendeur, buyerName, item.product.name,
          tx.montantTotal
        ).catch(() => {});
      } catch (e) {
        console.warn('Transaction save failed:', e);
        setTransactions(prev => [tx, ...prev]);
        created.push(tx);
      }
    }
    setCart([]);
    return created;
  }, [cart]);

  // addProduct: uploads all real photos + video to Firebase Storage, then saves to Firestore
  const addProduct = useCallback(async (product: Product) => {
    const pid = product.id;
    let mainPhoto = product.photoProduct;
    let allPhotos = product.photos ?? (mainPhoto ? [mainPhoto] : []);
    let videoUrl = product.videoProduct ?? null;

    // Upload all photos to Firebase Storage
    try {
      const uploadedPhotos: string[] = [];
      for (let i = 0; i < allPhotos.length; i++) {
        const uri = allPhotos[i];
        if (uri && !uri.startsWith('http')) {
          const url = await uploadPhoto(uri, `products/${pid}`, `photo_${i}.jpg`);
          uploadedPhotos.push(url);
        } else {
          uploadedPhotos.push(uri);
        }
      }
      allPhotos = uploadedPhotos;
      mainPhoto = uploadedPhotos[0] ?? mainPhoto;
    } catch (e) {
      console.warn('Photo upload failed:', e);
    }

    // Upload video to Firebase Storage if it's a local URI
    if (videoUrl && !videoUrl.startsWith('http')) {
      try {
        videoUrl = await uploadVideo(videoUrl, `products/${pid}`, 'demo.mp4');
      } catch (e) {
        console.warn('Video upload failed:', e);
        videoUrl = null;
      }
    }

    const finalProduct: Product = {
      ...product,
      photoProduct: mainPhoto,
      photos: allPhotos,
      videoProduct: videoUrl,
    };

    try {
      await setDoc(doc(db, 'products', pid), finalProduct);
    } catch (e) {
      console.warn('Firestore product save failed:', e);
      setRawProducts(prev => [finalProduct, ...prev]);
    }

    // Also save to REST API
    try {
      const apiProduct = await productsApi.create({
        producteurId: finalProduct.idVendeur,
        nom: finalProduct.nom,
        categorie: finalProduct.categorie,
        prix: String(finalProduct.prix),
        unite: finalProduct.unite,
        quantiteDisponible: String(finalProduct.quantite),
        description: finalProduct.description,
        province: finalProduct.province,
        ville: finalProduct.coordonneesGPS.village,
        photos: finalProduct.photos,
        videoUrl: finalProduct.videoProduct ?? undefined,
        isFlashSale: finalProduct.flashSale?.active ?? false,
        flashSalePrice: finalProduct.flashSale?.discountedPrice != null ? String(finalProduct.flashSale.discountedPrice) : undefined,
        flashSaleExpiry: finalProduct.flashSale?.expiresAt ?? undefined,
      });
      setApiMappedProducts(prev => [mapApiProductToMapped(apiProduct.data), ...prev]);
      useApiProducts.current = true;
    } catch (e) {
      console.warn('REST API product save failed (non-critical):', e);
    }
  }, []);

  // --- Feature 4: Seller confirms — updates Firestore ---
  const sellerConfirmTransaction = useCallback(async (transactionId: string, photo: string) => {
    let photoUrl = photo;
    if (photo && !photo.startsWith('http')) {
      try {
        photoUrl = await uploadPhoto(photo, `transactions/${transactionId}`, 'seller_confirm.jpg');
      } catch {}
    }
    const tx = transactionsRef.current.find(t => t.id === transactionId);
    try {
      await updateDoc(doc(db, 'transactions', transactionId), {
        statut: 'confirme_vendeur',
        sellerConfirmPhoto: photoUrl,
      });
      if (tx) {
        notifyBuyerSellerConfirmed(
          tx.idAcheteur, tx.produit.nom, tx.vendeurNom
        ).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore update failed:', e);
      setTransactions(prev =>
        prev.map(t => t.id === transactionId
          ? { ...t, statut: 'confirme_vendeur' as const, sellerConfirmPhoto: photoUrl }
          : t)
      );
    }
  }, []);

  const addDeliveryPhoto = useCallback(async (transactionId: string, photo: string) => {
    let photoUrl = photo;
    if (photo && !photo.startsWith('http')) {
      try {
        photoUrl = await uploadPhoto(photo, `transactions/${transactionId}`, 'delivery.jpg');
      } catch {}
    }
    const tx = transactionsRef.current.find(t => t.id === transactionId);
    try {
      await updateDoc(doc(db, 'transactions', transactionId), {
        statut: 'livre',
        deliveryPhoto: photoUrl,
      });
      if (tx) {
        notifyBuyerDeliveryReady(
          tx.idAcheteur, tx.produit.nom, tx.codeEscrow
        ).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore update failed:', e);
      setTransactions(prev =>
        prev.map(t => t.id === transactionId
          ? { ...t, statut: 'livre' as const, deliveryPhoto: photoUrl }
          : t)
      );
    }
  }, []);

  const buyerConfirmDelivery = useCallback(async (transactionId: string) => {
    const tx = transactionsRef.current.find(t => t.id === transactionId);
    try {
      await updateDoc(doc(db, 'transactions', transactionId), { statut: 'confirme' });
      if (tx) {
        notifySellerPaymentReleased(
          tx.idVendeur, tx.produit.nom, tx.montantTotal
        ).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore update failed:', e);
      setTransactions(prev =>
        prev.map(t => t.id === transactionId ? { ...t, statut: 'confirme' as const } : t)
      );
    }
  }, []);

  const value = useMemo(() => ({
    products, flashSaleProducts, cart, cartTotal, transactions,
    productsLoading, transactionsLoading,
    addToCart, removeFromCart, updateCartQty, clearCart, checkoutCart,
    addProduct, sellerConfirmTransaction, addDeliveryPhoto, buyerConfirmDelivery,
  }), [
    products, flashSaleProducts, cart, cartTotal, transactions,
    productsLoading, transactionsLoading,
    addToCart, removeFromCart, updateCartQty, clearCart, checkoutCart,
    addProduct, sellerConfirmTransaction, addDeliveryPhoto, buyerConfirmDelivery,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
