import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp, type Task } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

const PRIORITY_COLORS = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#EF4444",
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function TaskCard({ task, onPress }: TaskCardProps) {
  const { colors } = useTheme();
  const { updateTask, categories } = useApp();

  const category = categories.find((c) => c.id === task.categoryId);
  const priorityColor = PRIORITY_COLORS[task.priority];
  const isDone = task.status === "done";

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateTask(task.id, {
      status: isDone ? "todo" : "done",
    });
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && !isDone;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.left}>
        <TouchableOpacity
          onPress={handleToggle}
          style={[
            styles.checkbox,
            {
              borderColor: isDone ? colors.tint : colors.cardBorder,
              backgroundColor: isDone ? colors.tint : "transparent",
            },
          ]}
          activeOpacity={0.7}
        >
          {isDone && <Feather name="check" size={12} color="#fff" />}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              isDone && { textDecorationLine: "line-through", color: colors.textTertiary },
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <View
            style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}
          >
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {PRIORITY_LABELS[task.priority]}
            </Text>
          </View>
        </View>

        {task.description ? (
          <Text
            style={[styles.description, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {task.description}
          </Text>
        ) : null}

        <View style={styles.footer}>
          {category && (
            <View
              style={[styles.categoryChip, { backgroundColor: `${category.color}15` }]}
            >
              <View
                style={[styles.categoryDot, { backgroundColor: category.color }]}
              />
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.name}
              </Text>
            </View>
          )}

          {dueDate && (
            <Text
              style={[
                styles.dueDate,
                { color: isOverdue ? colors.error : colors.textTertiary },
              ]}
            >
              {isOverdue ? "Overdue · " : ""}
              {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  left: {
    marginRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "500",
  },
  dueDate: {
    fontSize: 11,
    fontWeight: "500",
  },
});
