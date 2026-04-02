import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

const SMS_NUMBER = '*123*4#';
const SMS_GATEWAY = '+24177123456';

type Step = {
  from: 'phone' | 'system';
  text: string;
};

const DEMO_FLOW: Step[] = [
  { from: 'phone',  text: 'PRODUIT Banane 5000 FCFA 20kg Estuaire' },
  { from: 'system', text: '✅ GaboTerroir : Produit enregistré !\nBanane • 5 000 F/kg • 20kg\nVisible sur le marché.' },
  { from: 'phone',  text: 'STOCK' },
  { from: 'system', text: '📦 Vos produits :\n1. Banane 20kg\n2. Manioc 50sac\nEnvoyez STOP <nom> pour retirer.' },
  { from: 'phone',  text: 'SOLDE' },
  { from: 'system', text: '💰 Solde GaboTerroir :\n45 000 FCFA en attente\nRET 30000 pour retirer.' },
  { from: 'phone',  text: 'VENDU Banane' },
  { from: 'system', text: '🎉 Paiement reçu !\nBanane vendu à 5 000 F/kg\nMontant : 15 000 FCFA\nAirtel Money crédité.' },
];

const COMMANDS = [
  {
    cmd: 'PRODUIT <nom> <prix> <unité> <province>',
    ex: 'PRODUIT Manioc 2500 50kg Ogooué',
    desc: 'Publier une récolte sur le marché',
    color: Colors.primary,
  },
  {
    cmd: 'STOCK',
    ex: 'STOCK',
    desc: 'Voir la liste de vos produits actifs',
    color: Colors.blue ?? '#2196F3',
  },
  {
    cmd: 'PRIX <nom> <nouveau_prix>',
    ex: 'PRIX Manioc 2000',
    desc: 'Modifier le prix d\'un produit',
    color: Colors.warning,
  },
  {
    cmd: 'STOP <nom>',
    ex: 'STOP Manioc',
    desc: 'Retirer un produit du marché',
    color: Colors.error,
  },
  {
    cmd: 'SOLDE',
    ex: 'SOLDE',
    desc: 'Voir vos revenus disponibles',
    color: Colors.success,
  },
  {
    cmd: 'RET <montant>',
    ex: 'RET 25000',
    desc: 'Retirer vos gains vers Airtel/Moov',
    color: Colors.success,
  },
];

