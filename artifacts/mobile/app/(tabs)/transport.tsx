import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Transaction } from '@/types';

type DeliveryStage = 'idle' | 'camera' | 'ai_check' | 'otp_entry' | 'done';

export default function TransportScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { transactions, addDeliveryPhoto, buyerConfirmDelivery } = useApp();
  const { user } = useAuth();

  const [deliveryModal, setDeliveryModal] = useState<{
    tx: Transaction; stage: DeliveryStage; photoUri: string | null; otp: string;
  } | null>(null);

  // Orders waiting for a transporter (vendor confirmed, not yet picked up)
  const available = useMemo(() =>
    transactions.filter(t =>
      t.statut === 'confirme_vendeur' && t.modeLivraison === 'transporteur'
    ),
    [transactions]
  );

  // My ongoing deliveries
  const myDeliveries = useMemo(() =>
    transactions.filter(t =>
      t.idTransporteur === user?.id && t.statut === 'en_route'
    ),
    [transactions, user?.id]
  );

  const takePicture = async (): Promise<string | null> => {
    if (Platform.OS === 'web') return 'web_placeholder';
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission caméra requise', 'Activez la caméra dans les paramètres.');
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) return result.assets[0].uri;
    } catch {
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra.');
    }
    return null;
  };

  const acceptOrder = (tx: Transaction) => {
    Alert.alert(
      'Accepter la livraison',
      `Voulez-vous prendre en charge la livraison de "${tx.produit.nom}" ?\n${tx.vendeurNom} → ${tx.acheteurNom}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: '✅ Accepter',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              'Livraison acceptée !',
              `Allez chercher "${tx.produit.nom}" chez ${tx.vendeurNom}. Appuyez sur "Marquer livré" une fois arrivé chez l'acheteur.`
            );
          },
        },
      ]
    );
  };

  const startDeliveryFlow = (tx: Transaction) => {
    setDeliveryModal({ tx, stage: 'camera', photoUri: null, otp: '' });
  };

  const handleTakePhoto = async () => {
    if (!deliveryModal) return;
    const uri = await takePicture();
    if (!uri) return;
    setDeliveryModal(prev => prev ? { ...prev, stage: 'ai_check', photoUri: uri } : prev);
    // Simulate AI photo validation (2s delay)
    setTimeout(() => {
      setDeliveryModal(prev => prev ? { ...prev, stage: 'otp_entry' } : prev);
    }, 2200);
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryModal) return;
    const { tx, otp, photoUri } = deliveryModal;
    if (otp !== tx.codeEscrow) {
      Alert.alert('Code incorrect', 'Le code séquestre ne correspond pas. Demandez-le à l\'acheteur.');
      return;
    }
    setDeliveryModal(prev => prev ? { ...prev, stage: 'done' } : prev);
    await addDeliveryPhoto(tx.id, photoUri ?? '');
    await buyerConfirmDelivery(tx.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setDeliveryModal(null), 1800);
  };

  const totalEarnings = myDeliveries.reduce((s, t) => s + (t.commissionTransport ?? 0), 0);

  return (
    <View style={styles.container}>
      {/* Delivery modal: camera → AI → OTP */}
      <Modal visible={!!deliveryModal} animationType="slide" presentationStyle="pageSheet">
        {deliveryModal && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmation livraison</Text>
              <TouchableOpacity onPress={() => setDeliveryModal(null)} activeOpacity={0.7}>
                <Feather name="x" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.stepRow}>
                {(['camera', 'ai_check', 'otp_entry', 'done'] as DeliveryStage[]).map((s, i) => (
                  <React.Fragment key={s}>
                    <View style={[styles.stepDot, deliveryModal.stage === s && styles.stepDotActive,
                      (deliveryModal.stage === 'ai_check' && s === 'camera') ||
                      (deliveryModal.stage === 'otp_entry' && (s === 'camera' || s === 'ai_check')) ||
                      (deliveryModal.stage === 'done' && s !== 'done') ? styles.stepDotDone : null
                    ]} />
                    {i < 3 && <View style={styles.stepLine} />}
                  </React.Fragment>
                ))}
              </View>

              {deliveryModal.stage === 'camera' && (
                <View style={styles.stageContent}>
                  <Feather name="camera" size={56} color={Colors.primary} />
                  <Text style={styles.stageTitle}>Photo de livraison</Text>
                  <Text style={styles.stageSub}>
                    Prenez une photo du colis remis à {deliveryModal.tx.acheteurNom}.
                    Cette photo sera validée par notre IA.
                  </Text>
                  <TouchableOpacity style={styles.stageBtn} onPress={handleTakePhoto} activeOpacity={0.85}>
                    <Feather name="camera" size={18} color="#fff" />
                    <Text style={styles.stageBtnText}>
                      {Platform.OS === 'web' ? 'Simuler la photo' : 'Ouvrir la caméra'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {deliveryModal.stage === 'ai_check' && (
                <View style={styles.stageContent}>
                  {deliveryModal.photoUri && deliveryModal.photoUri !== 'web_placeholder' && (
                    <Image source={{ uri: deliveryModal.photoUri }} style={styles.capturedPhoto} contentFit="cover" />
                  )}
                  <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
                  <Text style={styles.stageTitle}>Validation IA en cours…</Text>
                  <Text style={styles.stageSub}>Analyse de la photo par intelligence artificielle</Text>
                </View>
              )}

              {deliveryModal.stage === 'otp_entry' && (
                <View style={styles.stageContent}>
                  <Feather name="check-circle" size={40} color={Colors.success} />
                  <Text style={styles.stageTitle}>Photo validée ✓</Text>
                  <Text style={styles.stageSub}>
                    Entrez le code séquestre que vous donne {deliveryModal.tx.acheteurNom} pour libérer les fonds.
                  </Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="Code à 4 chiffres"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    maxLength={4}
                    value={deliveryModal.otp}
                    onChangeText={v => setDeliveryModal(prev => prev ? { ...prev, otp: v.replace(/\D/g, '').slice(0, 4) } : prev)}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.stageBtn, deliveryModal.otp.length < 4 && { opacity: 0.4 }]}
                    onPress={handleConfirmDelivery}
                    disabled={deliveryModal.otp.length < 4}
                    activeOpacity={0.85}
                  >
                    <Feather name="unlock" size={18} color="#fff" />
                    <Text style={styles.stageBtnText}>Libérer les fonds</Text>
                  </TouchableOpacity>
                </View>
              )}

              {deliveryModal.stage === 'done' && (
                <View style={styles.stageContent}>
                  <Text style={{ fontSize: 60 }}>🎉</Text>
                  <Text style={styles.stageTitle}>Livraison confirmée !</Text>
                  <Text style={styles.stageSub}>
                    Les fonds ont été libérés au vendeur. Merci pour votre service !
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>

      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Text style={styles.title}>Ma Route</Text>
        <Text style={styles.subtitle}>Livraisons en temps réel</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: btmPad + 90, gap: 14, paddingTop: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.blueSoft }]}>
            <Feather name="package" size={22} color={Colors.blue} />
            <Text style={[styles.statVal, { color: Colors.blue }]}>{available.length}</Text>
            <Text style={[styles.statLbl, { color: Colors.blue }]}>Disponibles</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.primaryLight }]}>
            <Feather name="truck" size={22} color={Colors.primary} />
            <Text style={[styles.statVal, { color: Colors.primary }]}>{myDeliveries.length}</Text>
            <Text style={[styles.statLbl, { color: Colors.primary }]}>En cours</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <Feather name="dollar-sign" size={22} color={Colors.warning} />
            <Text style={[styles.statVal, { color: Colors.warning }]}>
              {totalEarnings > 0 ? `${(totalEarnings / 1000).toFixed(0)}k` : '0'}
            </Text>
            <Text style={[styles.statLbl, { color: Colors.warning }]}>FCFA gagnés</Text>
          </View>
        </View>

        {/* How it works */}
        <View style={[styles.legendCard, { marginHorizontal: 16 }]}>
          <Text style={styles.legendTitle}>Comment ça marche ?</Text>
          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: Colors.blue }]} />
            <Text style={styles.legendText}>Acceptez une livraison disponible</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendText}>Récupérez le produit chez le vendeur</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>Livrez à l'acheteur — il confirme avec son code séquestre</Text>
          </View>
        </View>

        {/* My ongoing deliveries */}
        {myDeliveries.length > 0 && (
          <View style={{ marginHorizontal: 16 }}>
            <Text style={styles.sectionTitle}>En cours</Text>
            {myDeliveries.map(tx => (
              <TransactionCard
                key={tx.id}
                tx={tx}
                actionLabel="Confirmer la livraison"
                actionColor={Colors.blue}
                onAction={() => startDeliveryFlow(tx)}
                badge="En route"
                badgeBg={Colors.blueSoft}
                badgeColor={Colors.blue}
              />
            ))}
          </View>
        )}

        {/* Available orders */}
        <View style={{ marginHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>Livraisons disponibles</Text>
          {available.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="truck" size={40} color={Colors.border} />
              <Text style={styles.emptyTitle}>Aucune livraison disponible</Text>
              <Text style={styles.emptySub}>
                Les commandes confirmées par les vendeurs apparaîtront ici en temps réel.
              </Text>
            </View>
          ) : (
            available.map(tx => (
              <TransactionCard
                key={tx.id}
                tx={tx}
                actionLabel="Accepter la livraison"
                actionColor={Colors.primary}
                onAction={() => acceptOrder(tx)}
                badge="Prêt à livrer"
                badgeBg={Colors.primaryLight}
                badgeColor={Colors.primary}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function TransactionCard({
  tx, actionLabel, actionColor, onAction, badge, badgeBg, badgeColor
}: {
  tx: Transaction;
  actionLabel: string;
  actionColor: string;
  onAction: () => void;
  badge: string;
  badgeBg: string;
  badgeColor: string;
}) {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        {tx.produit.photoProduct ? (
          <Image source={{ uri: tx.produit.photoProduct }} style={styles.orderImg} contentFit="cover" />
        ) : (
          <View style={[styles.orderImg, styles.orderImgPlaceholder]}>
            <Feather name="package" size={22} color={Colors.border} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.orderName} numberOfLines={1}>{tx.produit.nom}</Text>
          <Text style={styles.orderParties}>Vendeur : {tx.vendeurNom}</Text>
          <Text style={styles.orderParties}>Acheteur : {tx.acheteurNom}</Text>
        </View>
        <View style={[styles.modeBadge, { backgroundColor: badgeBg }]}>
          <Feather name="truck" size={10} color={badgeColor} />
          <Text style={[styles.modeBadgeText, { color: badgeColor }]}>{badge}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Feather name="map-pin" size={13} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{tx.produit.coordonneesGPS?.village ?? tx.produit.province}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Feather name="credit-card" size={13} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{tx.montantTotal.toLocaleString('fr-FR')} FCFA</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Text style={styles.boxIcon}>📦</Text>
          <Text style={styles.detailText}>{tx.quantity ?? 1} {tx.produit.unite}</Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
        <View style={styles.routeLine} />
        <View style={[styles.routeDot, { backgroundColor: Colors.blue }]} />
      </View>
      <View style={styles.routeLabels}>
        <Text style={styles.routeLabel}>{tx.produit.province}</Text>
        <Text style={styles.routeLabel}>Acheteur</Text>
      </View>

      <TouchableOpacity
        onPress={onAction}
        style={[styles.acceptBtn, { backgroundColor: actionColor }]}
        activeOpacity={0.85}
      >
        <Feather name="check" size={16} color="#fff" />
        <Text style={styles.acceptBtnText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: Colors.background,
  },
  title: { fontSize: 28, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLbl: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  legendCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  legendTitle: { fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: Colors.text, flex: 1, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  emptySub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
  orderCard: {
    backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    paddingBottom: 14, marginBottom: 12,
  },
  orderHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, paddingBottom: 12 },
  orderImg: { width: 58, height: 58, borderRadius: 10 },
  orderImgPlaceholder: {
    backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  orderName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  orderParties: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  modeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 100 },
  modeBadgeText: { fontSize: 10, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 14 },
  detailItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  detailDivider: { width: 1, height: 18, backgroundColor: Colors.border },
  detailText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  boxIcon: { fontSize: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 4 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 6 },
  routeLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  routeLabel: { fontSize: 12, color: Colors.textSecondary },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 14, borderRadius: 12, paddingVertical: 13 },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalBody: { flex: 1, paddingHorizontal: 24, paddingTop: 28, gap: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  stepDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.primary, width: 18, height: 18, borderRadius: 9 },
  stepDotDone: { backgroundColor: Colors.success },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, maxWidth: 60 },
  stageContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 40 },
  stageTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  stageSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  stageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 32,
  },
  stageBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  capturedPhoto: { width: 200, height: 160, borderRadius: 14 },
  otpInput: {
    width: '100%', textAlign: 'center',
    fontSize: 28, fontWeight: '900', color: Colors.text, letterSpacing: 12,
    backgroundColor: Colors.background, borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 2, borderColor: Colors.primary,
  },
});
