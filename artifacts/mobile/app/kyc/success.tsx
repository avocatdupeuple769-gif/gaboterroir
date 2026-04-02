import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

export default function KycSuccessScreen() {
  const router = useRouter();
  const { finishOnboarding } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={async () => { await finishOnboarding(); router.replace('/(tabs)'); }} style={styles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={18} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certification KYC</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.successCircle}>
          <Feather name="check" size={48} color="#fff" />
        </View>
        <Text style={styles.title}>Vérifié avec succès !</Text>
        <Text style={styles.desc}>
          Votre identité a été confirmée. Le badge "Vérifié" est maintenant visible sur votre profil.
        </Text>

        <View style={styles.badgeRow}>
          <Feather name="shield" size={16} color={Colors.primary} />
          <Text style={styles.badgeText}>Identité Vérifiée</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: btmPad + 20 }]}>
        <Pressable
          onPress={async () => { await finishOnboarding(); router.replace('/(tabs)'); }}
          style={({ pressed }) => [styles.marketBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.marketBtnText}>Accéder au marché</Text>
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
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 20,
  },
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '900', color: Colors.primary, textAlign: 'center' },
  desc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  badgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 100, borderWidth: 1.5, borderColor: Colors.primary,
  },
  badgeText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  footer: { paddingHorizontal: 32, paddingTop: 12 },
  marketBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 17,
  },
  marketBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
