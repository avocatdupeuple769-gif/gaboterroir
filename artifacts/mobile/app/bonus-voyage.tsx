import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { VOYAGE_DESTINATIONS, PREVIOUS_WINNERS } from '@/mocks/bonus';
import { CURRENT_USER_STATS } from '@/mocks/leaderboard';

export default function BonusVoyageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const [activeTab, setActiveTab] = useState<'destinations' | 'winners'>('destinations');
  const stats = CURRENT_USER_STATS;
  const progressPercent = Math.min(100, Math.round((stats.ventesValidees / stats.objectifTop5) * 100));

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 6 })}>
          <Feather name="arrow-left" size={20} color={Colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🎁 Bonus Voyage</Text>
          <Text style={styles.subtitle}>Programme récompense producteurs</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroEmoji}>✈️</Text>
          <Text style={styles.heroTitle}>Gagnez un voyage gratuit !</Text>
          <Text style={styles.heroSubtitle}>
            Les 3 meilleurs producteurs de l'année remportent un voyage tout inclus
          </Text>
          <View style={styles.rewardBadges}>
            {['1er: Voyage ✈️', '2ème: Voyage ✈️', '3ème: Voyage ✈️'].map((r, i) => (
              <View key={i} style={styles.rewardBadge}>
                <Text style={styles.rewardBadgeText}>{r}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* My progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Feather name="bar-chart-2" size={16} color={Colors.primary} />
            <Text style={styles.progressTitle}>Votre progression</Text>
            <Text style={styles.progressRank}>Rang #{stats.rank}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{stats.ventesValidees}</Text>
              <Text style={styles.progressStatLabel}>Ventes validées</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{stats.ventesRestantes}</Text>
              <Text style={styles.progressStatLabel}>Restantes pour Top 5</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{stats.maxLitiges - stats.litiges}</Text>
              <Text style={styles.progressStatLabel}>Litiges restants</Text>
            </View>
          </View>
          <Text style={styles.progressNote}>
            ⚠️ Max {stats.maxLitiges} litige(s) toléré(s) · Période: Jan–Déc 2026
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('destinations')}
            style={[styles.tab, activeTab === 'destinations' && styles.tabActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'destinations' && styles.tabTextActive]}>Destinations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('winners')}
            style={[styles.tab, activeTab === 'winners' && styles.tabActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'winners' && styles.tabTextActive]}>Lauréats 2025</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'destinations' ? (
          <View style={{ gap: 14 }}>
            {VOYAGE_DESTINATIONS.map(dest => (
              <View key={dest.id} style={styles.destCard}>
                <Image source={{ uri: dest.image }} style={styles.destImage} contentFit="cover" />
                <View style={styles.destBody}>
                  <View style={styles.destTitleRow}>
                    <Text style={styles.destName}>{dest.name}</Text>
                    <View style={styles.destCountry}>
                      <Feather name="globe" size={12} color={Colors.blue} />
                      <Text style={styles.destCountryText}>{dest.country}</Text>
                    </View>
                  </View>
                  <Text style={styles.destDesc}>{dest.description}</Text>
                  <Text style={styles.destIncludesTitle}>Ce qui est inclus :</Text>
                  {dest.included.map(inc => (
                    <View key={inc} style={styles.includedItem}>
                      <Feather name="check" size={13} color={Colors.success} />
                      <Text style={styles.includedText}>{inc}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={styles.winnersTitle}>🏆 Lauréats Marrakech 2025</Text>
            {PREVIOUS_WINNERS.map(w => (
              <View key={w.id} style={styles.winnerCard}>
                <View style={styles.winnerRankBadge}>
                  <Text style={styles.winnerRankText}>#{w.rank}</Text>
                </View>
                <Image source={{ uri: w.photo }} style={styles.winnerAvatar} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.winnerName}>{w.prenom}</Text>
                  <Text style={styles.winnerProvince}>{w.province}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.winnerSales}>{w.ventesValidees} ventes</Text>
                  <Text style={styles.winnerDest}>{w.destination}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 4,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSecondary },
  content: { padding: 16, gap: 16 },
  heroBanner: {
    backgroundColor: Colors.primary, borderRadius: 20,
    padding: 20, alignItems: 'center', gap: 8,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },
  rewardBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  rewardBadge: { backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  rewardBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  progressCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: Colors.text },
  progressRank: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  progressBarBg: { backgroundColor: Colors.border, borderRadius: 8, height: 10 },
  progressBarFill: { backgroundColor: Colors.primary, borderRadius: 8, height: 10 },
  progressStats: { flexDirection: 'row', alignItems: 'center' },
  progressStat: { flex: 1, alignItems: 'center', gap: 2 },
  progressStatValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  progressStatLabel: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },
  progressStatDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  progressNote: { fontSize: 12, color: Colors.warning, fontWeight: '500' },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: 12, padding: 4, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  destCard: {
    backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  destImage: { width: '100%', height: 160 },
  destBody: { padding: 14, gap: 6 },
  destTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  destName: { fontSize: 18, fontWeight: '800', color: Colors.text },
  destCountry: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.blueSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  destCountryText: { fontSize: 12, fontWeight: '600', color: Colors.blue },
  destDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  destIncludesTitle: { fontSize: 12, fontWeight: '700', color: Colors.text, marginTop: 4 },
  includedItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  includedText: { fontSize: 13, color: Colors.text },
  winnersTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  winnerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  winnerRankBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  winnerRankText: { fontSize: 13, fontWeight: '800', color: Colors.primaryDark },
  winnerAvatar: { width: 46, height: 46, borderRadius: 23 },
  winnerName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  winnerProvince: { fontSize: 12, color: Colors.textSecondary },
  winnerSales: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  winnerDest: { fontSize: 11, color: Colors.textSecondary },
});
