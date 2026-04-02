import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Category } from "@/context/AppContext";

interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "md" }: CategoryBadgeProps) {
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${category.color}15` },
        isSmall && styles.badgeSm,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: category.color },
          isSmall && styles.dotSm,
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: category.color },
          isSmall && styles.textSm,
        ]}
      >
        {category.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSm: {
    width: 5,
    height: 5,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
  textSm: {
    fontSize: 11,
  },
});
