import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, logout, updateProfilePhoto } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [walletVisible, setWalletVisible] = useState(false);

  const [modalType, setModalType] = useState<'preferences' | 'aide' | 'cgu' | 'signaler' | null>(null);
  const [signalText, setSignalText] = useState('');
  const [signalSent, setSignalSent] = useState(false);

  const displayName = user?.prenom && user?.nom
    ? `${user.prenom} ${user.nom}`
    : user?.telephone ?? 'Utilisateur';
  const roleLabel = user?.role === 'producteur' ? 'Producteur' : user?.role === 'transporteur' ? 'Transporteur' : 'Acheteur';

  const handleChangePhoto = async () => {
    if (Platform.OS === 'web') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await updateProfilePhoto(result.assets[0].uri);
      }
    } else {
      const choice = await new Promise<'camera' | 'gallery' | null>(resolve => {
        Alert.alert('Photo de profil', 'Choisir depuis', [
          { text: 'Caméra', onPress: () => resolve('camera') },
          { text: 'Galerie', onPress: () => resolve('gallery') },
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
        ]);
      });
      if (!choice) return;
      const perm = choice === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = choice === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85, cameraType: ImagePicker.CameraType.front })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        await updateProfilePhoto(result.assets[0].uri);
      }
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) logout();
    } else {
      Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: () => logout() },
      ]);
    }
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/12344503415?text=Bonjour%20support%20GaboTerroir%2C%20j%27ai%20besoin%20d%27aide.');
  };

  const handleSignaler = () => {
    if (!signalText.trim()) {
      Alert.alert('Champ vide', 'Décrivez votre problème avant d\'envoyer.');
      return;
    }
    setSignalSent(true);
    setSignalText('');
    setTimeout(() => {
      setSignalSent(false);
      setModalType(null);
    }, 2000);
  };

  const SETTINGS = [
    {
      icon: 'bell' as const, label: 'Notifications',
      sub: 'Alertes commandes & livraisons',
      onPress: () => Alert.alert('Notifications', 'Activées pour toutes les transactions, livraisons et promotions.\n\nGérez vos préférences dans les réglages de votre téléphone.'),
    },
    {
      icon: 'phone' as const, label: 'Numéro de téléphone',
      sub: user?.telephone ? `+241 ${user.telephone}` : 'Non défini',
      onPress: () => Alert.alert('Numéro de téléphone', `Votre numéro : ${user?.telephone ?? 'Non défini'}\n\nPour le modifier, contactez le support.`),
    },
    {
      icon: 'settings' as const, label: 'Préférences',
      sub: 'Langue, région, devise',
      onPress: () => setModalType('preferences'),
    },
  ];

  const HELP = [
    {
      icon: 'help-circle' as const, label: "Centre d'aide",
      sub: 'FAQ & assistance',
      iconBg: Colors.blueSoft, iconColor: Colors.blue,
      onPress: () => setModalType('aide'),
    },
    {
      icon: 'alert-triangle' as const, label: 'Signaler un problème',
      sub: 'Réclamation & litiges',
      iconBg: '#FFF3E0', iconColor: Colors.warning,
      onPress: () => setModalType('signaler'),
    },
    {
      icon: 'message-circle' as const, label: 'Support WhatsApp',
      sub: 'Réponse rapide',
      iconBg: '#E8F5E9', iconColor: Colors.success,
      onPress: handleWhatsApp,
    },
    {
      icon: 'file-text' as const, label: "Conditions d'utilisation",
      sub: undefined, iconBg: Colors.background, iconColor: Colors.textSecondary,
      onPress: () => setModalType('cgu'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: btmPad + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileSection, { paddingTop: topPad + 20 }]}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handleChangePhoto} activeOpacity={0.85}>
            {user?.photoProfile ? (
              <Image source={{ uri: user.photoProfile }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Feather name="user" size={30} color={Colors.primary} />
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Feather name="camera" size={11} color="#fff" />
            </View>
            {user?.cniVerified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={10} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.name}>{displayName}</Text>
          <View style={[styles.rolePill, {
            backgroundColor: user?.role === 'producteur' ? '#E8F5E9' : user?.role === 'transporteur' ? '#E3F2FD' : '#FFF8E1',
          }]}>
            <Feather
              name={user?.role === 'producteur' ? 'feather' : user?.role === 'transporteur' ? 'truck' : 'shopping-bag'}
              size={12}
              color={user?.role === 'producteur' ? Colors.success : user?.role === 'transporteur' ? Colors.blue : Colors.warning}
            />
            <Text style={[styles.rolePillText, {
              color: user?.role === 'producteur' ? Colors.success : user?.role === 'transporteur' ? Colors.blue : Colors.warning,
            }]}>{roleLabel}</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="star" size={13} color={Colors.star} />
              <Text style={styles.metaText}>{user?.note?.toFixed(1) ?? '5.0'}</Text>
            </View>
            <View style={styles.dot} />
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {user?.ville && user?.province ? `${user.ville}, ${user.province}` : user?.province ?? 'Non définie'}
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.walletLeft}>
              <Feather name="credit-card" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.walletLabel}>Mon Portefeuille</Text>
            </View>
            <TouchableOpacity onPress={() => setWalletVisible(v => !v)} activeOpacity={0.7}>
              <Feather name={walletVisible ? 'eye-off' : 'eye'} size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
          <View style={styles.walletBalance}>
            <Feather name="lock" size={14} color="rgba(255,255,255,0.5)" />
            {walletVisible ? (
              <Text style={styles.walletAmount}>{(user?.walletSolde ?? 0).toLocaleString('fr-FR')} FCFA</Text>
            ) : (
              <Text style={styles.walletDots}>● ● ● ● ● ● ● ● ●</Text>
            )}
          </View>
          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.rechargeBtn} activeOpacity={0.8} onPress={() => router.push('/wallet' as any)}>
              <Feather name="arrow-down-left" size={14} color={Colors.primaryDark} />
              <Text style={styles.rechargeBtnText}>Recharger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retraitBtn} activeOpacity={0.8} onPress={() => router.push('/wallet' as any)}>
              <Feather name="arrow-up-right" size={14} color={Colors.text} />
              <Text style={styles.retraitBtnText}>Retirer</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.walletMethods}>☐ Airtel Money · Moov Money</Text>
        </View>

        {/* Settings */}
        <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>PARAMÈTRES</Text></View>
        <View style={styles.menuGroup}>
          {SETTINGS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, i < SETTINGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View style={styles.menuIconWrap}>
                <Feather name={item.icon} size={18} color={Colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.sub ? <Text style={styles.menuSub}>{item.sub}</Text> : null}
              </View>
              <Feather name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Help */}
        <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>AIDE & RÉCLAMATIONS</Text></View>
        <View style={styles.menuGroup}>
          {HELP.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, i < HELP.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg }]}>
                <Feather name={item.icon} size={18} color={item.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.sub ? <Text style={styles.menuSub}>{item.sub}</Text> : null}
              </View>
              <Feather name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Feather name="log-out" size={16} color={Colors.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
        <Text style={styles.version}>GaboTerroir v1.0.0</Text>
      </ScrollView>

      {/* Preferences Modal */}
      <Modal visible={modalType === 'preferences'} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Préférences</Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Feather name="x" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.prefItem}>
              <Feather name="globe" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.prefLabel}>Langue</Text>
                <Text style={styles.prefValue}>Français 🇫🇷</Text>
              </View>
              <View style={styles.prefBadge}><Text style={styles.prefBadgeText}>Actuel</Text></View>
            </View>
            <View style={styles.prefItem}>
              <Feather name="map-pin" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.prefLabel}>Région</Text>
                <Text style={styles.prefValue}>{user?.province ?? 'Gabon'}</Text>
              </View>
            </View>
            <View style={styles.prefItem}>
              <Feather name="dollar-sign" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.prefLabel}>Devise</Text>
                <Text style={styles.prefValue}>FCFA (XAF)</Text>
              </View>
              <View style={styles.prefBadge}><Text style={styles.prefBadgeText}>Actuel</Text></View>
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setModalType(null)}>
              <Text style={styles.modalBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Centre d'aide Modal */}
      <Modal visible={modalType === 'aide'} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Centre d'aide</Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Feather name="x" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {FAQ.map((item, i) => (
                <View key={i} style={styles.faqItem}>
                  <Text style={styles.faqQ}>{item.q}</Text>
                  <Text style={styles.faqA}>{item.a}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.success }]} onPress={handleWhatsApp}>
              <Feather name="message-circle" size={16} color="#fff" />
              <Text style={[styles.modalBtnText, { color: '#fff' }]}>Contacter le support WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Signaler Modal */}
      <Modal visible={modalType === 'signaler'} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Signaler un problème</Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Feather name="x" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {signalSent ? (
              <View style={styles.signalSent}>
                <Feather name="check-circle" size={40} color={Colors.success} />
                <Text style={styles.signalSentText}>Signalement envoyé !</Text>
                <Text style={styles.signalSentSub}>Notre équipe traite votre demande sous 24h.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.signalLabel}>Décrivez votre problème</Text>
                <TextInput
                  style={styles.signalInput}
                  multiline
                  numberOfLines={5}
                  placeholder="Ex: Commande non reçue, produit abîmé, litige avec vendeur…"
                  placeholderTextColor={Colors.textMuted}
                  value={signalText}
                  onChangeText={setSignalText}
                  textAlignVertical="top"
                />
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.warning }]} onPress={handleSignaler}>
                  <Feather name="send" size={16} color="#fff" />
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Envoyer le signalement</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* CGU Modal */}
      <Modal visible={modalType === 'cgu'} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Conditions d'utilisation</Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Feather name="x" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.cguText}>{CGU_TEXT}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setModalType(null)}>
              <Text style={styles.modalBtnText}>J'ai compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const FAQ = [
  { q: 'Comment passer une commande ?', a: 'Ajoutez un produit au panier, puis appuyez sur "Commander". Le paiement est sécurisé par escrow.' },
  { q: 'Comment fonctionne le paiement escrow ?', a: 'Votre argent est bloqué jusqu\'à la confirmation de livraison. Le vendeur ne reçoit rien avant que vous confirmiez.' },
  { q: 'Que faire si mon colis n\'est pas arrivé ?', a: 'Ne confirmez pas la livraison. Signalez le problème via "Signaler un problème" pour ouvrir un litige.' },
  { q: 'Comment devenir producteur ?', a: 'Créez un compte et sélectionnez "Producteur" comme rôle. Complétez ensuite la vérification KYC (CNI requise).' },
  { q: 'Les prix incluent-ils la livraison ?', a: 'Non. Le frais de transport est négocié directement avec le transporteur lors de la confirmation de commande.' },
  { q: 'Comment contacter un vendeur ?', a: 'Sur la fiche produit, appuyez sur "Contacter le vendeur". La messagerie interne est chiffrée.' },
];

