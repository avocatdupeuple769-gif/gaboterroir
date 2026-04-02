import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";

export type Filter = "all" | "todo" | "in_progress" | "done";

interface FilterBarProps {
  selected: Filter;
  onSelect: (filter: Filter) => void;
  counts: Record<Filter, number>;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

export function FilterBar({ selected, onSelect, counts }: FilterBarProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((f) => {
        const isSelected = selected === f.key;
        return (
          <TouchableOpacity
            key={f.key}
            onPress={() => onSelect(f.key)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.tint : colors.inputBackground,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                { color: isSelected ? "#fff" : colors.textSecondary },
              ]}
            >
              {f.label}
            </Text>
            <Text
              style={[
                styles.count,
                {
                  color: isSelected ? "rgba(255,255,255,0.7)" : colors.textTertiary,
                },
              ]}
            >
              {counts[f.key]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  count: {
    fontSize: 12,
    fontWeight: "500",
  },
});
