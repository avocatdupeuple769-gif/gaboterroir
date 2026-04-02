import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { MappedProduct } from '@/context/AppContext';

interface ProductCardProps {
  product: MappedProduct;
  horizontal?: boolean;
}

export function ProductCard({ product, horizontal = false }: ProductCardProps) {
  const router = useRouter();
  const hasFlash = !!product.flashSale?.active;

  const formatPrice = (p: number) =>
    p.toLocaleString('fr-FR') + ' FCFA';

  if (horizontal) {
    return (
      <Pressable
        onPress={() => router.push(`/product/${product.id}`)}
        style={({ pressed }) => [styles.hCard, pressed && { opacity: 0.9 }]}
      >
        <Image source={{ uri: product.photoProduct }} style={styles.hImage} contentFit="cover" />
        {hasFlash && (
          <View style={styles.flashBadge}>
            <Text style={styles.flashBadgeText}>-{product.flashSale!.discountPercent}%</Text>
          </View>
        )}
        <View style={styles.hInfo}>
          <Text style={styles.hName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.hLocation} numberOfLines={1}>
            📍 {product.city}, {product.province}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.hPrice}>{formatPrice(product.pricePerUnit)}</Text>
            <Text style={styles.hUnit}>/{product.unit}</Text>
          </View>
          {hasFlash && (
            <Text style={styles.hOriginalPrice}>{formatPrice(product.flashSale!.originalPrice)}</Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.id}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: product.photoProduct }} style={styles.image} contentFit="cover" />
        {hasFlash && (
          <View style={styles.flashBadge}>
            <Feather name="zap" size={10} color="#fff" />
            <Text style={styles.flashBadgeText}>-{product.flashSale!.discountPercent}%</Text>
          </View>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.farmerRow}>
          <Image source={{ uri: product.farmerPhoto }} style={styles.farmerAvatar} contentFit="cover" />
          <Text style={styles.farmerName} numberOfLines={1}>{product.farmerName.split(' ')[0]}</Text>
          <View style={styles.ratingRow}>
            <Feather name="star" size={10} color={Colors.star} />
            <Text style={styles.rating}>{product.farmerNote.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.location} numberOfLines={1}>📍 {product.city}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.pricePerUnit)}</Text>
          <Text style={styles.unit}>/{product.unit}</Text>
        </View>
        {hasFlash && (
          <Text style={styles.originalPrice}>{formatPrice(product.flashSale!.originalPrice)}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrapper: { position: 'relative' },
  image: { width: '100%', height: 130 },
  flashBadge: {
    position: 'absolute',
    top: 8, left: 8,
    backgroundColor: Colors.error,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  flashBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardInfo: { padding: 10, gap: 4 },
  cardName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  farmerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  farmerAvatar: { width: 18, height: 18, borderRadius: 9 },
  farmerName: { fontSize: 11, color: Colors.textSecondary, flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: 11, color: Colors.textSecondary },
  location: { fontSize: 11, color: Colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  price: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  unit: { fontSize: 11, color: Colors.textSecondary },
  originalPrice: { fontSize: 11, color: Colors.textMuted, textDecorationLine: 'line-through' },
  // Horizontal card
  hCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },
  hImage: { width: 90, height: 90 },
  hInfo: { flex: 1, padding: 10, gap: 3 },
  hName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  hLocation: { fontSize: 11, color: Colors.textMuted },
  hPrice: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  hUnit: { fontSize: 11, color: Colors.textSecondary },
  hOriginalPrice: { fontSize: 11, color: Colors.textMuted, textDecorationLine: 'line-through' },
});