const CGU_TEXT = `GaboTerroir — Conditions Générales d'Utilisation

Version 1.0 — Avril 2025

1. OBJET
GaboTerroir est une plateforme gabonaise de mise en relation entre producteurs agricoles, acheteurs et transporteurs.

2. ACCEPTATION
En utilisant l'application, vous acceptez les présentes conditions dans leur intégralité.

3. COMPTES UTILISATEURS
L'inscription est ouverte aux personnes physiques majeures résidant au Gabon. L'utilisateur s'engage à fournir des informations exactes et à jour.

4. ESCROW & PAIEMENTS
Tout paiement est sécurisé via un système d'escrow. Les fonds sont libérés au vendeur uniquement après confirmation de livraison par l'acheteur.

5. RESPONSABILITÉS
GaboTerroir agit en tant qu'intermédiaire technique. La plateforme n'est pas responsable de la qualité des produits agricoles, des retards de livraison ou des litiges entre utilisateurs.

6. DONNÉES PERSONNELLES
Vos données sont protégées et ne sont pas vendues à des tiers. Elles sont utilisées uniquement pour le fonctionnement de la plateforme conformément à la loi gabonaise.

7. CONTACT
Pour toute question : support@gaboterroir.ga
WhatsApp : +1 234 450 3415

© 2025 GaboTerroir — Tous droits réservés.`;

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileSection: {
    alignItems: 'center', paddingBottom: 20,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20, gap: 8,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: Colors.primaryLight },
  avatarPlaceholder: { backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  verifiedBadge: {
    position: 'absolute', bottom: 0, left: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  name: { fontSize: 22, fontWeight: '900', color: Colors.text },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
  },
  rolePillText: { fontSize: 13, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  walletCard: {
    backgroundColor: Colors.primary, margin: 16, borderRadius: 20,
    padding: 20, gap: 14,
  },
  walletHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  walletBalance: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletAmount: { fontSize: 22, fontWeight: '900', color: '#fff' },
  walletDots: { fontSize: 18, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 },
  walletActions: { flexDirection: 'row', gap: 10 },
  rechargeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 12,
  },
  rechargeBtnText: { fontSize: 14, fontWeight: '800', color: Colors.primaryDark },
  retraitBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, paddingVertical: 12,
  },
  retraitBtnText: { fontSize: 14, fontWeight: '800', color: Colors.text },
  walletMethods: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  sectionLabel: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  sectionLabelText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8 },
  menuGroup: {
    backgroundColor: Colors.surface, marginHorizontal: 16,
    borderRadius: 16, marginBottom: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  menuSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.error + '15',
    marginHorizontal: 16, marginTop: 8, marginBottom: 4,
    borderRadius: 14, paddingVertical: 15,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 8, marginBottom: 4 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36, gap: 14,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, marginTop: 4,
  },
  modalBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  prefItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  prefLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  prefValue: { fontSize: 15, fontWeight: '700', color: Colors.text },
  prefBadge: {
    backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  prefBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  faqItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  faqQ: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 5 },
  faqA: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  signalLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  signalInput: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.text,
    borderWidth: 1, borderColor: Colors.borderLight,
    height: 120,
  },
  signalSent: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  signalSentText: { fontSize: 18, fontWeight: '900', color: Colors.success },
  signalSentSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  cguText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
});
