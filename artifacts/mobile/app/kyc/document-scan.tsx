import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Platform, Pressable,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

type ScanMode = 'document' | 'selfie' | 'terrain' | 'vehicle' | 'insurance';

const CONFIG: Record<ScanMode, { icon: keyof typeof Feather.glyphMap; title: string; desc: string; tips: string[]; front: boolean }> = {
  document: {
    icon: 'credit-card', front: false,
    title: 'Scanner votre document',
    desc: "Placez votre CNI, Passeport ou Permis devant la caméra. L'IA va extraire les informations automatiquement.",
    tips: ['Le document ne doit pas être expiré', 'Évitez les reflets et les ombres', 'Les photocopies sont rejetées'],
  },
  selfie: {
    icon: 'user', front: true,
    title: 'Prenez votre selfie',
    desc: "Regardez directement la caméra frontale. Votre visage doit être visible et bien éclairé.",
    tips: ['Retirez lunettes et chapeau', 'Bonne luminosité, pas de contre-jour', 'Détection anti-IA activée'],
  },
  terrain: {
    icon: 'map-pin', front: false,
    title: 'Photo de votre terrain',
    desc: "Photographiez votre champ ou exploitation agricole. La localisation GPS est enregistrée.",
    tips: ['Le terrain doit être visible en entier', 'Prenez la photo en plein jour', 'La localisation GPS est requise'],
  },
  vehicle: {
    icon: 'truck', front: false,
    title: 'Photo de votre véhicule',
    desc: "Photographiez votre véhicule de transport. La plaque d'immatriculation doit être lisible.",
    tips: ["Photographiez le véhicule de face", "Plaque d'immatriculation visible", 'Fond neutre recommandé'],
  },
  insurance: {
    icon: 'file-text', front: false,
    title: "Photo de l'assurance",
    desc: "Photographiez votre attestation d'assurance. Toutes les informations doivent être lisibles.",
    tips: ['Document posé à plat, bien éclairé', 'Évitez les reflets sur le papier', 'Date de validité visible'],
  },
};

const NEXT_MODE: Record<string, Record<string, ScanMode | null>> = {
  producteur:   { document: 'selfie', selfie: 'terrain',  terrain: null },
  transporteur: { document: 'selfie', selfie: 'vehicle', vehicle: 'insurance', insurance: null },
  acheteur:     { document: 'selfie', selfie: null },
};

export default function DocumentScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: ScanMode = (params.mode as ScanMode) ?? 'document';
  const cfg = CONFIG[mode] ?? CONFIG.document;

  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const role = user?.role ?? 'acheteur';
  const stepLabels = role === 'transporteur'
    ? ['Document', 'Selfie', 'Véhicule', 'Assurance']
    : role === 'producteur'
    ? ['Document', 'Selfie', 'Terrain']
    : ['Document', 'Selfie'];
  const stepIndex = ['document', 'selfie', 'terrain', 'vehicle', 'insurance'].indexOf(mode);
  const displayIdx = mode === 'vehicle' ? 2 : mode === 'insurance' ? 3 : stepIndex;

  const handleCamera = async () => {
    if (Platform.OS === 'web') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: mode === 'selfie',
      quality: 0.85,
      cameraType: cfg.front
        ? ImagePicker.CameraType.front
        : ImagePicker.CameraType.back,
    });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };

  const handleNext = async () => {
    if (!photo) return;
    setLoading(true);
    const nextModes = NEXT_MODE[role] ?? NEXT_MODE.acheteur;
    const next = nextModes[mode];
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    if (next) {
      router.push((`/kyc/document-scan?mode=${next}`) as any);
    } else {
      router.push('/kyc/processing');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={18} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certification KYC</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        {stepLabels.map((label, i) => {
          const done = i < displayIdx;
          const active = i === displayIdx;
          return (
            <React.Fragment key={label}>
              {i > 0 && <View style={[styles.stepLine, done && { backgroundColor: Colors.primary }]} />}
              <View style={active ? styles.stepActive : done ? styles.stepDone : styles.stepInactive}>
                {done ? (
                  <Feather name="check" size={13} color="#fff" />
                ) : (
                  <Text style={active ? styles.stepActiveNum : styles.stepNum}>{i + 1}</Text>
                )}
                <Text style={active ? styles.stepActiveLabel : done ? styles.stepDoneLabel : styles.stepLabel}>{label}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Feather name={cfg.icon} size={30} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{cfg.title}</Text>
        <Text style={styles.desc}>{cfg.desc}</Text>

        {/* Viewfinder / photo preview */}
        <TouchableOpacity style={styles.viewfinder} onPress={handleCamera} activeOpacity={0.85}>
          {photo ? (
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" borderRadius={12} />
          ) : (
            <>
              <View style={styles.corner} />
              <View style={[styles.corner, { top: 0, right: 0, borderLeftWidth: 0, borderRightWidth: 3 }]} />
              <View style={[styles.corner, { bottom: 0, left: 0, borderTopWidth: 0, borderBottomWidth: 3 }]} />
              <View style={[styles.corner, { bottom: 0, right: 0, borderTopWidth: 0, borderBottomWidth: 3, borderLeftWidth: 0, borderRightWidth: 3 }]} />
              <Feather name={cfg.front ? 'user' : 'camera'} size={36} color={Colors.border} />
              <Text style={styles.viewfinderLabel}>Appuyer pour ouvrir la caméra</Text>
            </>
          )}
          {photo && (
            <View style={styles.retakeOverlay}>
              <Feather name="refresh-cw" size={18} color="#fff" />
              <Text style={styles.retakeText}>Reprendre</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Tips */}
        <View style={styles.tips}>
          {cfg.tips.map((tip, i) => (
            <Text key={i} style={styles.tip}>• {tip}</Text>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: btmPad + 12, gap: 10 }]}>
        {!photo ? (
          <Pressable
            onPress={handleCamera}
            style={({ pressed }) => [styles.photoBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Feather name="camera" size={18} color="#fff" />
            <Text style={styles.photoBtnText}>Ouvrir la caméra</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            disabled={loading}
            style={({ pressed }) => [styles.photoBtn, styles.nextBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="check" size={18} color="#fff" />
                <Text style={styles.photoBtnText}>
                  {NEXT_MODE[role]?.[mode] ? 'Étape suivante' : 'Terminer la vérification'}
                </Text>
              </>
            )}
          </Pressable>
        )}
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
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepActive: {
    alignItems: 'center', gap: 2,
    backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
    flexDirection: 'row',
  },
  stepDone: { alignItems: 'center', gap: 2, flexDirection: 'row', backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 100 },
  stepInactive: { alignItems: 'center', gap: 2 },
  stepActiveNum: { fontSize: 11, fontWeight: '800', color: '#fff' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.border, textAlign: 'center', lineHeight: 24, fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  stepActiveLabel: { fontSize: 11, fontWeight: '700', color: '#fff' },
  stepDoneLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  stepLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  content: { flex: 1, paddingHorizontal: 20, alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 66, height: 66, borderRadius: 18,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900', color: Colors.text, textAlign: 'center' },
  desc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  viewfinder: {
    width: '100%', height: 180,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, overflow: 'hidden', position: 'relative', gap: 8,
  },
  corner: {
    position: 'absolute', width: 22, height: 22, top: 0, left: 0,
    borderColor: Colors.primary, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: 2,
  },
  viewfinderLabel: { fontSize: 13, color: Colors.textMuted },
  retakeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  retakeText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  tips: { width: '100%', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, gap: 5 },
  tip: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
  },
  nextBtn: { backgroundColor: Colors.success ?? Colors.primary },
  photoBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
