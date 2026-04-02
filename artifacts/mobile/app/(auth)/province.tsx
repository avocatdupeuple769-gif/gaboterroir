import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { PROVINCES, PROVINCE_CITIES } from '@/constants/provinces';
import { useAuth } from '@/context/AuthContext';
import { Province } from '@/types';

const PROVINCE_EMOJIS: Record<Province, string> = {
  'Estuaire': '🏙',
  'Haut-Ogooué': '⛰',
  'Moyen-Ogooué': '🌊',
  'Ngounié': '🍃',
  'Nyanga': '🏖',
  'Ogooué-Ivindo': '🌳',
  'Ogooué-Lolo': '🌲',
  'Ogooué-Maritime': '⚓',
  'Woleu-Ntem': '🌿',
};

const ROLE_LABELS: Record<string, string> = {
  producteur: 'Producteur',
  transporteur: 'Transporteur',
  acheteur: 'Acheteur',
};

export default function ProvinceScreen() {
  const { updateProvince, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Province | null>(null);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const roleLabel = ROLE_LABELS[user?.role ?? 'acheteur'] ?? 'Utilisateur';

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await updateProvince(selected);
      router.push('/(auth)/info' as any);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 10 })}>
          <View style={styles.backBtn}>
            <Feather name="arrow-left" size={18} color={Colors.text} />
          </View>
        </Pressable>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: btmPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Votre province</Text>
        <Text style={styles.subtitle}>
          Dans quelle province du Gabon exercez-vous{'\n'}en tant que {roleLabel.toLowerCase()} ?
        </Text>
        <View style={styles.countRow}>
          <Feather name="map-pin" size={14} color={Colors.primary} />
          <Text style={styles.countText}>9 provinces du Gabon</Text>
        </View>

        <View style={styles.list}>
          {PROVINCES.map(prov => {
            const isActive = selected === prov;
            const cities = PROVINCE_CITIES[prov];
            return (
              <Pressable
                key={prov}
                onPress={() => setSelected(prov)}
                style={({ pressed }) => [
                  styles.card,
                  isActive && styles.cardActive,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <View style={[styles.emojiWrap, isActive && { backgroundColor: Colors.primaryLight }]}>
                  <Text style={styles.emoji}>{PROVINCE_EMOJIS[prov]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.provName, isActive && { color: Colors.primary }]}>{prov}</Text>
                  <Text style={styles.provCities} numberOfLines={1}>
                    {cities.slice(0, 3).join(', ')}
                  </Text>
                </View>
                {isActive && (
                  <View style={styles.checkCircle}>
                    <Feather name="check" size={13} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: btmPad + 12 }]}>
        <Pressable
          onPress={handleContinue}
          disabled={!selected || loading}
          style={({ pressed }) => [
            styles.btn,
            (!selected || loading) && styles.btnDisabled,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.btnText}>Continuer</Text>
              <Feather name="chevron-right" size={18} color="#fff" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  roleBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
  },
  roleText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginTop: -4 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  list: { gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardActive: { borderColor: Colors.primary },
  emojiWrap: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  provName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  provCities: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 17,
  },
  btnDisabled: { backgroundColor: '#A8C5B5' },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
