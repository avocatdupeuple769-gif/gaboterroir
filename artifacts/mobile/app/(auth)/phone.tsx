import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal,
  Platform, Pressable, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import GaboTerroirLogo from '@/components/GaboTerroirLogo';

interface Country {
  name: string;
  code: string;
  dial: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { name: 'Gabon', code: 'GA', dial: '+241', flag: '🇬🇦' },
  { name: 'Cameroun', code: 'CM', dial: '+237', flag: '🇨🇲' },
  { name: 'Congo', code: 'CG', dial: '+242', flag: '🇨🇬' },
  { name: 'Congo (RDC)', code: 'CD', dial: '+243', flag: '🇨🇩' },
  { name: 'Côte d\'Ivoire', code: 'CI', dial: '+225', flag: '🇨🇮' },
  { name: 'Sénégal', code: 'SN', dial: '+221', flag: '🇸🇳' },
  { name: 'Mali', code: 'ML', dial: '+223', flag: '🇲🇱' },
  { name: 'Burkina Faso', code: 'BF', dial: '+226', flag: '🇧🇫' },
  { name: 'Niger', code: 'NE', dial: '+227', flag: '🇳🇪' },
  { name: 'Tchad', code: 'TD', dial: '+235', flag: '🇹🇩' },
  { name: 'Guinée équatoriale', code: 'GQ', dial: '+240', flag: '🇬🇶' },
  { name: 'São Tomé-et-Príncipe', code: 'ST', dial: '+239', flag: '🇸🇹' },
  { name: 'Guinée', code: 'GN', dial: '+224', flag: '🇬🇳' },
  { name: 'Bénin', code: 'BJ', dial: '+229', flag: '🇧🇯' },
  { name: 'Togo', code: 'TG', dial: '+228', flag: '🇹🇬' },
  { name: 'Ghana', code: 'GH', dial: '+233', flag: '🇬🇭' },
  { name: 'Nigeria', code: 'NG', dial: '+234', flag: '🇳🇬' },
  { name: 'Angola', code: 'AO', dial: '+244', flag: '🇦🇴' },
  { name: 'Mozambique', code: 'MZ', dial: '+258', flag: '🇲🇿' },
  { name: 'Kenya', code: 'KE', dial: '+254', flag: '🇰🇪' },
  { name: 'Tanzanie', code: 'TZ', dial: '+255', flag: '🇹🇿' },
  { name: 'Éthiopie', code: 'ET', dial: '+251', flag: '🇪🇹' },
  { name: 'Maroc', code: 'MA', dial: '+212', flag: '🇲🇦' },
  { name: 'Algérie', code: 'DZ', dial: '+213', flag: '🇩🇿' },
  { name: 'Tunisie', code: 'TN', dial: '+216', flag: '🇹🇳' },
  { name: 'Égypte', code: 'EG', dial: '+20', flag: '🇪🇬' },
  { name: 'Afrique du Sud', code: 'ZA', dial: '+27', flag: '🇿🇦' },
  { name: 'France', code: 'FR', dial: '+33', flag: '🇫🇷' },
  { name: 'Belgique', code: 'BE', dial: '+32', flag: '🇧🇪' },
  { name: 'Suisse', code: 'CH', dial: '+41', flag: '🇨🇭' },
  { name: 'Canada', code: 'CA', dial: '+1', flag: '🇨🇦' },
  { name: 'États-Unis', code: 'US', dial: '+1', flag: '🇺🇸' },
  { name: 'Royaume-Uni', code: 'GB', dial: '+44', flag: '🇬🇧' },
  { name: 'Allemagne', code: 'DE', dial: '+49', flag: '🇩🇪' },
  { name: 'Portugal', code: 'PT', dial: '+351', flag: '🇵🇹' },
  { name: 'Espagne', code: 'ES', dial: '+34', flag: '🇪🇸' },
  { name: 'Italie', code: 'IT', dial: '+39', flag: '🇮🇹' },
  { name: 'Chine', code: 'CN', dial: '+86', flag: '🇨🇳' },
  { name: 'Inde', code: 'IN', dial: '+91', flag: '🇮🇳' },
  { name: 'Brésil', code: 'BR', dial: '+55', flag: '🇧🇷' },
];

