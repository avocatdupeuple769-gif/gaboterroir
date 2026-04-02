import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import Colors from '@/constants/colors';
import { useApp, MappedProduct } from '@/context/AppContext';

export const CATEGORY_COLORS: Record<string, string> = {
  'Tubercules': '#8B4513',
  'Fruits': '#FF8C00',
  'Légumes': '#228B22',
  'Céréales': '#DAA520',
  'Viande & Poisson': '#DC143C',
  'Épices': '#9370DB',
  'Boissons': '#1E90FF',
  'Autre': '#696969',
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

export default function MapViewNative() {
  const { products } = useApp();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(25);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const getUserLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {}
    setLocationLoading(false);
  }, []);

  useEffect(() => { getUserLocation(); }, []);

  const productsWithDistance = useMemo(() =>
    products
      .filter(p => filterCategory == null || p.category === filterCategory)
      .map(p => ({
        ...p,
        distKm: userLocation
          ? haversineKm(userLocation.latitude, userLocation.longitude, p.raw.coordonneesGPS.latitude, p.raw.coordonneesGPS.longitude)
          : null,
      }))
      .filter(p => !userLocation || p.distKm == null || p.distKm <= selectedRadius)
      .sort((a, b) => (a.distKm ?? 999) - (b.distKm ?? 999)),
    [products, userLocation, selectedRadius, filterCategory]
  );

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products]);

  return (
    <View style={{ flex: 1 }}>
      {/* Radius + GPS button */}
      <View style={styles.radiusRow}>
        <Feather name="radio" size={14} color={Colors.textSecondary} />
        <Text style={styles.radiusLabel}>Rayon :</Text>
        {RADIUS_OPTIONS.map(r => (
          <TouchableOpacity
            key={r} activeOpacity={0.7}
            style={[styles.radiusPill, selectedRadius === r && styles.radiusPillActive]}
            onPress={() => setSelectedRadius(r)}
          >
            <Text style={[styles.radiusPillText, selectedRadius === r && styles.radiusPillTextActive]}>
              {r} km
            </Text>
          </TouchableOpacity>
        ))}
        {locationLoading
          ? <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
          : (
            <TouchableOpacity onPress={getUserLocation} style={styles.locBtn} activeOpacity={0.7}>
              <Feather name="navigation" size={15} color={Colors.primary} />
            </TouchableOpacity>
          )
        }
      </View>

      {/* GPS status banner */}
      {userLocation && (
        <View style={styles.gpsBanner}>
          <Feather name="navigation" size={12} color={Colors.primary} />
          <Text style={styles.gpsBannerText}>
            Position GPS active — {productsWithDistance.length} produit{productsWithDistance.length !== 1 ? 's' : ''} dans un rayon de {selectedRadius} km
          </Text>
        </View>
      )}

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        <TouchableOpacity style={[styles.catPill, filterCategory == null && styles.catPillActive]} onPress={() => setFilterCategory(null)} activeOpacity={0.7}>
          <Text style={[styles.catPillText, filterCategory == null && styles.catPillTextActive]}>Tous</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat} activeOpacity={0.7}
            style={[styles.catPill, filterCategory === cat && { backgroundColor: CATEGORY_COLORS[cat] ?? Colors.primary, borderColor: 'transparent' }]}
            onPress={() => setFilterCategory(prev => prev === cat ? null : cat)}
          >
            <Text style={[styles.catPillText, filterCategory === cat && styles.catPillTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product list with distances */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
        {productsWithDistance.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="map-pin" size={40} color={Colors.primary} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyTitle}>Aucun produit dans ce rayon</Text>
            <Text style={styles.emptySub}>Élargissez le rayon ou désactivez le filtre GPS</Text>
          </View>
        ) : (
          productsWithDistance.map(p => (
            <TouchableOpacity
              key={p.id} style={styles.card}
              onPress={() => router.push(`/product/${p.id}` as any)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: p.photoProduct }} style={styles.cardImg} contentFit="cover" />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.cardFarmer}>{p.farmerName}</Text>
                <Text style={styles.cardPrice}>{p.pricePerUnit.toLocaleString('fr-FR')} FCFA/{p.unit}</Text>
                <View style={styles.cardMeta}>
                  <View style={[styles.catTag, { backgroundColor: CATEGORY_COLORS[p.category] ?? Colors.primary }]}>
                    <Text style={styles.catTagText}>{p.category}</Text>
                  </View>
                  <View style={styles.locRow}>
                    <Feather name="map-pin" size={10} color={Colors.primary} />
                    <Text style={styles.locText}>
                      {p.distKm != null ? `${p.distKm.toFixed(1)} km` : `${p.city}, ${p.province}`}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  radiusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  radiusLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  radiusPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  radiusPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radiusPillText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  radiusPillTextActive: { color: '#fff' },
  locBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginLeft: 4,
  },
  gpsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: Colors.primaryLight, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  gpsBannerText: { fontSize: 12, color: Colors.primary, fontWeight: '600', flex: 1 },
  catRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  catPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  catPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catPillText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  catPillTextActive: { color: '#fff' },
  listContent: { padding: 12, gap: 10, paddingBottom: 30 },
  card: {
    flexDirection: 'row', gap: 12, backgroundColor: Colors.surface,
    borderRadius: 14, padding: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardImg: { width: 72, height: 72, borderRadius: 10 },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  cardFarmer: { fontSize: 11, color: Colors.textSecondary },
  cardPrice: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  catTagText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  emptySub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
});
