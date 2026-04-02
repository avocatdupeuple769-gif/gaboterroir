import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import RatingModal from '@/components/RatingModal';
import { Transaction } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending_escrow: { label: 'Séquestre actif', color: Colors.warning, bg: Colors.warning + '18', icon: 'lock' },
  paye: { label: 'Payé · En attente', color: Colors.warning, bg: Colors.warning + '18', icon: 'clock' },
  confirme_vendeur: { label: 'Confirmé vendeur', color: Colors.blue, bg: Colors.blueSoft, icon: 'package' },
  en_route: { label: 'En route', color: Colors.blue, bg: Colors.blueSoft, icon: 'truck' },
  livre: { label: 'Livré', color: Colors.success, bg: Colors.success + '15', icon: 'check' },
  confirme: { label: 'Confirmé ✓', color: Colors.primary, bg: Colors.primaryLight, icon: 'check-circle' },
  completed: { label: 'Terminé ✓', color: Colors.primary, bg: Colors.primaryLight, icon: 'check-circle' },
};

export default function TransactionsScreen() {
  const { transactions, sellerConfirmTransaction, addDeliveryPhoto, buyerConfirmDelivery } = useApp();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [escrowInput, setEscrowInput] = useState<{ [id: string]: string }>({});
  const [activeTab, setActiveTab] = useState<'acheteur' | 'vendeur'>('acheteur');
  const [ratingTx, setRatingTx] = useState<Transaction | null>(null);
  const [showRating, setShowRating] = useState(false);

  const role = user?.role ?? 'acheteur';
  const isProducteurOrTransporteur = role === 'producteur' || role === 'transporteur';

  const myBuyerTxs = transactions.filter(t => t.idAcheteur === (user?.id ?? 'buyer1'));
  const mySellerTxs = transactions.filter(t => t.idVendeur === (user?.id ?? 'v1'));

  const displayTxs = isProducteurOrTransporteur
    ? (activeTab === 'vendeur' ? mySellerTxs : myBuyerTxs)
    : myBuyerTxs;

  const takeCameraPhoto = async (mode: 'front' | 'back'): Promise<string | null> => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission requise', 'Autorisez la caméra dans les paramètres.');
          return null;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.85,
          cameraType: mode === 'front'
            ? ImagePicker.CameraType.front
            : ImagePicker.CameraType.back,
        });
        if (!result.canceled && result.assets[0]) return result.assets[0].uri;
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission requise', 'Autorisez la galerie.');
          return null;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.85,
        });
        if (!result.canceled && result.assets[0]) return result.assets[0].uri;
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra.');
    }
    return null;
  };

  const handleSellerConfirm = async (t: Transaction) => {
    Alert.alert(
      '📦 Confirmer la commande',
      `Prenez une photo du colis préparé pour ${t.acheteurNom} (${t.produit.nom}).`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: '📷 Prendre la photo',
          onPress: async () => {
            const photo = await takeCameraPhoto('back');
            if (photo) {
              await sellerConfirmTransaction(t.id, photo);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Commande confirmée !', 'L\'acheteur a été notifié. La livraison peut commencer.');
            }
          },
        },
      ]
    );
  };

  const handleDeliveryPhoto = async (t: Transaction) => {
    Alert.alert(
      '📸 Photo de livraison',
      `Prenez une photo avec ${t.acheteurNom} au moment de la remise du colis. Cette photo libérera les fonds.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: '📷 Prendre la photo',
          onPress: async () => {
            const photo = await takeCameraPhoto('back');
            if (photo) {
              await addDeliveryPhoto(t.id, photo);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Photo enregistrée !', 'L\'acheteur peut maintenant confirmer la réception.');
            }
          },
        },
      ]
    );
  };

  const handleBuyerConfirm = (t: Transaction) => {
    const inputCode = escrowInput[t.id] ?? '';
    if (inputCode !== t.codeEscrow) {
      Alert.alert('❌ Code incorrect', `Le code séquestre "${inputCode}" ne correspond pas. Vérifiez votre SMS.`);
      return;
    }
    Alert.alert(
      '✅ Confirmer la réception',
      `Vous confirmez avoir reçu "${t.produit.nom}" de ${t.vendeurNom} ?\n\nLes fonds (${t.montantTotal.toLocaleString('fr-FR')} FCFA) seront libérés au vendeur.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await buyerConfirmDelivery(t.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Show rating modal after confirming delivery
            setRatingTx(t);
            setShowRating(true);
          },
        },
      ]
    );
  };

  const renderTransaction = (t: Transaction) => {
    const status = STATUS_CONFIG[t.statut] ?? STATUS_CONFIG.paye;
    const isSellerView = activeTab === 'vendeur' && isProducteurOrTransporteur;

    return (
      <View key={t.id} style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <Image source={{ uri: t.produit.photoProduct }} style={styles.productImg} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{t.produit.nom}</Text>
            {t.quantity && (
              <Text style={styles.quantity}>Qté : {t.quantity} {t.produit.unite}</Text>
            )}
            <Text style={styles.amount}>{t.montantTotal.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Feather name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          {isSellerView ? (
            <Text style={styles.metaLabel}>
              Acheteur : <Text style={styles.metaBold}>{t.acheteurNom}</Text>
            </Text>
          ) : (
            <Text style={styles.metaLabel}>
              Vendeur : <Text style={styles.metaBold}>{t.vendeurNom}</Text>
            </Text>
          )}
          {t.transporteurNom && (
            <Text style={styles.metaLabel}>
              Transport : <Text style={styles.metaBold}>{t.transporteurNom}</Text>
            </Text>
          )}
          <View style={styles.escrowRow}>
            <Feather name="lock" size={11} color={Colors.textMuted} />
            <Text style={styles.escrowCode}>Séquestre : {t.codeEscrow}</Text>
          </View>
        </View>

        {/* Seller photo preview */}
        {t.sellerConfirmPhoto && (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>📦 Photo colis vendeur</Text>
            <Image source={{ uri: t.sellerConfirmPhoto }} style={styles.delivPhoto} contentFit="cover" />
          </View>
        )}

        {/* Delivery photo preview */}
        {t.deliveryPhoto && (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>📸 Photo de livraison</Text>
            <Image source={{ uri: t.deliveryPhoto }} style={styles.delivPhoto} contentFit="cover" />
          </View>
        )}

        {/* SELLER ACTIONS */}
        {isSellerView && (t.statut === 'pending_escrow' || t.statut === 'paye') && (
          <TouchableOpacity
            onPress={() => handleSellerConfirm(t)}
            style={[styles.actionBtn, { backgroundColor: Colors.warning }]}
            activeOpacity={0.85}
          >
            <Feather name="camera" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Confirmer + Photo du colis</Text>
          </TouchableOpacity>
        )}

        {isSellerView && t.statut === 'confirme_vendeur' && (
          <TouchableOpacity
            onPress={() => handleDeliveryPhoto(t)}
            style={[styles.actionBtn, { backgroundColor: Colors.blue }]}
            activeOpacity={0.85}
          >
            <Feather name="camera" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Photo livraison avec l'acheteur</Text>
          </TouchableOpacity>
        )}

        {/* BUYER ACTIONS */}
        {!isSellerView && t.statut === 'pending_escrow' && (
          <View style={styles.confirmSection}>
            <View style={styles.escrowInfo}>
              <Feather name="lock" size={14} color={Colors.warning} />
              <Text style={[styles.escrowInfoText, { color: Colors.warning }]}>
                Paiement en séquestre. Votre code : <Text style={{ fontWeight: '900', letterSpacing: 4 }}>{t.codeEscrow}</Text>{'\n'}Donnez-le au livreur à la réception du colis.
              </Text>
            </View>
          </View>
        )}

        {!isSellerView && (t.statut === 'livre' || t.statut === 'en_route') && (
          <View style={styles.confirmSection}>
            <View style={styles.escrowInfo}>
              <Feather name="shield" size={14} color={Colors.blue} />
              <Text style={styles.escrowInfoText}>
                Entrez votre code séquestre pour confirmer la réception et libérer les fonds.
              </Text>
            </View>
            <TextInput
              style={styles.codeInput}
              placeholder="Code (ex: 4827)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={4}
              value={escrowInput[t.id] ?? ''}
              onChangeText={val => setEscrowInput(prev => ({ ...prev, [t.id]: val }))}
            />
            <TouchableOpacity
              onPress={() => handleBuyerConfirm(t)}
              style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
              activeOpacity={0.85}
            >
              <Feather name="check-circle" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Confirmer la réception</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <RatingModal
        visible={showRating}
        transaction={ratingTx}
        fromUserId={user?.id ?? ''}
        fromUserNom={user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : user?.telephone ?? ''}
        onClose={() => { setShowRating(false); setRatingTx(null); }}
      />
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>Suivi de vos commandes & séquestre</Text>

        {/* Tabs for Producteur/Transporteur */}
        {isProducteurOrTransporteur && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'acheteur' && styles.tabActive]}
              onPress={() => setActiveTab('acheteur')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'acheteur' && styles.tabTextActive]}>
                Mes achats
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'vendeur' && styles.tabActive]}
              onPress={() => setActiveTab('vendeur')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'vendeur' && styles.tabTextActive]}>
                Mes ventes
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: btmPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {displayTxs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{activeTab === 'vendeur' ? '🛍' : '📋'}</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'vendeur' ? 'Aucune vente' : 'Aucune commande'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'vendeur'
                ? 'Vos ventes apparaîtront ici lorsque des acheteurs commanderont vos produits.'
                : 'Ajoutez des produits au panier et commandez pour voir vos transactions ici.'}
            </Text>
          </View>
        ) : (
          displayTxs.map(t => renderTransaction(t))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingBottom: 0,
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 4,
  },
  title: { fontSize: 24, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, marginBottom: 12 },
  tabs: {
    flexDirection: 'row', gap: 8, marginBottom: 12,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  content: { padding: 16, gap: 14 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  productImg: { width: 58, height: 58, borderRadius: 10 },
  productName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  quantity: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  amount: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 3 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardBody: {
    paddingHorizontal: 14, paddingBottom: 14, gap: 5,
    borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12,
  },
  metaLabel: { fontSize: 13, color: Colors.textSecondary },
  metaBold: { fontWeight: '700', color: Colors.text },
  escrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  escrowCode: { fontSize: 13, fontWeight: '700', color: Colors.primary, fontFamily: 'monospace' },
  photoSection: {
    paddingHorizontal: 14, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12,
  },
  photoLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 },
  delivPhoto: { width: '100%', height: 160, borderRadius: 10 },
  confirmSection: {
    paddingHorizontal: 14, paddingBottom: 14, gap: 10,
    borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12,
  },
  escrowInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.blueSoft, borderRadius: 10, padding: 10,
  },
  escrowInfoText: { flex: 1, fontSize: 12, color: Colors.blue, lineHeight: 17 },
  codeInput: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 18, fontWeight: '800', color: Colors.text,
    textAlign: 'center', letterSpacing: 6,
    borderWidth: 2, borderColor: Colors.primary,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 14, marginTop: 0,
    borderRadius: 12, paddingVertical: 14,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
