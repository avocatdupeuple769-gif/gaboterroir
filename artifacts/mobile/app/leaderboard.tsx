import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { MOCK_LEADERBOARD, CURRENT_USER_STATS } from '@/mocks/leaderboard';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const top3 = MOCK_LEADERBOARD.slice(0, 3);
  const rest = MOCK_LEADERBOARD.slice(3);
  const stats = CURRENT_USER_STATS;
  const progressPercent = Math.min(100, Math.round((stats.ventesValidees / stats.objectifTop5) * 100));

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}>
          <Feather name="arrow-left" size={20} color={Colors.primary} />
        </Pressable>
        <View>
          <Text style={styles.title}>Classement</Text>
          <Text style={styles.subtitle}>Producteurs du mois</Text>
        </View>
        <Pressable onPress={() => router.push('/bonus-voyage')} style={({ pressed }) => [styles.voyageBtn, { opacity: pressed ? 0.8 : 1 }]}>
          <Text style={styles.voyageBtnText}>🎁 Bonus</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* My progress */}
        <View style={styles.myProgress}>
          <View style={styles.myProgressHeader}>
            <Feather name="trending-up" size={16} color={Colors.primary} />
            <Text style={styles.myProgressTitle}>Ma progression · Rang #{stats.rank}</Text>
          </View>
          <View style={styles.progressBarWrapper}>
            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.myProgressFooter}>
            <Text style={styles.myProgressLabel}>{stats.ventesValidees} ventes</Text>
            <Text style={styles.myProgressLabel}>Objectif Top 5: {stats.objectifTop5}</Text>
          </View>
          <Text style={styles.myProgressSub}>
            Plus que {stats.ventesRestantes} ventes pour entrer dans le Top 5 🚀
          </Text>
        </View>

        {/* Podium */}
        <View style={styles.podiumSection}>
          <Text style={styles.sectionTitle}>🏆 Podium</Text>
          <View style={styles.podium}>
            {/* 2nd */}
            <View style={[styles.podiumSlot, { marginTop: 30 }]}>
              <Image source={{ uri: top3[1].photo }} style={styles.podiumAvatar} contentFit="cover" />
              <View style={[styles.medal, { backgroundColor: MEDAL_COLORS[1] }]}>
                <Text style={styles.medalText}>2</Text>
              </View>
              <Text style={styles.podiumName}>{top3[1].prenom}</Text>
              <Text style={styles.podiumProvince}>{top3[1].province}</Text>
              <Text style={styles.podiumSales}>{top3[1].ventesValidees} ventes</Text>
            </View>
            {/* 1st */}
            <View style={[styles.podiumSlot, { marginBottom: 10 }]}>
              <View style={styles.crownWrapper}><Text style={styles.crown}>👑</Text></View>
              <Image source={{ uri: top3[0].photo }} style={[styles.podiumAvatar, { width: 74, height: 74, borderRadius: 37 }]} contentFit="cover" />
              <View style={[styles.medal, { backgroundColor: MEDAL_COLORS[0] }]}>
                <Text style={styles.medalText}>1</Text>
              </View>
              <Text style={styles.podiumName}>{top3[0].prenom}</Text>
              <Text style={styles.podiumProvince}>{top3[0].province}</Text>
              <Text style={styles.podiumSales}>{top3[0].ventesValidees} ventes</Text>
            </View>
            {/* 3rd */}
            <View style={[styles.podiumSlot, { marginTop: 50 }]}>
              <Image source={{ uri: top3[2].photo }} style={styles.podiumAvatar} contentFit="cover" />
              <View style={[styles.medal, { backgroundColor: MEDAL_COLORS[2] }]}>
                <Text style={styles.medalText}>3</Text>
              </View>
              <Text style={styles.podiumName}>{top3[2].prenom}</Text>
              <Text style={styles.podiumProvince}>{top3[2].province}</Text>
              <Text style={styles.podiumSales}>{top3[2].ventesValidees} ventes</Text>
            </View>
          </View>
        </View>

        {/* Rest of leaderboard */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Classement complet</Text>
          {rest.map(entry => (
            <View key={entry.id} style={[styles.row, entry.disqualified && { opacity: 0.4 }]}>
              <Text style={styles.rowRank}>#{entry.rank}</Text>
              <Image source={{ uri: entry.photo }} style={styles.rowAvatar} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{entry.prenom}</Text>
                <Text style={styles.rowProvince}>{entry.province}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={styles.rowSales}>{entry.ventesValidees} ventes</Text>
                <View style={styles.noteRow}>
                  <Feather name="star" size={11} color={Colors.star} />
                  <Text style={styles.rowNote}>{entry.note.toFixed(1)}</Text>
                </View>
              </View>
            </View>
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
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 4,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSecondary },
  voyageBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20,
  },
  voyageBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  content: { padding: 16, gap: 16 },
  myProgress: {
    backgroundColor: Colors.primary, borderRadius: 16,
    padding: 16, gap: 8,
  },
  myProgressHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  myProgressTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  progressBarWrapper: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8, height: 8 },
  progressBar: { backgroundColor: Colors.accent, borderRadius: 8, height: 8 },
  myProgressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  myProgressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  myProgressSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  podiumSection: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8 },
  podiumSlot: { alignItems: 'center', flex: 1, gap: 4 },
  crownWrapper: { marginBottom: -6 },
  crown: { fontSize: 24 },
  podiumAvatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: Colors.surface },
  medal: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -12,
  },
  medalText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  podiumName: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  podiumProvince: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },
  podiumSales: { fontSize: 11, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
  listSection: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  rowRank: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, width: 28, textAlign: 'center' },
  rowAvatar: { width: 40, height: 40, borderRadius: 20 },
  rowName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  rowProvince: { fontSize: 12, color: Colors.textSecondary },
  rowSales: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rowNote: { fontSize: 12, color: Colors.textSecondary },
});
