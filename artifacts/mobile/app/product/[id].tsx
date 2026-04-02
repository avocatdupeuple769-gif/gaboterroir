import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, Platform, Pressable, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashSaleTimer } from '@/components/FlashSaleTimer';
import { StarRating } from '@/components/StarRating';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, addToCart } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [qty, setQty] = useState(1);

  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Produit introuvable</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Retour</Text>
        </Pressable>
      </View>
    );
  }

  const hasFlash = !!product.flashSale?.active;
  const savings = hasFlash ? product.flashSale!.originalPrice - product.pricePerUnit : 0;

  const handleAddToCart = () => {
    addToCart(product, qty);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      '✅ Ajouté au panier',
      `${qty} ${product.unit} de ${product.name} ajouté(s)`,
      [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Voir panier', onPress: () => router.push('/cart') },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: product.photoProduct }} style={styles.image} contentFit="cover" />
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { top: (Platform.OS === 'web' ? 0 : insets.top) + 12 }]}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color={Colors.text} />
          </TouchableOpacity>
          {hasFlash && (
            <View style={[styles.flashOverlay, { top: (Platform.OS === 'web' ? 0 : insets.top) + 12 }]}>
              <Feather name="zap" size={14} color="#fff" />
              <Text style={styles.flashOverlayText}>FLASH SALE</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Flash timer */}
          {hasFlash && product.flashSale && (
            <FlashSaleTimer expiresAt={product.flashSale.expiresAt} />
          )}

          {/* Title & Price */}
          <View style={styles.titleSection}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.price}>{product.pricePerUnit.toLocaleString('fr-FR')} FCFA</Text>
            <Text style={styles.unit}>/{product.unit}</Text>
            {hasFlash && (
              <View style={styles.savingsChip}>
                <Text style={styles.savingsText}>Économie: {savings.toLocaleString('fr-FR')} FCFA</Text>
              </View>
            )}
          </View>
          {hasFlash && (
            <Text style={styles.originalPrice}>
              Prix normal : {product.flashSale!.originalPrice.toLocaleString('fr-FR')} FCFA
            </Text>
          )}

          {/* Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Feather name="package" size={16} color={Colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Stock disponible</Text>
                <Text style={styles.detailValue}>{product.quantity} {product.unit}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Feather name="map-pin" size={16} color={Colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Localisation</Text>
                <Text style={styles.detailValue}>{product.city}, {product.province}</Text>
              </View>
            </View>
          </View>

          {/* Farmer */}
          <View style={styles.farmerCard}>
            <Image source={{ uri: product.farmerPhoto }} style={styles.farmerAvatar} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.farmerLabel}>Producteur</Text>
              <Text style={styles.farmerName}>{product.farmerName}</Text>
              <StarRating rating={product.farmerNote} size={13} />
            </View>
            <TouchableOpacity style={styles.contactBtn} activeOpacity={0.7}>
              <Feather name="phone" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Payment methods */}
          <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>Modes de paiement</Text>
            <View style={styles.paymentMethods}>
              {['Airtel Money', 'Moov Money'].map(m => (
                <View key={m} style={styles.paymentMethod}>
                  <Feather name="smartphone" size={14} color={Colors.primary} />
                  <Text style={styles.paymentMethodText}>{m}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Escrow info */}
          <View style={styles.escrowCard}>
            <Feather name="shield" size={16} color={Colors.escrow} />
            <View style={{ flex: 1 }}>
              <Text style={styles.escrowTitle}>Paiement sécurisé</Text>
              <Text style={styles.escrowText}>
                Votre argent est bloqué jusqu'à la réception de la commande. Code escrow remis à la livraison.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.bottomBar, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 10 }]}>
        <View style={styles.qtyWrapper}>
          <TouchableOpacity onPress={() => setQty(q => Math.max(1, q - 1))} style={styles.qtyBtn} activeOpacity={0.7}>
            <Feather name="minus" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{qty}</Text>
          <TouchableOpacity onPress={() => setQty(q => Math.min(product.quantity, q + 1))} style={styles.qtyBtn} activeOpacity={0.7}>
            <Feather name="plus" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Pressable
          onPress={handleAddToCart}
          style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Feather name="shopping-cart" size={18} color="#fff" />
          <Text style={styles.addBtnText}>
            Ajouter • {(product.pricePerUnit * qty).toLocaleString('fr-FR')} FCFA
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFoundText: { fontSize: 18, fontWeight: '700', color: Colors.text },
  backLink: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  imageWrapper: { position: 'relative' },
  image: { width: '100%', height: 280 },
  backBtn: {
    position: 'absolute', left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
  flashOverlay: {
    position: 'absolute', right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.error,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10,
  },
  flashOverlayText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  content: { padding: 16, gap: 14 },
  titleSection: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  productName: { flex: 1, fontSize: 24, fontWeight: '800', color: Colors.text },
  categoryBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },
  categoryText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  priceSection: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' },
  price: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  unit: { fontSize: 14, color: Colors.textSecondary },
  savingsChip: { backgroundColor: Colors.error + '15', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100, marginLeft: 8 },
  savingsText: { fontSize: 12, fontWeight: '700', color: Colors.error },
  originalPrice: { fontSize: 13, color: Colors.textMuted, textDecorationLine: 'line-through', marginTop: -8 },
  detailsGrid: {
    backgroundColor: Colors.surface, borderRadius: 14,
    padding: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 11, color: Colors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '700', color: Colors.text },
  farmerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  farmerAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: Colors.primaryLight },
  farmerLabel: { fontSize: 11, color: Colors.textSecondary },
  farmerName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  contactBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  paymentCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  paymentTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  paymentMethods: { flexDirection: 'row', gap: 10 },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  paymentMethodText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  escrowCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.escrow + '15', borderRadius: 14, padding: 14 },
  escrowTitle: { fontSize: 13, fontWeight: '700', color: Colors.escrow },
  escrowText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginTop: 2 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 8,
  },
  qtyWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  qtyBtn: { padding: 6 },
  qtyValue: { fontSize: 18, fontWeight: '800', color: Colors.text, minWidth: 32, textAlign: 'center' },
  addBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
