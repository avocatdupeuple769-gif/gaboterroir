import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text,
  TextInput, TouchableOpacity, View, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import GaboTerroirLogo from '@/components/GaboTerroirLogo';

const CODE_LENGTH = 4;

export default function OtpScreen() {
  const { user, verifyCustomOTP } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleVerify = async () => {
    if (code.length < CODE_LENGTH) return;
    setError('');
    setLoading(true);

    if (Platform.OS === 'web') {
      setLoading(false);
      router.push('/(auth)/role' as any);
      return;
    }

    try {
      const valid = await verifyCustomOTP(code);
      if (valid) {
        router.push('/(auth)/role' as any);
      } else {
        setError('Code incorrect, vérifiez et réessayez');
      }
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('expiré') || msg.includes('session')) {
        setError('Code expiré — retournez en arrière pour en recevoir un nouveau');
      } else {
        setError('Erreur de vérification, réessayez');
      }
    } finally {
      setLoading(false);
    }
  };

  const digits = code.padEnd(CODE_LENGTH, ' ').split('').slice(0, CODE_LENGTH);

  return (
    <View style={[styles.container, { paddingTop: topPad + 40, paddingBottom: btmPad + 20 }]}>
      {/* Hero */}
      <View style={styles.heroSection}>
        <GaboTerroirLogo size={110} />
        <Text style={styles.appName}>GaboTerroir</Text>
        <Text style={styles.tagline}>Le marché agricole du Gabon</Text>
        <View style={styles.flagBars}>
          <View style={[styles.bar, { backgroundColor: Colors.primary }]} />
          <View style={[styles.bar, { backgroundColor: Colors.accent }]} />
          <View style={[styles.bar, { backgroundColor: Colors.blue }]} />
        </View>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Feather name="shield" size={36} color={Colors.accent} style={{ alignSelf: 'center' }} />
        <Text style={styles.cardTitle}>Code de vérification</Text>

        <Text style={styles.cardSub}>
          Code SMS envoyé au{'\n'}
          <Text style={styles.phoneHighlight}>{user?.telephone ?? '…'}</Text>
        </Text>

        {/* Hidden input */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, CODE_LENGTH)); setError(''); }}
          keyboardType="numeric"
          maxLength={CODE_LENGTH}
          style={styles.hiddenInput}
          autoFocus
        />

        {/* 4 digit boxes */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
          style={styles.codeRow}
        >
          {digits.map((d, i) => (
            <View
              key={i}
              style={[
                styles.codeBox,
                code.length === i && styles.codeBoxActive,
                d.trim() && styles.codeBoxFilled,
              ]}
            >
              <Text style={styles.codeDigit}>{d.trim()}</Text>
            </View>
          ))}
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ alignSelf: 'center' }}>
          <Text style={styles.changeLink}>Changer le numéro</Text>
        </TouchableOpacity>
      </View>

      {/* Verify button */}
      <Pressable
        onPress={handleVerify}
        disabled={code.length < CODE_LENGTH || loading}
        style={({ pressed }) => [
          styles.btn,
          code.length < CODE_LENGTH && styles.btnDisabled,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primaryDark} size="small" />
        ) : (
          <Text style={styles.btnText}>Vérifier le code</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.primary,
    paddingHorizontal: 28, justifyContent: 'center', gap: 28,
  },
  heroSection: { alignItems: 'center', gap: 8 },
  appName: { fontSize: 32, fontWeight: '900', color: '#fff' },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  flagBars: { flexDirection: 'row', gap: 4, marginTop: 6 },
  bar: { width: 32, height: 3, borderRadius: 2 },
  card: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20, padding: 24, gap: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cardSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22 },
  phoneHighlight: { fontWeight: '700', color: Colors.accent },
  hiddenInput: {
    position: 'absolute', width: 1, height: 1,
    opacity: 0, color: 'transparent',
  },
  codeRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', paddingVertical: 4 },
  codeBox: {
    width: 56, height: 64, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  codeBoxActive: { borderColor: Colors.accent },
  codeBoxFilled: { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.1)' },
  codeDigit: { fontSize: 26, fontWeight: '800', color: '#fff' },
  errorText: { fontSize: 13, color: Colors.accent, textAlign: 'center' },
  changeLink: { fontSize: 14, fontWeight: '700', color: Colors.accent },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: '800', color: Colors.primaryDark },
});
