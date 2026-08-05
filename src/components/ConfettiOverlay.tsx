import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLE_COLORS = ['#F5C542', '#22C55E', '#8B5CF6', '#EF4444', '#3B82F6', '#EC4899'];
const PARTICLE_COUNT = 30;

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  animY: Animated.Value;
  animX: Animated.Value;
  animRotate: Animated.Value;
  animOpacity: Animated.Value;
}

interface ConfettiOverlayProps {
  visible: boolean;
  onComplete?: () => void;
}

export default function ConfettiOverlay({ visible, onComplete }: ConfettiOverlayProps) {
  const particles = useRef<Particle[]>([]);

  if (particles.current.length === 0) {
    particles.current = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: Math.random() * 8 + 6,
      animY: new Animated.Value(-20),
      animX: new Animated.Value(0),
      animRotate: new Animated.Value(0),
      animOpacity: new Animated.Value(1),
    }));
  }

  useEffect(() => {
    if (!visible) return;

    const animations = particles.current.map((p) => {
      p.animY.setValue(-20);
      p.animX.setValue(0);
      p.animRotate.setValue(0);
      p.animOpacity.setValue(1);

      const targetY = SCREEN_HEIGHT * 0.7 + Math.random() * (SCREEN_HEIGHT * 0.3);
      const driftX = (Math.random() - 0.5) * 150;
      const duration = 1800 + Math.random() * 1000;

      return Animated.parallel([
        Animated.timing(p.animY, {
          toValue: targetY,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(p.animX, {
          toValue: driftX,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(p.animRotate, {
          toValue: Math.random() * 10 - 5,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(p.animOpacity, {
          toValue: 0,
          duration,
          delay: duration * 0.6,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      if (onComplete) onComplete();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((p) => {
        const spin = p.animRotate.interpolate({
          inputRange: [-5, 5],
          outputRange: ['-360deg', '360deg'],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                left: p.x,
                width: p.size,
                height: p.size * 1.5,
                backgroundColor: p.color,
                opacity: p.animOpacity,
                transform: [
                  { translateY: p.animY },
                  { translateX: p.animX },
                  { rotate: spin },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});
