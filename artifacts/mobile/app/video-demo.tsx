import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, Platform, Pressable, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

const SAMPLE_DEMOS = [
  {
    id: 'v1',
    title: 'Récolte de Bananes Plantain',
    producteur: 'Jean-Baptiste Ndong',
    province: 'Estuaire',
    likes: 124,
    thumbnail: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&h=340&fit=crop',
    duration: '0:45',
  },
  {
    id: 'v2',
    title: 'Plantation de Manioc frais',
    producteur: 'Marie-Claire Obiang',
    province: 'Ogooué-Maritime',
    likes: 89,
    thumbnail: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=340&fit=crop',
    duration: '1:12',
  },
  {
    id: 'v3',
    title: 'Notre exploitation de Safou',
    producteur: 'Éric Mboumba',
    province: 'Ngounié',
    likes: 201,
    thumbnail: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600&h=340&fit=crop',
    duration: '0:58',
  },
  {
    id: 'v4',
    title: 'Élevage de Poules traditionnelles',
    producteur: 'Angèle Nkoghe',
    province: 'Woleu-Ntem',
    likes: 76,
    thumbnail: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&h=340&fit=crop',
    duration: '2:03',
  },
];

export default function VideoDemoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [myVideos, setMyVideos] = useState<{ uri: string; title: string }[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);

  const isProducteur = user?.role === 'producteur';

  const handleFilmer = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission requise', 'Autorisez l\'accès à la caméra.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          videoMaxDuration: 60,
          quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
        });
        if (!result.canceled && result.assets[0]) {
          setMyVideos(prev => [{ uri: result.assets[0].uri, title: 'Ma vidéo démo' }, ...prev]);
          Alert.alert('✅ Vidéo ajoutée', 'Votre vidéo démo a été enregistrée avec succès !');
        }
        return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 60,
      });
      if (!result.canceled && result.assets[0]) {
        setMyVideos(prev => [{ uri: result.assets[0].uri, title: 'Ma vidéo démo' }, ...prev]);
        Alert.alert('✅ Vidéo ajoutée', 'Votre vidéo démo a été enregistrée avec succès !');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra ou galerie.');
    }
  };

  const toggleLike = (id: string) => {
    setLikedVideos(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Vidéos Démo</Text>
          <Text style={styles.headerSub}>Marketing produits agricoles</Text>
        </View>
        {isProducteur && (
          <TouchableOpacity style={styles.filmBtn} onPress={handleFilmer} activeOpacity={0.8}>
            <Feather name="video" size={16} color="#fff" />
            <Text style={styles.filmBtnText}>Filmer</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: btmPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info marketing */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Feather name="trending-up" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>
              {isProducteur ? 'Boostez vos ventes avec la vidéo' : 'Découvrez les producteurs gabonais'}
            </Text>
            <Text style={styles.infoText}>
              {isProducteur
                ? 'Les produits avec vidéo reçoivent 3× plus de commandes. Filmez votre terrain, votre récolte, votre qualité !'
                : 'Voyez directement le terrain et la qualité des produits avant d\'acheter.'}
            </Text>
          </View>
        </View>

        {/* Mes vidéos (producteur seulement) */}
        {isProducteur && myVideos.length > 0 && (
          <View style={styles.myVideosSection}>
            <Text style={styles.sectionTitle}>Mes vidéos</Text>
            {myVideos.map((v, idx) => (
              <View key={idx} style={styles.myVideoCard}>
                <View style={styles.myVideoIcon}>
                  <Feather name="video" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.myVideoTitle}>{v.title}</Text>
                <View style={styles.publishedBadge}>
                  <Feather name="check-circle" size={12} color={Colors.success} />
                  <Text style={styles.publishedText}>Publié</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Vidéos de la communauté */}
        <Text style={styles.sectionTitle}>Vidéos de la communauté</Text>
        <View style={styles.grid}>
          {SAMPLE_DEMOS.map(demo => (
            <Pressable
              key={demo.id}
              style={({ pressed }) => [styles.videoCard, { opacity: pressed ? 0.9 : 1 }]}
              onPress={() => Alert.alert('📹 ' + demo.title, `Producteur: ${demo.producteur}\nProvince: ${demo.province}\n\n(Lecture vidéo native sur l'appareil)`)}
            >
              <View style={styles.thumbnailWrap}>
                <Image source={{ uri: demo.thumbnail }} style={styles.thumbnail} contentFit="cover" />
                <View style={styles.playOverlay}>
                  <Feather name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{demo.duration}</Text>
                </View>
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>{demo.title}</Text>
                <View style={styles.videoMeta}>
                  <View style={styles.producerRow}>
                    <Feather name="user" size={11} color={Colors.textMuted} />
                    <Text style={styles.producerText}>{demo.producteur}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleLike(demo.id)}
                    style={styles.likeBtn}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name="heart"
                      size={14}
                      color={likedVideos.includes(demo.id) ? Colors.error : Colors.textMuted}
                    />
                    <Text style={[
                      styles.likeCount,
                      likedVideos.includes(demo.id) && { color: Colors.error },
                    ]}>
                      {likedVideos.includes(demo.id) ? demo.likes + 1 : demo.likes}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.provinceTag}>
                  <Feather name="map-pin" size={10} color={Colors.blue} />
                  <Text style={styles.provinceText}>{demo.province}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary },
  filmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.blue, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  filmBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: 16, gap: 0 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.primaryLight, borderRadius: 14,
    padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  infoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  infoTitle: { fontSize: 13, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  infoText: { fontSize: 12, color: Colors.primary + 'CC', lineHeight: 17 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  myVideosSection: { marginBottom: 20 },
  myVideoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  myVideoIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  myVideoTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },
  publishedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.success + '15',
    borderRadius: 100, paddingHorizontal: 8, paddingVertical: 4,
  },
  publishedText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  grid: { gap: 14 },
  videoCard: {
    backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  thumbnailWrap: { position: 'relative', height: 180 },
  thumbnail: { width: '100%', height: 180 },
  playOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  durationBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  videoInfo: { padding: 12, gap: 6 },
  videoTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  videoMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  producerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  producerText: { fontSize: 12, color: Colors.textMuted },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  provinceTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
  },
  provinceText: { fontSize: 11, color: Colors.blue, fontWeight: '600' },
});