export default function PhoneScreen() {
  const { sendCustomOTP, login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search)
    ),
    [search]
  );

  const handleContinue = async () => {
    const clean = phone.replace(/\s/g, '').replace(/^0+/, '');
    if (clean.length < 4) {
      setError('Numéro invalide');
      return;
    }
    setError('');
    setDevCode(null);
    setLoading(true);
    const fullPhone = `${selectedCountry.dial}${clean}`;

    if (Platform.OS === 'web') {
      try {
        await login(fullPhone);
        router.push('/(auth)/otp' as any);
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const result = await sendCustomOTP(fullPhone);
      if (!result.smsSent && result.devCode) {
        setDevCode(result.devCode);
        Alert.alert(
          'Mode démonstration',
          `Le service SMS n'est pas encore configuré.\n\nVotre code de vérification est :\n\n${result.devCode}`,
          [{ text: 'OK', onPress: () => router.push('/(auth)/otp' as any) }]
        );
      } else {
        router.push('/(auth)/otp' as any);
      }
    } catch (e: any) {
      setError('Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 12) : insets.top;
  const btmPad = Platform.OS === 'web' ? 20 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choisir un pays</Text>
            <TouchableOpacity onPress={() => { setPickerVisible(false); setSearch(''); }} activeOpacity={0.7}>
              <Feather name="x" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Feather name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un pays…"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item.code}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryRow,
                  selectedCountry.code === item.code && styles.countryRowActive,
                ]}
                onPress={() => {
                  setSelectedCountry(item);
                  setPickerVisible(false);
                  setSearch('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryDial}>{item.dial}</Text>
                {selectedCountry.code === item.code && (
                  <Feather name="check" size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </Modal>

      <View style={[styles.inner, { paddingTop: topPad + 16, paddingBottom: btmPad + 10 }]}>
        <View style={styles.heroSection}>
          <GaboTerroirLogo size={88} />
          <Text style={styles.appName}>GaboTerroir</Text>
          <Text style={styles.tagline}>Le marché agricole du Gabon</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Votre numéro de téléphone</Text>

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.prefix}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{selectedCountry.flag}</Text>
              <Text style={styles.dialCode}>{selectedCountry.dial}</Text>
              <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>

            <TextInput
              value={phone}
              onChangeText={t => { setPhone(t); setError(''); setDevCode(null); }}
              placeholder="Numéro de téléphone"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="phone-pad"
              style={styles.input}
              maxLength={15}
            />
          </View>

          {devCode ? (
            <View style={styles.devCodeBox}>
              <Text style={styles.devCodeLabel}>Code de vérification (mode démo) :</Text>
              <Text style={styles.devCodeValue}>{devCode}</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={handleContinue}
            disabled={loading || phone.replace(/\s/g, '').length < 4}
            style={({ pressed }) => [
              styles.btn,
              (loading || phone.replace(/\s/g, '').length < 4) && styles.btnDisabled,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.primaryDark} size="small" />
            ) : (
              <>
                <Text style={styles.btnText}>Recevoir le code SMS</Text>
                <Feather name="arrow-right" size={18} color={Colors.primaryDark} />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  inner: { flex: 1, paddingHorizontal: 22, justifyContent: 'center', gap: 20 },
  heroSection: { alignItems: 'center', gap: 5 },
  appName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '400' },
  card: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 18, padding: 16, gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#fff', textAlign: 'center' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  prefix: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 11,
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)',
  },
  flag: { fontSize: 18 },
  dialCode: { fontSize: 14, fontWeight: '700', color: '#fff' },
  input: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 16, fontWeight: '600', color: '#fff',
  },
  devCodeBox: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.accent, alignItems: 'center', gap: 4,
  },
  devCodeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  devCodeValue: { fontSize: 28, fontWeight: '900', color: Colors.accent, letterSpacing: 8 },
  error: { fontSize: 12, color: Colors.accent, textAlign: 'center' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 12,
    paddingVertical: 13, marginTop: 2,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 15, fontWeight: '800', color: Colors.primaryDark },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: '#f5f5f5', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  countryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  countryRowActive: { backgroundColor: Colors.primaryLight },
  countryFlag: { fontSize: 24 },
  countryName: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
  countryDial: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  separator: { height: 1, backgroundColor: '#f5f5f5', marginLeft: 56 },
});
