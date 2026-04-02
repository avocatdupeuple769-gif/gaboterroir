import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '@/constants/colors';
import { CATEGORIES } from '@/constants/categories';
import { ProductCategory } from '@/types';

interface CategoryFilterProps {
  selected: ProductCategory | null;
  onSelect: (cat: ProductCategory | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => onSelect(null)}
        style={[styles.chip, !selected && styles.chipActive]}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, !selected && styles.chipTextActive]}>Tout</Text>
      </TouchableOpacity>
      {CATEGORIES.map(cat => {
        const isActive = selected === cat.label;
        return (
          <TouchableOpacity
            key={cat.label}
            onPress={() => onSelect(cat.label)}
            style={[styles.chip, isActive && styles.chipActive]}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{cat.emoji}</Text>
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
});
