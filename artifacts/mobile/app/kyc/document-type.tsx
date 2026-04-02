import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

const DOC_TYPES = [
  { id: 'cni', emoji: '🪪', label: 'CNI Gabonaise' },
  { id: 'passport', emoji: '📘', label: 'Passeport' },
  { id: 'permis', emoji: '🚗', label: 'Permis de conduire' },
];

const TOTAL_STEPS_BY_ROLE = { producteur: 3, transporteur: 4, acheteur: 2 };

function StepIndicator({ total }: { total: number }) {
  const stepNames = total === 4
    ? ['Document', 'Selfie', 'Véhicule', 'Assurance']
    : total === 3
    ? ['Document', 'Selfie', 'Terrain']
    : ['Document', 'Selfie'];

  return (
    <View style={siStyles.container}>
      {stepNames.map((name, i) => (
        <React.Fragment key={name}>
          {i > 0 && <View style={siStyles.line} />}
          {i === 0 ? (
            <View style={siStyles.activeStep}>
              <Feather name="check" size={12} color="#fff" />
              <Text style={siStyles.activeLabel}>{name}</Text>
            </View>
          ) : (
            <View style={siStyles.inactiveStep}>
              <Text style={siStyles.inactiveNum}>{i + 1}</Text>
              <Text style={siStyles.inactiveLabel}>{name}</Text>
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const siStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  activeStep: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
  },
  activeLabel: { fontSize: 11, fontWeight: '700', color: '#fff' },
  line: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  inactiveStep: { alignItems: 'center', gap: 2 },
  inactiveNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.border,
    textAlign: 'center', lineHeight: 24, fontSize: 11, fontWeight: '700', color: Colors.textMuted,
  },
  inactiveLabel: { fontSize: 10, color: Colors.textMuted },
});

export default function DocumentTypeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const role = (user?.role ?? 'acheteur') as keyof typeof TOTAL_STEPS_BY_ROLE;
  const totalSteps = TOTAL_STEPS_BY_ROLE[role] ?? 2;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={18} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certification KYC</Text>
        <View style={{ width: 36 }} />
      </View>

      <StepIndicator total={totalSteps} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: btmPad + 100 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Type de document</Text>
        <Text style={styles.desc}>Quel document souhaitez-vous utiliser{'\n'}pour la vérification ?</Text>

        <View style={styles.docList}>
          {DOC_TYPES.map(doc => (
            <Pressable
              key={doc.id}
              onPress={() => setSelected(doc.id)}
              style={({ pressed }) => [
                styles.docCard,
                selected === doc.id && styles.docCardSelected,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={styles.docEmoji}>{doc.emoji}</Text>
              <Text style={styles.docLabel}>{doc.label}</Text>
              {selected === doc.id && <Feather name="check" size={16} color={Colors.primary} />}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: btmPad + 12 }]}>
        <Pressable
          onPress={() => router.push('/kyc/document-scan')}
          disabled={!selected}
          style={({ pressed }) => [
            styles.nextBtn,
            !selected && styles.nextBtnDisabled,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.nextBtnText}>Continuer</Text>
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
    paddingHorizontal: 16, paddingBottom: 10,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  content: { paddingHorizontal: 24, paddingTop: 10, gap: 16 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.text, textAlign: 'center' },
  desc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  docList: { gap: 12 },
  docCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  docCardSelected: { borderColor: Colors.primary },
  docEmoji: { fontSize: 28 },
  docLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 17,
  },
  nextBtnDisabled: { backgroundColor: '#A8C5B5' },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
