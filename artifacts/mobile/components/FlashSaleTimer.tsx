import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

interface FlashSaleTimerProps {
  expiresAt: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function FlashSaleTimer({ expiresAt }: FlashSaleTimerProps) {
  const getRemaining = () => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s };
  };

  const [remaining, setRemaining] = useState(getRemaining());

  useEffect(() => {
    const interval = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!remaining) return null;

  return (
    <View style={styles.container}>
      <Feather name="zap" size={12} color="#fff" />
      <Text style={styles.label}>Flash Sale · </Text>
      <Text style={styles.time}>
        {pad(remaining.h)}:{pad(remaining.m)}:{pad(remaining.s)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  label: { color: '#fff', fontSize: 12, fontWeight: '600' },
  time: { color: '#fff', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
