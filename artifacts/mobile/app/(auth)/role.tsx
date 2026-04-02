import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

const ROLES: { id: UserRole; icon: string; iconColor: string; iconBg: string; title: string; desc: string }[] = [
  {
    id: 'producteur',
    icon: '🌱', iconColor: Colors.primary, iconBg: Colors.primaryLight,
    title: 'Producteur',
    desc: 'Je cultive et je vends mes récoltes',
  },
  {
    id: 'acheteur',
    icon: '🛍', iconColor: Colors.accent, iconBg: '#FFF8E1',
    title: 'Acheteur',
    desc: 'Je cherche des produits frais du terroir',
  },
  {
    id: 'transporteur',
    icon: '🚚', iconColor: Colors.blue, iconBg: Colors.blueSoft,
    title: 'Transporteur',
    desc: 'Je transporte les marchandises',
  },
];

export default function RoleScreen() {
  const { setRole } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await setRole(selected);
      router.push('/(auth)/province' as any);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad + 16, paddingBottom: btmPad }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeBadge}>
          <Text style={styles.welcomeText}>Bienvenue</Text>
        </View>
        <Text style={styles.title}>Qui êtes-vous ?</Text>
        <Text style={styles.subtitle}>
          Choisissez votre rôle pour personnaliser{'\n'}votre expérience
        </Text>

        <View style={styles.roleList}>
          {ROLES.map(role => {
            const isActive = selected === role.id;
            return (
              <Pressable
                key={role.id}
                onPress={() => setSelected(role.id)}
                style={({ pressed }) => [
                  styles.roleCard,
                  isActive && styles.roleCardActive,
                  { opacity: pressed ? 0.95 : 1 },
                ]}
              >
                <View style={[styles.roleIconWrap, { backgroundColor: role.iconBg }]}>
                  <Text style={styles.roleIcon}>{role.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleTitle, isActive && { color: Colors.primary }]}>
                    {role.title}
                  </Text>
                  <Text style={styles.roleDesc}>{role.desc}</Text>
                </View>
                {isActive && (
                  <View style={styles.checkCircle}>
                    <Feather name="check" size={14} color="#fff" />
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
            <Text style={styles.btnText}>Continuer</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 24, paddingBottom: 8, gap: 12 },
  welcomeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 100,
  },
  welcomeText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  title: { fontSize: 30, fontWeight: '900', color: Colors.text, lineHeight: 36 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginTop: -4 },
  roleList: { gap: 12, marginTop: 8 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 18,
    borderWidth: 2, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '60' },
  roleIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  roleIcon: { fontSize: 24 },
  roleTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  roleDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  btn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 17,
  },
  btnDisabled: { backgroundColor: '#A8C5B5' },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
