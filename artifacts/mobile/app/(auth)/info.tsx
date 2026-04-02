import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

interface Field {
  key: 'nom' | 'prenom' | 'ville' | 'quartier';
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  label: string;
  placeholder: string;
}

const FIELDS: Field[] = [
  { key: 'nom', icon: 'user', iconColor: Colors.primary, label: 'Nom', placeholder: 'Votre nom de famille' },
  { key: 'prenom', icon: 'user', iconColor: Colors.primary, label: 'Prénom', placeholder: 'Votre prénom' },
  { key: 'ville', icon: 'map-pin', iconColor: Colors.primary, label: 'Ville', placeholder: 'Ex: Libreville, Franceville...' },
  { key: 'quartier', icon: 'home', iconColor: Colors.warning, label: 'Quartier de résidence', placeholder: 'Ex: Nzeng-Ayong, Akébé...' },
];

export default function InfoScreen() {
  const { updatePersonalInfo, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ nom: '', prenom: '', ville: '', quartier: '' });
  const [loading, setLoading] = useState(false);

  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;
  const canContinue = form.nom.trim() && form.prenom.trim() && form.ville.trim() && form.quartier.trim();

  const handleContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    try {
      await updatePersonalInfo(form);
      router.push('/kyc' as any);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: Colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 10 })}>
          <View style={styles.backBtn}>
            <Feather name="arrow-left" size={18} color={Colors.text} />
          </View>
        </Pressable>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role === 'producteur' ? 'Producteur' : 'Transporteur'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: btmPad + 100 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Vos informations</Text>
        <Text style={styles.subtitle}>Renseignez vos coordonnées pour personnaliser votre profil producteur</Text>

        <View style={styles.formCard}>
          {FIELDS.map((f, i) => (
            <View key={f.key}>
              <View style={styles.labelRow}>
                <Feather name={f.icon} size={15} color={f.iconColor} />
                <Text style={styles.fieldLabel}>{f.label}</Text>
              </View>
              <TextInput
                value={form[f.key]}
                onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                placeholder={f.placeholder}
                placeholderTextColor={Colors.textMuted}
                style={styles.fieldInput}
                autoCapitalize="words"
              />
              {i < FIELDS.length - 1 && <View style={{ height: 14 }} />}
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Feather name="info" size={14} color={Colors.blue} />
          <Text style={styles.infoText}>
            Ces informations seront affichées sur votre profil et permettent aux autres utilisateurs de vous identifier.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: btmPad + 12 }]}>
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue || loading}
          style={({ pressed }) => [
            styles.btn,
            (!canContinue || loading) && styles.btnDisabled,
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
    </KeyboardAvoidingView>
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
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 100,
  },
  roleText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  formCard: {
    backgroundColor: Colors.surface, borderRadius: 18,
    padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  fieldInput: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.blueSoft, borderRadius: 12, padding: 14,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.blue, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 17,
  },
  btnDisabled: { backgroundColor: '#A8C5B5' },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
