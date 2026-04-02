import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

const STEPS = ['Analyse du document', 'Comparaison faciale'];

export default function KycProcessingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;
  const [step, setStep] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    const t1 = setTimeout(() => setStep(1), 1500);
    const t2 = setTimeout(() => {
      router.replace('/kyc/success');
    }, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={18} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certification KYC</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <View style={styles.spinnerDot} />
        </Animated.View>

        <Text style={styles.title}>Vérification en cours...</Text>
        <Text style={styles.desc}>L'IA analyse votre dossier. Cela prend{'\n'}quelques secondes.</Text>

        <View style={styles.stepsList}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepRow}>
              <Feather
                name="check-circle"
                size={20}
                color={i <= step ? Colors.primary : Colors.border}
              />
              <Text style={[styles.stepText, i <= step && styles.stepTextActive]}>{s}</Text>
            </View>
          ))}
        </View>
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
    paddingHorizontal: 32, gap: 24,
  },
  spinnerDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 6, elevation: 8,
  },
  title: { fontSize: 26, fontWeight: '900', color: Colors.text, textAlign: 'center' },
  desc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  stepsList: { gap: 14, width: '100%' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepText: { fontSize: 15, fontWeight: '600', color: Colors.border },
  stepTextActive: { color: Colors.primary },
});
