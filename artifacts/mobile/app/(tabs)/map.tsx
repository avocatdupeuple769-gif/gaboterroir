import { Platform } from 'react-native';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import MapViewNative from '@/components/MapViewNative';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : insets.top;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Text style={styles.title}>Carte des produits</Text>
        <View style={styles.badge}>
          <Feather name="map-pin" size={14} color={Colors.primary} />
          <Text style={styles.badgeText}>Gabon</Text>
        </View>
      </View>
      <MapViewNative />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 4,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
});
