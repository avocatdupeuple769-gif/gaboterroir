import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";

function TabIcon({ name, color, badge }: { name: keyof typeof Feather.glyphMap; color: string; badge?: number }) {
  return (
    <View style={tabStyles.wrapper}>
      <Feather name={name} size={22} color={color} />
      {badge && badge > 0 ? (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const TAB_BAR_STYLE = {
  backgroundColor: Colors.surface,
  borderTopColor: Colors.border,
  borderTopWidth: 1,
  height: Platform.OS === "web" ? 64 : 74,
  paddingBottom: Platform.OS === "web" ? 8 : 14,
  paddingTop: 8,
  elevation: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
};

export default function TabLayout() {
  const { user } = useAuth();
  const { cart } = useApp();
  const role = user?.role ?? 'acheteur';

  const isProducteur = role === 'producteur';
  const isTransporteur = role === 'transporteur';
  const isAcheteur = role === 'acheteur';

  const cartCount = cart.length;

  const transactionsLabel = isProducteur ? 'Ventes' : isTransporteur ? 'Gains' : 'Commandes';
  const transactionsIcon: keyof typeof Feather.glyphMap = isProducteur ? 'trending-up' : isTransporteur ? 'dollar-sign' : 'package';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
      }}
    >
      {/* Accueil / Boutique — Producteur + Acheteur only */}
      <Tabs.Screen
        name="index"
        options={{
          title: isProducteur ? 'Accueil' : 'Boutique',
          href: isTransporteur ? null : undefined,
          tabBarIcon: ({ color }) =>
            <TabIcon name={isProducteur ? 'feather' : 'shopping-bag'} color={color} />,
        }}
      />

      {/* Mes Stocks — Producteur only */}
      <Tabs.Screen
        name="seller"
        options={{
          title: 'Mes Stocks',
          href: isProducteur ? undefined : null,
          tabBarIcon: ({ color }) => <TabIcon name="layers" color={color} />,
        }}
      />

      {/* Missions — Transporteur only */}
      <Tabs.Screen
        name="transport"
        options={{
          title: 'Missions',
          href: isTransporteur ? undefined : null,
          tabBarIcon: ({ color }) => <TabIcon name="truck" color={color} />,
        }}
      />

      {/* Carte — Transporteur only */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Carte',
          href: isTransporteur ? undefined : null,
          tabBarIcon: ({ color }) => <TabIcon name="map" color={color} />,
        }}
      />

      {/* Panier — Acheteur only */}
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Panier',
          href: isAcheteur ? undefined : null,
          tabBarIcon: ({ color }) => <TabIcon name="shopping-cart" color={color} badge={cartCount} />,
        }}
      />

      {/* Transactions — All roles, different label */}
      <Tabs.Screen
        name="transactions"
        options={{
          title: transactionsLabel,
          tabBarIcon: ({ color }) => <TabIcon name={transactionsIcon} color={color} />,
        }}
      />

      {/* Profil — All roles */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="categories" options={{ href: null }} />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -5, right: -8,
    backgroundColor: Colors.error, borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
