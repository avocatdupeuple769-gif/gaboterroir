import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export function StarRating({ rating, size = 14, showValue = true }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather
          key={i}
          name="star"
          size={size}
          color={i <= Math.round(rating) ? Colors.star : Colors.border}
        />
      ))}
      {showValue && (
        <Text style={[styles.value, { fontSize: size - 1 }]}>{rating.toFixed(1)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  value: { color: Colors.textSecondary, marginLeft: 4, fontWeight: '600' },
});