export default function SmsAccess() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [demoIndex, setDemoIndex] = useState(0);
  const [smsText, setSmsText] = useState('');
  const [demoMessages, setDemoMessages] = useState<Step[]>([]);

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const runNextStep = () => {
    if (demoIndex < DEMO_FLOW.length) {
      setDemoMessages(prev => [...prev, DEMO_FLOW[demoIndex]]);
      setDemoIndex(i => i + 1);
    }
  };

  const resetDemo = () => {
    setDemoMessages([]);
    setDemoIndex(0);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Accès SMS / USSD</Text>
          <Text style={styles.subtitle}>Pour producteurs sans smartphone</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Feather name="smartphone" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBannerTitle}>Fonctionnement sans internet</Text>
            <Text style={styles.infoBannerText}>
              Les producteurs avec téléphone basique peuvent publier leurs récoltes,
              gérer leurs stocks et recevoir leurs paiements uniquement par SMS.
            </Text>
          </View>
        </View>

        {/* How to use */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Comment ça marche</Text>

          {[
            { num: '1', icon: 'send', text: `Envoyer un SMS au ${SMS_GATEWAY}`, sub: 'Ou composer le code USSD : ' + SMS_NUMBER },
            { num: '2', icon: 'server', text: 'Le système reçoit et traite la commande', sub: 'Via Africa\'s Talking / Airtel / Moov Gateway' },
            { num: '3', icon: 'check-circle', text: 'Produit publié sur la marketplace', sub: 'Visible immédiatement pour les acheteurs' },
            { num: '4', icon: 'dollar-sign', text: 'Paiement reçu via Airtel Money / Moov Cash', sub: 'Notification SMS de confirmation automatique' },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.num}</Text>
              </View>
              <View style={styles.stepLine}>
                <Feather name={step.icon as any} size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepText}>{step.text}</Text>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Flow diagram */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Circuit du SMS</Text>
          <View style={styles.flowDiagram}>
            {[
              { icon: '📱', label: 'Producteur', sub: 'Téléphone basique' },
              { icon: '📡', label: 'Opérateur', sub: 'Airtel / Moov' },
              { icon: '🔌', label: 'Gateway SMS', sub: 'Africa\'s Talking' },
              { icon: '⚙️', label: 'Backend GaboTerroir', sub: 'Parse & enregistre' },
              { icon: '🛒', label: 'Application Acheteur', sub: 'Affiche le produit' },
              { icon: '💰', label: 'Paiement Mobile Money', sub: 'Airtel / Moov Cash' },
              { icon: '📨', label: 'SMS Confirmation', sub: 'Vers le producteur' },
            ].map((node, i, arr) => (
              <View key={i} style={styles.flowNodeWrap}>
                <View style={styles.flowNode}>
                  <Text style={styles.flowIcon}>{node.icon}</Text>
                  <Text style={styles.flowLabel}>{node.label}</Text>
                  <Text style={styles.flowSub}>{node.sub}</Text>
                </View>
                {i < arr.length - 1 && (
                  <View style={styles.flowArrow}>
                    <Feather name="chevron-down" size={18} color={Colors.primary} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* SMS Commands */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Commandes SMS disponibles</Text>
          <Text style={styles.sectionSub}>Envoyer au : <Text style={styles.phoneNum}>{SMS_GATEWAY}</Text></Text>
          {COMMANDS.map((c, i) => (
            <View key={i} style={[styles.cmdCard, { borderLeftColor: c.color }]}>
              <View style={styles.cmdTop}>
                <Text style={[styles.cmdText, { color: c.color }]}>{c.cmd}</Text>
              </View>
              <Text style={styles.cmdDesc}>{c.desc}</Text>
              <View style={styles.cmdExWrap}>
                <Text style={styles.cmdExLabel}>Exemple : </Text>
                <Text style={styles.cmdEx}>{c.ex}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Interactive demo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📟 Simulation SMS</Text>
          <Text style={styles.sectionSub}>Appuyez sur "Suivant" pour voir une session réelle</Text>

          <View style={styles.phoneFrame}>
            <View style={styles.phoneScreen}>
              <Text style={styles.phoneTo}>Conversation avec {SMS_GATEWAY}</Text>

              {demoMessages.length === 0 && (
                <View style={styles.emptyDemo}>
                  <Text style={styles.emptyDemoText}>Appuyez sur "Étape suivante" ↓</Text>
                </View>
              )}

              {demoMessages.map((msg, i) => (
                <View key={i} style={[
                  styles.bubble,
                  msg.from === 'phone' ? styles.bubbleRight : styles.bubbleLeft,
                ]}>
                  <Text style={[
                    styles.bubbleText,
                    msg.from === 'phone' ? styles.bubbleTextRight : styles.bubbleTextLeft,
                  ]}>{msg.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.demoControls}>
              <TouchableOpacity
                style={[styles.demoBtn, demoIndex >= DEMO_FLOW.length && styles.demoBtnDisabled]}
                onPress={runNextStep}
                disabled={demoIndex >= DEMO_FLOW.length}
              >
                <Feather name="play" size={14} color="#fff" />
                <Text style={styles.demoBtnText}>Étape suivante</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={resetDemo}>
                <Feather name="refresh-ccw" size={14} color={Colors.textSecondary} />
                <Text style={styles.resetBtnText}>Recommencer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* USSD code */}
        <View style={[styles.section, styles.ussdCard]}>
          <Feather name="hash" size={22} color={Colors.primary} />
          <Text style={styles.ussdTitle}>Code USSD (sans internet)</Text>
          <Text style={styles.ussdCode}>{SMS_NUMBER}</Text>
          <Text style={styles.ussdDesc}>
            Composez ce code sur n'importe quel téléphone Airtel ou Moov pour accéder
            au menu GaboTerroir sans avoir besoin d'internet.
          </Text>
          <View style={styles.ussdMenuPreview}>
            <Text style={styles.ussdMenuTitle}>GaboTerroir USSD</Text>
            <Text style={styles.ussdMenuItem}>1. Publier un produit</Text>
            <Text style={styles.ussdMenuItem}>2. Voir mes stocks</Text>
            <Text style={styles.ussdMenuItem}>3. Mon solde</Text>
            <Text style={styles.ussdMenuItem}>4. Retirer argent</Text>
            <Text style={styles.ussdMenuItem}>5. Aide</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  infoBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight ?? '#E8F5E9',
    marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 14,
  },
  infoBannerTitle: { fontSize: 13, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  infoBannerText: { fontSize: 12, color: Colors.text, lineHeight: 18 },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: Colors.text, marginBottom: 12 },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: -8, marginBottom: 12 },
  phoneNum: { fontWeight: '800', color: Colors.primary },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  stepLine: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.primaryLight ?? '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
  },
  stepText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  stepSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  flowDiagram: { alignItems: 'center', gap: 0 },
  flowNodeWrap: { alignItems: 'center', width: '100%' },
  flowNode: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 10, paddingHorizontal: 16,
    alignItems: 'center', width: '90%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  flowIcon: { fontSize: 22 },
  flowLabel: { fontSize: 13, fontWeight: '800', color: Colors.text, marginTop: 4 },
  flowSub: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  flowArrow: { paddingVertical: 2 },
  cmdCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 4, marginBottom: 8,
  },
  cmdTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cmdText: { fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },
  cmdDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  cmdExWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  cmdExLabel: { fontSize: 11, color: Colors.textMuted },
  cmdEx: {
    fontSize: 11, fontWeight: '700', color: Colors.text,
    backgroundColor: '#F3F4F6', paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: 4, fontFamily: 'monospace',
  },
  phoneFrame: {
    backgroundColor: '#1a1a2e', borderRadius: 20, overflow: 'hidden',
    borderWidth: 3, borderColor: '#333',
  },
  phoneScreen: { padding: 12, minHeight: 220 },
  phoneTo: {
    fontSize: 11, color: '#aaa', textAlign: 'center',
    marginBottom: 10, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#333',
  },
  emptyDemo: { alignItems: 'center', paddingVertical: 30 },
  emptyDemoText: { color: '#666', fontSize: 12 },
  bubble: {
    maxWidth: '80%', borderRadius: 12, padding: 10, marginBottom: 8,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#2e7d32',
    borderBottomRightRadius: 4,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#263238',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 12, lineHeight: 18 },
  bubbleTextRight: { color: '#fff' },
  bubbleTextLeft: { color: '#e0e0e0' },
  demoControls: {
    flexDirection: 'row', gap: 10, padding: 12,
    borderTopWidth: 1, borderTopColor: '#333',
  },
  demoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10,
  },
  demoBtnDisabled: { backgroundColor: '#555' },
  demoBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#333', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
  },
  resetBtnText: { fontSize: 13, color: '#aaa', fontWeight: '600' },
  ussdCard: {
    backgroundColor: '#1a1a2e', borderRadius: 18, padding: 20,
    alignItems: 'center', marginBottom: 10,
  },
  ussdTitle: { fontSize: 15, fontWeight: '900', color: '#fff', marginTop: 10 },
  ussdCode: {
    fontSize: 30, fontWeight: '900', color: Colors.primary,
    marginVertical: 10, letterSpacing: 2,
  },
  ussdDesc: { fontSize: 12, color: '#aaa', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  ussdMenuPreview: {
    backgroundColor: '#000', borderRadius: 12, padding: 14,
    width: '100%', borderWidth: 1, borderColor: '#333',
  },
  ussdMenuTitle: {
    fontSize: 13, fontWeight: '900', color: Colors.primary,
    textAlign: 'center', marginBottom: 10, letterSpacing: 1,
  },
  ussdMenuItem: { fontSize: 13, color: '#ddd', paddingVertical: 4, lineHeight: 20 },
});
