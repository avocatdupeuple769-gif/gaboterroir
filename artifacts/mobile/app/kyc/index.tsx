import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

const STEPS_BY_ROLE = {
  producteur: [
    { icon: 'credit-card' as const, title: 'Scan du document', sub: 'CNI, Passeport ou Permis' },
    { icon: 'user' as const, title: 'Selfie de sécurité', sub: 'Preuve de vie avec geste aléatoire' },
    { icon: 'map-pin' as const, title: 'Preuve terrain', sub: 'Photo géolocalisée de votre exploitation' },
  ],
  transporteur: [
    { icon: 'credit-card' as const, title: 'Scan du document', sub: 'CNI, Passeport ou Permis' },
    { icon: 'user' as const, title: 'Selfie de sécurité', sub: 'Preuve de vie avec geste aléatoire' },
    { icon: 'truck' as const, title: 'Photo du véhicule', sub: 'Photo de votre véhicule de transport' },
    { icon: 'file-text' as const, title: 'Assurance véhicule', sub: "Photo de votre attestation d'assurance" },
  ],
  acheteur: [
    { icon: 'credit-card' as const, title: 'Scan du document', sub: 'CNI, Passeport ou Permis' },
    { icon: 'user' as const, title: 'Selfie de sécurité', sub: 'Preuve de vie avec geste aléatoire' },
  ],
};

export default function KycIntroScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const role = (user?.role ?? 'acheteur') as keyof typeof STEPS_BY_ROLE;
  const steps = STEPS_BY_ROLE[role] ?? STEPS_BY_ROLE.acheteur;
  const roleLabel = role === 'producteur' ? 'producteur' : role === 'transporteur' ? 'transporteur' : 'acheteur';

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={18} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certification KYC</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: btmPad + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.shieldWrap}>
          <Feather name="shield" size={42} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Vérification d'identité</Text>
        <Text style={styles.desc}>
          Pour garantir la confiance sur GaboTerroir,{'\n'}nous vérifions l'identité de chaque {roleLabel}.
        </Text>

        <View style={styles.stepsList}>
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepIcon}>
                <Feather name={step.icon} size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.warningBox}>
          <Feather name="alert-triangle" size={16} color={Colors.warning} />
          <Text style={styles.warningText}>
            La galerie photo est désactivée. Seule la caméra en direct est acceptée.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: btmPad + 12 }]}>
        <Pressable
          onPress={() => router.push('/kyc/document-type')}
          style={({ pressed }) => [styles.startBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.startBtnText}>Commencer la vérification</Text>
          <Feather name="chevron-right" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  content: { paddingHorizontal: 24, paddingTop: 10, gap: 20, alignItems: 'center' },
  shieldWrap: {
    width: 84, height: 84, borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '900', color: Colors.text, textAlign: 'center' },
  desc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  stepsList: { width: '100%', gap: 12, marginTop: 4 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  stepIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  stepTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  stepSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, width: '100%',
  },
  warningText: { flex: 1, fontSize: 13, color: Colors.warning, lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 17,
  },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
