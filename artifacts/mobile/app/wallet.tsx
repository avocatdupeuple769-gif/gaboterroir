import { Feather } from '@expo/vector-icons';
import { addDoc, collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { WalletMethod, WalletTransaction } from '@/types';

type ModalMode = 'depot' | 'retrait' | null;

const METHODS: { key: WalletMethod; label: string; color: string; bg: string; logo: string }[] = [
  { key: 'airtel', label: 'Airtel Money', color: '#EF3124', bg: '#FFF0EF', logo: '📶' },
  { key: 'moov', label: 'Moov Money', color: '#0066CC', bg: '#EEF4FF', logo: '💙' },
];

const AMOUNTS = [5000, 10000, 25000, 50000, 100000];

export default function WalletScreen() {
  const { user, updateWallet } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const [walletVisible, setWalletVisible] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedMethod, setSelectedMethod] = useState<WalletMethod>('airtel');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Real-time wallet transaction history from Firestore
  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'walletTransactions'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setHistory(snap.docs.map(d => ({ ...d.data(), id: d.id } as WalletTransaction)));
      setHistoryLoading(false);
    }, () => setHistoryLoading(false));
    return unsub;
  }, [user?.id]);

  const totalDepots = useMemo(
    () => history.filter(t => t.type === 'depot' && t.statut === 'completed').reduce((s, t) => s + t.amount, 0),
    [history]
  );
  const totalRetraits = useMemo(
    () => history.filter(t => t.type === 'retrait' && t.statut === 'completed').reduce((s, t) => s + t.amount, 0),
    [history]
  );

  const openModal = (mode: ModalMode) => {
    setModalMode(mode);
    setPhone('');
    setAmount('');
    setSelectedMethod('airtel');
  };

  const handleConfirm = async () => {
    const numAmount = parseInt(amount.replace(/\s/g, ''), 10);
    if (!phone || phone.length < 8) {
      Alert.alert('Numéro requis', 'Entrez votre numéro Mobile Money (8 chiffres minimum).');
      return;
    }
    if (!numAmount || numAmount < 500) {
      Alert.alert('Montant invalide', 'Le montant minimum est 500 FCFA.');
      return;
    }
    if (modalMode === 'retrait' && numAmount > (user?.walletSolde ?? 0)) {
      Alert.alert('Solde insuffisant', `Votre solde est de ${(user?.walletSolde ?? 0).toLocaleString('fr-FR')} FCFA.`);
      return;
    }

    setLoading(true);
    const methodLabel = METHODS.find(m => m.key === selectedMethod)?.label ?? 'Mobile Money';
    const desc = modalMode === 'depot'
      ? `Dépôt via ${methodLabel} (${phone})`
      : `Retrait vers ${methodLabel} (${phone})`;

    const walletTx: Omit<WalletTransaction, 'id'> = {
      userId: user!.id,
      type: modalMode!,
      amount: numAmount,
      method: selectedMethod,
      phone,
      description: desc,
      createdAt: new Date().toISOString(),
      statut: 'pending',
    };

    try {
      const docRef = await addDoc(collection(db, 'walletTransactions'), walletTx);
      // Update wallet balance
      const delta = modalMode === 'depot' ? numAmount : -numAmount;
      await updateWallet(delta);
      // Mark completed
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'walletTransactions', docRef.id), { statut: 'completed' });

      setLoading(false);
      setModalMode(null);
      Alert.alert(
        modalMode === 'depot' ? '✅ Dépôt réussi !' : '✅ Retrait effectué !',
        `${numAmount.toLocaleString('fr-FR')} FCFA ${modalMode === 'depot' ? 'ajoutés à' : 'retirés de'} votre portefeuille via ${methodLabel}.`
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('Erreur', 'La transaction a échoué. Vérifiez votre connexion.');
    }
  };

  const typeConfig = {
    depot: { icon: 'arrow-down-left' as const, color: Colors.success, sign: '+' },
    retrait: { icon: 'arrow-up-right' as const, color: Colors.error, sign: '-' },
    vente: { icon: 'trending-up' as const, color: Colors.primary, sign: '+' },
    achat: { icon: 'shopping-bag' as const, color: Colors.blue, sign: '-' },
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Portefeuille</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50, gap: 0 }}>
        {/* Wallet card */}
        <View style={styles.walletCard}>
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.cardLabel}>Solde disponible</Text>
              <View style={styles.balanceRow}>
                {walletVisible ? (
                  <Text style={styles.balanceAmount}>
                    {(user?.walletSolde ?? 0).toLocaleString('fr-FR')} FCFA
                  </Text>
                ) : (
                  <Text style={styles.balanceDots}>● ● ● ● ● ●</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => setWalletVisible(v => !v)} activeOpacity={0.7} style={styles.eyeBtn}>
              <Feather name={walletVisible ? 'eye-off' : 'eye'} size={20} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
          </View>

          <View style={styles.miniStats}>
            <View style={styles.miniStat}>
              <Feather name="arrow-down-left" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.miniStatVal}>{totalDepots.toLocaleString('fr-FR')}</Text>
              <Text style={styles.miniStatLbl}>Dépôts</Text>
            </View>
            <View style={styles.miniDivider} />
            <View style={styles.miniStat}>
              <Feather name="arrow-up-right" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.miniStatVal}>{totalRetraits.toLocaleString('fr-FR')}</Text>
              <Text style={styles.miniStatLbl}>Retraits</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.depositBtn} onPress={() => openModal('depot')} activeOpacity={0.85}>
              <Feather name="arrow-down-left" size={16} color={Colors.primaryDark} />
              <Text style={styles.depositBtnText}>Recharger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.withdrawBtn} onPress={() => openModal('retrait')} activeOpacity={0.85}>
              <Feather name="arrow-up-right" size={16} color={Colors.text} />
              <Text style={styles.withdrawBtnText}>Retirer</Text>
            </TouchableOpacity>
          </View>

          {/* Payment methods logos */}
          <View style={styles.methodsRow}>
            <Text style={styles.methodsLabel}>Accepté :</Text>
            {METHODS.map(m => (
              <View key={m.key} style={[styles.methodBadge, { backgroundColor: m.bg }]}>
                <Text style={styles.methodBadgeLogo}>{m.logo}</Text>
                <Text style={[styles.methodBadgeText, { color: m.color }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Info séquestre */}
        <View style={styles.infoCard}>
          <Feather name="shield" size={16} color={Colors.blue} />
          <Text style={styles.infoText}>
            Votre argent est protégé par le système séquestre GaboTerroir. Les fonds sont libérés uniquement après confirmation de réception.
          </Text>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique</Text>
          {historyLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : history.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="clock" size={36} color={Colors.border} />
              <Text style={styles.emptyTitle}>Aucune transaction</Text>
              <Text style={styles.emptySub}>Rechargez ou retirez pour commencer.</Text>
            </View>
          ) : (
            history.map(tx => {
              const cfg = typeConfig[tx.type] ?? typeConfig.depot;
              const methodLabel = METHODS.find(m => m.key === tx.method)?.label ?? 'GaboTerroir';
              const date = new Date(tx.createdAt);
              return (
                <View key={tx.id} style={styles.historyRow}>
                  <View style={[styles.historyIconWrap, { backgroundColor: cfg.color + '18' }]}>
                    <Feather name={cfg.icon} size={18} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDesc}>{tx.description}</Text>
                    <Text style={styles.historyDate}>
                      {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {tx.statut === 'pending' ? ' · En cours…' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.historyAmount, { color: cfg.color }]}>
                    {cfg.sign}{tx.amount.toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Deposit / Withdrawal Modal */}
      <Modal visible={!!modalMode} animationType="slide" transparent onRequestClose={() => !loading && setModalMode(null)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {modalMode === 'depot' ? '💳 Recharger le portefeuille' : '💸 Retirer des fonds'}
            </Text>
            <Text style={styles.modalSub}>
              {modalMode === 'depot'
                ? 'Choisissez votre opérateur Mobile Money et entrez le montant.'
                : 'Les fonds seront envoyés sur votre numéro Mobile Money.'}
            </Text>

            {/* Method selector */}
            <View style={styles.methodSelector}>
              {METHODS.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.methodOption,
                    selectedMethod === m.key && { borderColor: m.color, backgroundColor: m.bg },
                  ]}
                  onPress={() => setSelectedMethod(m.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.methodOptionLogo}>{m.logo}</Text>
                  <Text style={[styles.methodOptionLabel, selectedMethod === m.key && { color: m.color, fontWeight: '800' }]}>
                    {m.label}
                  </Text>
                  {selectedMethod === m.key && (
                    <Feather name="check-circle" size={16} color={m.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Phone input */}
            <Text style={styles.fieldLabel}>Numéro Mobile Money</Text>
            <View style={styles.phoneRow}>
              <View style={styles.phonePre}>
                <Text style={styles.phonePreText}>+241</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="07 xx xx xx"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={12}
              />
            </View>

            {/* Quick amounts */}
            <Text style={styles.fieldLabel}>Montant (FCFA)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAmounts}>
              {AMOUNTS.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.quickAmt, amount === String(a) && { backgroundColor: Colors.primary }]}
                  onPress={() => setAmount(String(a))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickAmtText, amount === String(a) && { color: '#fff' }]}>
                    {a >= 1000 ? `${a / 1000}k` : a}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.amountInput}
              placeholder="Ou entrez un montant personnalisé…"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {modalMode === 'retrait' && (
              <Text style={styles.soldeHint}>
                Solde disponible : {(user?.walletSolde ?? 0).toLocaleString('fr-FR')} FCFA
              </Text>
            )}

            <TouchableOpacity
              style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name={modalMode === 'depot' ? 'arrow-down-left' : 'arrow-up-right'} size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>
                    {modalMode === 'depot' ? 'Confirmer le dépôt' : 'Confirmer le retrait'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => !loading && setModalMode(null)} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 4,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  walletCard: {
    backgroundColor: Colors.primary, margin: 16, borderRadius: 24,
    padding: 22, gap: 18,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  balanceAmount: { fontSize: 28, fontWeight: '900', color: '#fff' },
  balanceDots: { fontSize: 22, color: 'rgba(255,255,255,0.6)', letterSpacing: 3 },
  eyeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  miniStats: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  miniStat: { flex: 1, alignItems: 'center', gap: 3 },
  miniDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  miniStatVal: { fontSize: 14, fontWeight: '800', color: '#fff' },
  miniStatLbl: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  cardActions: { flexDirection: 'row', gap: 10 },
  depositBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14,
  },
  depositBtnText: { fontSize: 14, fontWeight: '800', color: Colors.primaryDark },
  withdrawBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14, paddingVertical: 14,
  },
  withdrawBtnText: { fontSize: 14, fontWeight: '800', color: Colors.text },
  methodsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  methodsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  methodBadgeLogo: { fontSize: 12 },
  methodBadgeText: { fontSize: 11, fontWeight: '700' },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.blueSoft, marginHorizontal: 16, borderRadius: 14, padding: 14,
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.blue, lineHeight: 18 },
  section: { paddingHorizontal: 16, paddingTop: 20, gap: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  emptySub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  historyIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyDesc: { fontSize: 13, fontWeight: '600', color: Colors.text },
  historyDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: '800' },
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, gap: 10,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  modalSub: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  methodSelector: { flexDirection: 'row', gap: 10, marginTop: 4 },
  methodOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.background, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10,
    borderWidth: 2, borderColor: Colors.border,
  },
  methodOptionLogo: { fontSize: 18 },
  methodOptionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginTop: 6 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phonePre: {
    backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  phonePreText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  phoneInput: {
    flex: 1, backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, fontWeight: '600', color: Colors.text,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  quickAmounts: { marginVertical: 4 },
  quickAmt: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100,
    backgroundColor: Colors.background, marginRight: 8,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  quickAmtText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  amountInput: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, fontWeight: '600', color: Colors.text,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  soldeHint: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, marginTop: 6,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
});
