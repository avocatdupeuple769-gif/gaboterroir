import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Product, ProductCategory, Province } from '@/types';

const CATEGORIES: ProductCategory[] = [
  'Tubercules', 'Fruits', 'Légumes', 'Céréales',
  'Viande & Poisson', 'Épices', 'Boissons', 'Autre',
];

const PROVINCES: Province[] = [
  'Estuaire', 'Haut-Ogooué', 'Moyen-Ogooué', 'Ngounié',
  'Nyanga', 'Ogooué-Ivindo', 'Ogooué-Lolo', 'Ogooué-Maritime', 'Woleu-Ntem',
];

const UNITS = ['kg', 'régime', 'sac', 'litre', 'panier', 'boîte', 'tête', 'unité'];

export default function AddProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addProduct } = useApp();
  const { user } = useAuth();

  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState('');
  const [quantite, setQuantite] = useState('');
  const [village, setVillage] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState<ProductCategory>('Fruits');
  const [province, setProvince] = useState<Province>(user?.province as Province || 'Estuaire');
  const [unit, setUnit] = useState('kg');
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const openGallery = async (): Promise<string | null> => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie dans les paramètres.');
          return null;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (e) {
      console.warn('Gallery error:', e);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie. Réessayez.');
      return null;
    }
  };

  const openCamera = async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisez l\'accès à la caméra dans les paramètres.');
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (e) {
      console.warn('Camera error:', e);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la caméra. Réessayez.');
      return null;
    }
  };

  const pickPhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert('Maximum', 'Vous pouvez ajouter au maximum 3 photos.');
      return;
    }

    if (Platform.OS === 'web') {
      const uri = await openGallery();
      if (uri) setPhotos(prev => [...prev, uri]);
      return;
    }

    const choice = await new Promise<'camera' | 'gallery' | null>((resolve) => {
      Alert.alert(
        'Ajouter une photo',
        'Choisissez la source',
        [
          { text: 'Caméra 📷', onPress: () => resolve('camera') },
          { text: 'Galerie 🖼️', onPress: () => resolve('gallery') },
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
        ]
      );
    });

    if (!choice) return;

    const uri = choice === 'camera' ? await openCamera() : await openGallery();
    if (uri) setPhotos(prev => [...prev, uri]);
  };

  const pickVideo = async () => {
    try {
      if (Platform.OS !== 'web') {
        const choice = await new Promise<'camera' | 'gallery' | null>((resolve) => {
          Alert.alert(
            'Ajouter une vidéo démo',
            'Choisissez la source',
            [
              { text: 'Filmer', onPress: () => resolve('camera') },
              { text: 'Galerie', onPress: () => resolve('gallery') },
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
            ]
          );
        });
        if (!choice) return;
        if (choice === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission requise', 'Autorisez la caméra.'); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, videoMaxDuration: 60 });
          if (!result.canceled && result.assets?.[0]) setVideoUri(result.assets[0].uri);
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, videoMaxDuration: 60 });
      if (!result.canceled && result.assets?.[0]) setVideoUri(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'accéder à la vidéo.');
    }
  };

  const handleSubmit = async () => {
    if (!nom.trim()) { Alert.alert('Champ manquant', 'Entrez le nom du produit.'); return; }
    if (!prix.trim() || isNaN(Number(prix)) || Number(prix) <= 0) { Alert.alert('Prix invalide', 'Entrez un prix valide supérieur à 0.'); return; }
    if (!quantite.trim() || isNaN(Number(quantite)) || Number(quantite) <= 0) { Alert.alert('Quantité invalide', 'Entrez une quantité valide.'); return; }
    if (photos.length === 0) { Alert.alert('Photo requise', 'Ajoutez au moins une photo du produit.'); return; }

    setLoading(true);
    setUploadStep('Préparation du produit…');

    const pid = `prod_${Date.now()}`;
    const newProduct: Product = {
      id: pid,
      idVendeur: user?.id ?? 'local',
      vendeurNom: user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : user?.telephone ?? 'Vendeur',
      vendeurPhoto: user?.photoProfile ?? '',
      vendeurNote: user?.note ?? 5.0,
      nom: nom.trim(),
      description: description.trim() || undefined,
      categorie,
      prix: Number(prix),
      quantite: Number(quantite),
      unite: unit,
      photoProduct: photos[0],
      photos: [...photos],
      videoProduct: videoUri ?? null,
      coordonneesGPS: {
        latitude: 0.4162,
        longitude: 9.4673,
        village: village.trim() || (user?.province ?? 'Gabon'),
      },
      province,
      statut: 'disponible',
      createdAt: new Date().toISOString(),
    };

    try {
      setUploadStep('Upload des photos…');
      await addProduct(newProduct);
      setLoading(false);
      Alert.alert(
        '✅ Produit publié !',
        `"${nom.trim()}" est maintenant visible sur le marché.`,
        [{ text: 'Voir mes stocks', onPress: () => router.replace('/(tabs)/seller' as any) }]
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('Erreur', 'La publication a échoué. Vérifiez votre connexion et réessayez.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publier une récolte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: btmPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos du produit *</Text>
          <Text style={styles.sectionSub}>Ajoutez jusqu'à 3 photos (obligatoire)</Text>
          <View style={styles.photosRow}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoWrap}>
                <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                  activeOpacity={0.8}
                >
                  <Feather name="x" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 3 && (
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto} activeOpacity={0.8}>
                <Feather name="camera" size={26} color={Colors.primary} />
                <Text style={styles.addPhotoText}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>
          {photos.length === 0 && (
            <Text style={styles.photoHint}>📸 La photo est obligatoire pour publier</Text>
          )}
        </View>

        {/* Vidéo démo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vidéo démo (optionnelle)</Text>
          <Text style={styles.sectionSub}>Filmez votre produit pour attirer plus d'acheteurs</Text>
          {videoUri ? (
            <View style={styles.videoPreview}>
              <Feather name="video" size={24} color={Colors.primary} />
              <Text style={styles.videoName} numberOfLines={1}>Vidéo ajoutée ✓</Text>
              <TouchableOpacity onPress={() => setVideoUri(null)} style={styles.removeVideoBtn}>
                <Feather name="x" size={14} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addVideoBtn} onPress={pickVideo} activeOpacity={0.8}>
              <Feather name="video" size={20} color="#fff" />
              <Text style={styles.addVideoBtnText}>Filmer / Choisir une vidéo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nom */}
        <View style={styles.section}>
          <Text style={styles.label}>Nom du produit *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Bananes Plantain, Manioc frais…"
            placeholderTextColor={Colors.textMuted}
            value={nom}
            onChangeText={setNom}
          />
        </View>

        {/* Catégorie */}
        <View style={styles.section}>
          <Text style={styles.label}>Catégorie *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pillsRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pill, categorie === cat && styles.pillActive]}
                  onPress={() => setCategorie(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, categorie === cat && styles.pillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Prix + Quantité */}
        <View style={styles.row2}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>Prix (FCFA) *</Text>
            <TextInput
              style={styles.input}
              placeholder="5000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={prix}
              onChangeText={setPrix}
            />
          </View>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>Quantité *</Text>
            <TextInput
              style={styles.input}
              placeholder="50"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={quantite}
              onChangeText={setQuantite}
            />
          </View>
        </View>

        {/* Unité */}
        <View style={styles.section}>
          <Text style={styles.label}>Unité *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pillsRow}>
              {UNITS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.pill, unit === u && styles.pillActive]}
                  onPress={() => setUnit(u)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, unit === u && styles.pillTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Province */}
        <View style={styles.section}>
          <Text style={styles.label}>Province *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pillsRow}>
              {PROVINCES.map(prov => (
                <TouchableOpacity
                  key={prov}
                  style={[styles.pill, province === prov && styles.pillActive]}
                  onPress={() => setProvince(prov)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, province === prov && styles.pillTextActive]}>{prov}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Village */}
        <View style={styles.section}>
          <Text style={styles.label}>Village / Localité</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Ntoum, Libreville, Lambaréné…"
            placeholderTextColor={Colors.textMuted}
            value={village}
            onChangeText={setVillage}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (optionnelle)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Décrivez votre produit, sa qualité, la récolte…"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>
      </ScrollView>

      {/* Submit */}
      <View style={[styles.footer, { paddingBottom: btmPad + 16 }]}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>{uploadStep || 'Publication en cours…'}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Feather name="upload-cloud" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>
            {loading ? 'Publication…' : 'Publier le produit'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 4,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  content: { padding: 16, gap: 0 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.text,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  textarea: { height: 96, textAlignVertical: 'top', paddingTop: 12 },
  row2: { flexDirection: 'row', gap: 12 },
  photosRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  photoWrap: { width: 86, height: 86, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photoThumb: { width: 86, height: 86 },
  removePhoto: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 10, padding: 3,
  },
  addPhotoBtn: {
    width: 86, height: 86, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  photoHint: { fontSize: 12, color: Colors.warning, marginTop: 8, fontWeight: '600' },
  addVideoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.blue, borderRadius: 12, paddingVertical: 13,
  },
  addVideoBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  videoPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.primary,
  },
  videoName: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.primary },
  removeVideoBtn: { padding: 4 },
  pillsRow: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  pillTextActive: { color: '#fff' },
  footer: {
    padding: 16,
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 8,
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 4,
  },
  loadingText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15,
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
