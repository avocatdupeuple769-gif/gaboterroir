import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform, Pressable, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

export default function SellerScreen() {
  const { user } = useAuth();
  const { products } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const btmPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const displayName = user?.prenom && user?.nom
    ? `${user.prenom} ${user.nom}`
    : user?.telephone ?? 'Utilisateur';
  const myProducts = products.filter(
    p => p.farmerName === displayName || p.raw.idVendeur === user?.id
  );

  const roleLabel = user?.role === 'producteur' ? 'Producteur' : user?.role === 'transporteur' ? 'Transporteur' : 'Acheteur';

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: btmPad + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 10 }]}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              {user?.photoProfile ? (
                <Image source={{ uri: user.photoProfile }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Feather name="user" size={20} color={Colors.primary} />
                </View>
              )}
              {user?.cniVerified && (
                <View style={styles.verifiedBadge}>
                  <Feather name="check" size={10} color="#fff" />
                </View>
              )}
            </View>
            <View>
              <Text style={styles.headerName}>{displayName}</Text>
              <View style={styles.headerMeta}>
                <View style={styles.rolePill}>
                  <Feather name="sun" size={11} color={Colors.primary} />
                  <Text style={styles.rolePillText}>{roleLabel}</Text>
                </View>
                {user?.province ? (
                  <View style={styles.locationRow}>
                    <Feather name="map-pin" size={11} color={Colors.textSecondary} />
                    <Text style={styles.locationText}>{user.province}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/add-product' as any)}
          >
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myProducts.length}</Text>
            <Text style={styles.statLabel}>En ligne</Text>
          </View>
          <View style={[styles.statCard, styles.statDivider]}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Vendus</Text>
          </View>
          <View style={[styles.statCard, styles.statHighlight]}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: Colors.primary }]}>FCFA</Text>
          </View>
        </View>

        {/* Objectif Horizon */}
        <Pressable
          onPress={() => router.push('/leaderboard')}
          style={({ pressed }) => [styles.objectifCard, { opacity: pressed ? 0.9 : 1 }]}
        >
          <View style={styles.objectifLeft}>
            <View style={styles.trophyWrap}>
              <Feather name="award" size={20} color={Colors.warning} />
            </View>
            <View>
              <Text style={styles.objectifTitle}>Objectif Horizon</Text>
              <Text style={styles.objectifSub}>Classement Top 10 National</Text>
            </View>
          </View>
          <View style={styles.voirBtn}>
            <Text style={styles.voirText}>Voir</Text>
          </View>
        </Pressable>

        {/* Action Cards */}
        <View style={styles.actionCards}>
          <Pressable
            onPress={() => router.push('/bonus-voyage')}
            style={({ pressed }) => [styles.actionCard, styles.bonusCard, { opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={styles.actionIcon}>
              <Feather name="send" size={22} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.actionTitle}>Bonus Voyage</Text>
            <Text style={styles.actionSub}>Top 5 gagne un voyage</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionCard, styles.videoCard, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push('/video-demo' as any)}
          >
            <View style={styles.actionIcon}>
              <Feather name="video" size={22} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.actionTitle}>Vidéos Démo</Text>
            <Text style={styles.actionSub}>Marketing produits</Text>
          </Pressable>
        </View>

        {/* My products */}
        <View style={styles.productsSection}>
          {myProducts.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={styles.emptyTitle}>Aucun produit en ligne</Text>
              <Text style={styles.emptyText}>Appuyez sur + pour ajouter votre premier produit</Text>
            </View>
          ) : (
            myProducts.map(p => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/product/${p.id}`)}
                style={({ pressed }) => [styles.productRow, { opacity: pressed ? 0.9 : 1 }]}
              >
                <Image source={{ uri: p.photoProduct }} style={styles.productImg} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <View style={styles.productLocation}>
                    <Feather name="map-pin" size={11} color={Colors.textSecondary} />
                    <Text style={styles.productLocationText}>{p.city}</Text>
                  </View>
                  <View style={styles.productPriceRow}>
                    <Text style={styles.productPrice}>{p.pricePerUnit.toLocaleString('fr-FR')} FCFA</Text>
                    {p.flashSale?.active && (
                      <View style={styles.flashTag}>
                        <Feather name="zap" size={10} color={Colors.error} />
                        <Text style={styles.flashTagText}>Flash</Text>
                      </View>
                    )}
                    <View style={styles.onlineTag}>
                      <Feather name="eye" size={10} color={Colors.success} />
                      <Text style={styles.onlineTagText}>En ligne</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.menuDots} activeOpacity={0.7}>
                  <Feather name="more-vertical" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.primaryLight },
  avatarPlaceholder: { backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.surface,
  },
  headerName: { fontSize: 17, fontWeight: '800', color: Colors.text },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
  },
  rolePillText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: 12, color: Colors.textSecondary },
  addBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row', margin: 16,
    backgroundColor: Colors.surface, borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.borderLight },
  statHighlight: { backgroundColor: Colors.primaryLight + '60' },
  statValue: { fontSize: 22, fontWeight: '900', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  objectifCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#FFF8E1', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#FFE082',
  },
  objectifLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trophyWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#FFE082', alignItems: 'center', justifyContent: 'center',
  },
  objectifTitle: { fontSize: 14, fontWeight: '800', color: '#E65100' },
  objectifSub: { fontSize: 12, color: '#E65100', opacity: 0.7 },
  voirBtn: { backgroundColor: Colors.warning, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  voirText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  actionCards: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  actionCard: {
    flex: 1, borderRadius: 16, padding: 16, gap: 6,
    justifyContent: 'center',
    minHeight: 100,
  },
  bonusCard: { backgroundColor: Colors.primary },
  videoCard: { backgroundColor: '#1A2D4F' },
  actionIcon: { marginBottom: 4 },
  actionTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  actionSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  productsSection: { paddingHorizontal: 16, gap: 10 },
  emptyProducts: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  productRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  productImg: { width: 64, height: 64, borderRadius: 10 },
  productName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  productLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  productLocationText: { fontSize: 12, color: Colors.textSecondary },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  productPrice: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  flashTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.error + '15', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 100,
  },
  flashTagText: { fontSize: 11, fontWeight: '700', color: Colors.error },
  onlineTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.success + '15', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 100,
  },
  onlineTagText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  menuDots: { padding: 4 },
});
