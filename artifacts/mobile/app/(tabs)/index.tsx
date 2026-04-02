import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ProductCategory } from '@/types';
import { MappedProduct } from '@/context/AppContext';

const CATEGORY_EMOJI: Record<string, string> = {
  'Tubercules': '🌱', 'Fruits': '🍒', 'Légumes': '🥦',
  'Céréales': '🌾', 'Viande & Poisson': '🐟',
  'Épices': '🌶️', 'Boissons': '🥤', 'Autre': '📦',
};

const ALL_CATS: ProductCategory[] = ['Tubercules', 'Fruits', 'Légumes', 'Céréales', 'Viande & Poisson', 'Épices', 'Boissons', 'Autre'];

export default function HomeScreen() {
  const { products, flashSaleProducts, addToCart, productsLoading } = useApp();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<ProductCategory | null>(null);

  const role = user?.role ?? 'acheteur';
  const isProducteur = role === 'producteur';
  const isTransporteur = role === 'transporteur';

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = !selectedCat || p.category === selectedCat;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.farmerName.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, search]);

  if (isTransporteur) {
    return <TransporteurAccueil topPad={topPad} btmPad={btmPad} />;
  }

  if (isProducteur) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 10 }]}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.pageTitle}>{user?.prenom ?? 'Producteur'} 🌿</Text>
          </View>
          <TouchableOpacity
            style={styles.publishBtn}
            onPress={() => router.push('/add-product' as any)}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.publishBtnText}>Publier une récolte</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + 90 }}>
          {/* Quick actions */}
          <View style={styles.quickActions}>
            <Pressable
              style={({ pressed }) => [styles.quickCard, { opacity: pressed ? 0.88 : 1 }]}
              onPress={() => router.push('/(tabs)/seller' as any)}
            >
              <Feather name="layers" size={22} color={Colors.primary} />
              <Text style={styles.quickCardLabel}>Mes stocks</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickCard, { opacity: pressed ? 0.88 : 1 }]}
              onPress={() => router.push('/(tabs)/transactions' as any)}
            >
              <Feather name="trending-up" size={22} color={Colors.success} />
              <Text style={styles.quickCardLabel}>Mes ventes</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickCard, { opacity: pressed ? 0.88 : 1 }]}
              onPress={() => router.push('/sms-access' as any)}
            >
              <Feather name="message-square" size={22} color="#7B1FA2" />
              <Text style={styles.quickCardLabel}>Accès SMS</Text>
            </Pressable>
          </View>

          {/* Stats banner */}
          <View style={styles.statsBanner}>
            <View style={styles.statsBannerItem}>
              <Text style={styles.statsBannerVal}>{products.filter(p => p.raw.idVendeur === user?.id).length}</Text>
              <Text style={styles.statsBannerLabel}>Produits actifs</Text>
            </View>
            <View style={styles.statsBannerDivider} />
            <View style={styles.statsBannerItem}>
              <Text style={styles.statsBannerVal}>0</Text>
              <Text style={styles.statsBannerLabel}>Commandes reçues</Text>
            </View>
            <View style={styles.statsBannerDivider} />
            <View style={styles.statsBannerItem}>
              <Text style={[styles.statsBannerVal, { color: Colors.primary }]}>0 F</Text>
              <Text style={styles.statsBannerLabel}>Revenus</Text>
            </View>
          </View>

          {/* Marketplace preview */}
          <View style={[styles.listSection, { marginTop: 4 }]}>
            <Text style={styles.sectionHeading}>🛒 Le marché aujourd'hui</Text>
            <View style={styles.productList}>
              {filtered.slice(0, 8).map(p => (
                <ProductRow key={p.id} product={p} onPress={() => router.push(`/product/${p.id}`)} onAdd={() => addToCart(p)} />
              ))}
              {filtered.length === 0 && (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🌾</Text>
                  <Text style={styles.emptyTitle}>{productsLoading ? 'Chargement…' : 'Aucun produit'}</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Acheteur view
  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.buyerHeader, { paddingTop: topPad + 10 }]}>
        <Text style={styles.pageTitle}>Boutique</Text>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Que recherchez-vous aujourd'hui ?"
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + 90 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catPills}
          style={{ paddingTop: 12 }}
        >
          <Pressable
            onPress={() => setSelectedCat(null)}
            style={[styles.pill, !selectedCat && styles.pillActive]}
          >
            <Text style={[styles.pillText, !selectedCat && styles.pillTextActive]}>Tout</Text>
          </Pressable>
          {ALL_CATS.map(cat => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCat(cat)}
              style={[styles.pill, selectedCat === cat && styles.pillActive]}
            >
              <Text style={[styles.pillText, selectedCat === cat && styles.pillTextActive]}>
                {CATEGORY_EMOJI[cat]} {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {flashSaleProducts.length > 0 && !search && (
          <View style={styles.flashSection}>
            <View style={styles.flashHeader}>
              <View style={styles.flashTitleRow}>
                <Feather name="zap" size={16} color={Colors.error} />
                <Text style={styles.flashTitle}>Urgences du Terroir</Text>
              </View>
              <Text style={styles.flashUrgency}>À saisir avant 48h !</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flashList}>
              {flashSaleProducts.map(p => (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/product/${p.id}`)}
                  style={({ pressed }) => [styles.flashCard, { opacity: pressed ? 0.9 : 1 }]}
                >
                  <View style={styles.flashCardTop}>
                    <View style={styles.flashTimer}>
                      <Feather name="zap" size={10} color={Colors.error} />
                      <Text style={styles.flashTimerText}>12h 55min</Text>
                    </View>
                    <View style={[styles.flashIcon, { backgroundColor: '#E8F5E9' }]}>
                      <Text style={styles.flashIconEmoji}>{CATEGORY_EMOJI[p.category] ?? '📦'}</Text>
                    </View>
                    <View style={styles.flashBadge}>
                      <Text style={styles.flashBadgeText}>-{p.flashSale?.discountPercent ?? 30}%</Text>
                    </View>
                  </View>
                  <View style={styles.flashCardInfo}>
                    <Text style={styles.flashCardName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.flashCardSeller} numberOfLines={1}>{p.farmerName.split(' ').slice(0, 2).join(' ')}</Text>
                    <View style={styles.flashPriceRow}>
                      <Text style={styles.flashOriginal}>{(p.flashSale?.originalPrice ?? p.pricePerUnit).toLocaleString('fr-FR')}F</Text>
                      <Text style={styles.flashNew}> {p.pricePerUnit.toLocaleString('fr-FR')} F</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.flashAddBtn} onPress={() => addToCart(p)} activeOpacity={0.8}>
                    <Feather name="plus" size={16} color="#fff" />
                  </TouchableOpacity>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.listSection}>
          <Text style={styles.listCount}>{filtered.length} produit{filtered.length !== 1 ? 's' : ''}</Text>
          <View style={styles.productList}>
            {filtered.map(p => (
              <ProductRow key={p.id} product={p} onPress={() => router.push(`/product/${p.id}`)} onAdd={() => addToCart(p)} />
            ))}
            {filtered.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🌾</Text>
                <Text style={styles.emptyTitle}>{productsLoading ? 'Chargement…' : 'Aucun produit disponible'}</Text>
                {!productsLoading && (
                  <Text style={styles.emptySub}>Revenez bientôt, les producteurs publient régulièrement.</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function TransporteurAccueil({ topPad, btmPad }: { topPad: number; btmPad: number }) {
  const { user } = useAuth();
  const router = useRouter();
  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View>
          <Text style={styles.greeting}>Bienvenue,</Text>
          <Text style={styles.pageTitle}>{user?.prenom ?? 'Transporteur'} 🚛</Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + 90, gap: 16, paddingHorizontal: 16, paddingTop: 16 }}>
        <TouchableOpacity
          style={styles.radarBtn}
          onPress={() => router.push('/(tabs)/transport' as any)}
          activeOpacity={0.85}
        >
          <Feather name="radio" size={24} color="#fff" />
          <View>
            <Text style={styles.radarBtnTitle}>Rechercher des charges</Text>
            <Text style={styles.radarBtnSub}>Voir les livraisons à proximité</Text>
          </View>
          <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <Pressable style={({ pressed }) => [styles.quickCard, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => router.push('/(tabs)/map' as any)}>
            <Feather name="map" size={22} color={Colors.blue} />
            <Text style={styles.quickCardLabel}>Carte</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.quickCard, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => router.push('/(tabs)/transactions' as any)}>
            <Feather name="dollar-sign" size={22} color={Colors.success} />
            <Text style={styles.quickCardLabel}>Mes gains</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.quickCard, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => router.push('/(tabs)/profile' as any)}>
            <Feather name="star" size={22} color={Colors.warning} />
            <Text style={styles.quickCardLabel}>Ma note</Text>
          </Pressable>
        </View>

        <View style={styles.statsBanner}>
          <View style={styles.statsBannerItem}>
            <Text style={styles.statsBannerVal}>0</Text>
            <Text style={styles.statsBannerLabel}>Livraisons</Text>
          </View>
          <View style={styles.statsBannerDivider} />
          <View style={styles.statsBannerItem}>
            <Text style={styles.statsBannerVal}>{user?.note?.toFixed(1) ?? '5.0'} ⭐</Text>
            <Text style={styles.statsBannerLabel}>Ma note</Text>
          </View>
          <View style={styles.statsBannerDivider} />
          <View style={styles.statsBannerItem}>
            <Text style={[styles.statsBannerVal, { color: Colors.primary }]}>0 F</Text>
            <Text style={styles.statsBannerLabel}>Gains totaux</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ProductRow({ product: p, onPress, onAdd }: { product: MappedProduct; onPress: () => void; onAdd: () => void }) {
  const isFlash = p.flashSale?.active;
  const emoji = CATEGORY_EMOJI[p.category] ?? '📦';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.productRow, isFlash && styles.productRowFlash, { opacity: pressed ? 0.95 : 1 }]}
    >
      <View style={styles.productEmoji}>
        <Text style={styles.productEmojiText}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.productTopRow}>
          <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
          {isFlash ? (
            <View style={styles.flashTag}>
              <Feather name="zap" size={9} color="#fff" />
              <Text style={styles.flashTagText}>-{p.flashSale!.discountPercent}%</Text>
            </View>
          ) : p.province ? (
            <View style={styles.provinceTag}>
              <Text style={styles.provinceTagText}>{p.province.slice(0, 9)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.productPriceRow}>
          {isFlash && (
            <Text style={styles.priceOriginal}>{(p.flashSale!.originalPrice).toLocaleString('fr-FR')}F</Text>
          )}
          <Text style={[styles.priceNew, isFlash && { color: Colors.error }]}>
            {p.pricePerUnit.toLocaleString('fr-FR')} F/{p.unit}
          </Text>
          <Text style={styles.productQty}>· {p.quantity}{p.unit}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
        <Feather name="plus" size={16} color="#fff" />
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16, paddingBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  greeting: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  pageTitle: { fontSize: 24, fontWeight: '900', color: Colors.text },
  publishBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  publishBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  radarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.primary, borderRadius: 18,
    paddingHorizontal: 20, paddingVertical: 18,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  radarBtnTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  radarBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  quickActions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 6,
  },
  quickCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  quickCardLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  statsBanner: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    marginHorizontal: 16, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border, marginTop: 6,
  },
  statsBannerItem: { flex: 1, alignItems: 'center' },
  statsBannerVal: { fontSize: 18, fontWeight: '900', color: Colors.text },
  statsBannerLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statsBannerDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  sectionHeading: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  buyerHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16, paddingBottom: 10,
    flexDirection: 'column', gap: 10,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  catPills: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  pillTextActive: { color: '#fff' },
  flashSection: { marginBottom: 12 },
  flashHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 8,
  },
  flashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flashTitle: { fontSize: 15, fontWeight: '800', color: Colors.error },
  flashUrgency: { fontSize: 12, fontWeight: '600', color: Colors.error },
  flashList: { paddingHorizontal: 16, gap: 10 },
  flashCard: {
    width: 130, backgroundColor: Colors.surface,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.error + '30',
    shadowColor: Colors.error, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  flashCardTop: { padding: 8, position: 'relative' },
  flashTimer: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.error + '15',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6,
    alignSelf: 'flex-start', marginBottom: 6,
  },
  flashTimerText: { fontSize: 9, fontWeight: '700', color: Colors.error },
  flashIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  flashIconEmoji: { fontSize: 20 },
  flashBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: Colors.error, borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  flashBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  flashCardInfo: { paddingHorizontal: 8, paddingBottom: 4, gap: 1 },
  flashCardName: { fontSize: 11, fontWeight: '800', color: Colors.text },
  flashCardSeller: { fontSize: 10, color: Colors.textSecondary },
  flashPriceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  flashOriginal: { fontSize: 10, color: Colors.textMuted, textDecorationLine: 'line-through' },
  flashNew: { fontSize: 12, fontWeight: '900', color: Colors.error },
  flashAddBtn: {
    backgroundColor: Colors.error, margin: 6,
    borderRadius: 8, padding: 7, alignItems: 'center',
  },
  listSection: { paddingHorizontal: 16, gap: 8 },
  listCount: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  productList: { gap: 6 },
  productRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  productRowFlash: { borderColor: Colors.error + '30' },
  productEmoji: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F0FBF0', alignItems: 'center', justifyContent: 'center',
  },
  productEmojiText: { fontSize: 22 },
  productTopRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  productName: { flex: 1, fontSize: 13, fontWeight: '800', color: Colors.text },
  flashTag: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.error, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6,
  },
  flashTagText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  provinceTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  provinceTagText: { fontSize: 9, fontWeight: '700', color: Colors.primary },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceOriginal: { fontSize: 11, color: Colors.textMuted, textDecorationLine: 'line-through' },
  priceNew: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  productQty: { fontSize: 11, color: Colors.textMuted },
  addBtn: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: 30, gap: 8, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
