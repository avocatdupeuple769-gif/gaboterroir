import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

interface Props {
  size?: number;
}

export default function GaboTerroirLogo({ size = 140 }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const heartbeat = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(scale, { toValue: 0.97, duration: 110, easing: Easing.in(Easing.quad),  useNativeDriver: false }),
        Animated.timing(scale, { toValue: 1.09, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(scale, { toValue: 1.00, duration: 150, easing: Easing.in(Easing.quad),  useNativeDriver: false }),
        Animated.delay(1100),
      ])
    );
    heartbeat.start();
    return () => heartbeat.stop();
  }, []);

  return (
    <Animated.View style={[styles.wrapper, { width: size, height: size, borderRadius: size * 0.26 }, { transform: [{ scale }] }]}>
      <Image
        source={require('@/assets/images/logo-farmers-dark.png')}
        style={{ width: size, height: size, borderRadius: size * 0.26 }}
        contentFit="cover"
        contentPosition="top"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
});
