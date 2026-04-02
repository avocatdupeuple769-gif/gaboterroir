import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator, Alert, Platform, Pressable, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

export default function CartScreen() {
  const { cart, cartTotal, removeFromCart, updateCartQty, checkoutCart, clearCart } = useApp();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ordering, setOrdering] = React.useState(false);
  const topPadding = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const btmPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleOrder = () => {
    const buyerName = user?.prenom && user?.nom
      ? `${user.prenom} ${user.nom}`
      : user?.telephone ?? 'Acheteur';
    const buyerId = user?.id ?? 'buyer_local';

    Alert.alert(
      'Confirmer la commande',
      `Total : ${cartTotal.toLocaleString('fr-FR')} FCFA\n\n💳 Le montant sera placé en séquestre Airtel Money / Moov Money et libéré au vendeur uniquement à la réception confirmée.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: '✅ Payer & Commander',
          onPress: async () => {
            setOrdering(true);
            try {
              const txs = await checkoutCart(buyerName, buyerId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              const codes = txs.map(t => `🔐 ${t.codeEscrow}`).join('  |  ');
              Alert.alert(
                'Commande & séquestre activés !',
                `${txs.length} commande(s) en cours.\n\nVotre code séquestre :\n\n${codes}\n\nGardez ce code et donnez-le au livreur à la réception pour libérer les fonds.`,
                [{ text: 'Voir mes commandes', onPress: () => router.push('/(tabs)/transactions' as any) }]
              );
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de créer la commande. Réessayez.');
            } finally {
              setOrdering(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <Text style={styles.title}>Mon Panier</Text>
        {cart.length > 0 && (
          <TouchableOpacity onPress={clearCart} activeOpacity={0.7}>
            <Text style={styles.clearBtn}>Vider</Text>
          </TouchableOpacity>
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptyText}>Ajoutez des produits depuis la marketplace</Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[styles.list, { paddingBottom: btmPadding + 120 }]}
            showsVerticalScrollIndicator={false}
          >
            {cart.map(item => (
              <View key={item.product.id} style={styles.cartItem}>
                <Image source={{ uri: item.product.photoProduct }} style={styles.itemImage} contentFit="cover" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                  <Text style={styles.itemVendeur}>{item.product.farmerName}</Text>
                  <Text style={styles.itemPrice}>
                    {item.product.pricePerUnit.toLocaleString('fr-FR')} FCFA/{item.product.unit}
                  </Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    onPress={() => updateCartQty(item.product.id, item.quantity - 1)}
                    style={styles.qtyBtn}
                    activeOpacity={0.7}
                  >
                    <Feather name={item.quantity === 1 ? 'trash-2' : 'minus'} size={14} color={item.quantity === 1 ? Colors.error : Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qty}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateCartQty(item.product.id, item.quantity + 1)}
                    style={styles.qtyBtn}
                    activeOpacity={0.7}
                  >
                    <Feather name="plus" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Order summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
              {cart.map(item => (
                <View key={item.product.id} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel} numberOfLines={1}>
                    {item.product.name} × {item.quantity}
                  </Text>
                  <Text style={styles.summaryValue}>
                    {(item.product.pricePerUnit * item.quantity).toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              ))}
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{cartTotal.toLocaleString('fr-FR')} FCFA</Text>
              </View>
            </View>

            <View style={styles.paymentInfo}>
              <Feather name="shield" size={16} color={Colors.primary} />
              <Text style={styles.paymentText}>
                Paiement sécurisé via Airtel Money ou Moov Money
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: btmPadding + 10 }]}>
            <View style={styles.footerTotal}>
              <Text style={styles.footerTotalLabel}>Total à payer</Text>
              <Text style={styles.footerTotalValue}>{cartTotal.toLocaleString('fr-FR')} FCFA</Text>
            </View>
            <Pressable
              onPress={handleOrder}
              disabled={ordering}
              style={({ pressed }) => [styles.orderBtn, ordering && { opacity: 0.7 }, { opacity: pressed ? 0.85 : 1 }]}
            >
              {ordering
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Feather name="check-circle" size={18} color="#fff" />
                    <Text style={styles.orderBtnText}>Commander maintenant</Text>
                  </>
              }
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 4,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  clearBtn: { fontSize: 14, color: Colors.error, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  list: { padding: 16, gap: 12 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 14,
    padding: 12, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemImage: { width: 70, height: 70, borderRadius: 10 },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  itemVendeur: { fontSize: 12, color: Colors.textSecondary },
  itemPrice: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  qtyControls: { alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  qty: { fontSize: 15, fontWeight: '700', color: Colors.text, minWidth: 24, textAlign: 'center' },
  summary: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  summaryValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  summaryTotal: {
    paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: '800', color: Colors.text },
  totalValue: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  paymentInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12, padding: 12,
  },
  paymentText: { fontSize: 13, color: Colors.primary, flex: 1 },
  footer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16, paddingTop: 16,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 8,
  },
  footerTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTotalLabel: { fontSize: 14, color: Colors.textSecondary },
  footerTotalValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  orderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16,
  },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
