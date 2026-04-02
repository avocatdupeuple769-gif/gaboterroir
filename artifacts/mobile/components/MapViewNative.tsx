import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';

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

export default function MapViewNative() {
  const { products } = useApp();
  const router = useRouter();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filtered = useMemo(() =>
    products.filter(p => filterCategory == null || p.category === filterCategory),
    [products, filterCategory]
  );

  const categories = useMemo(() =>
    Array.from(new Set(products.map(p => p.category))),
    [products]
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        <TouchableOpacity
          style={[styles.catPill, filterCategory == null && styles.catPillActive]}
          onPress={() => setFilterCategory(null)} activeOpacity={0.7}
        >
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
        {filtered.map(p => (
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
                  <Feather name="map-pin" size={10} color={Colors.textSecondary} />
                  <Text style={styles.locText}>{p.city}, {p.province}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  catRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 6, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  catPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  catPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catPillText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  catPillTextActive: { color: '#fff' },
  listContent: { padding: 12, gap: 10 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardImg: { width: 72, height: 72, borderRadius: 10 },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  cardFarmer: { fontSize: 11, color: Colors.textSecondary },
  cardPrice: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  catTagText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText: { fontSize: 10, color: Colors.textSecondary },
});
