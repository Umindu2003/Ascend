import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';
import * as Haptics from 'expo-haptics';

export type TabName = 'Home' | 'Shop' | 'Profile';

interface BottomTabNavigatorProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const TABS: { name: TabName; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'Shop', icon: 'cart-outline', activeIcon: 'cart' },
  { name: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function BottomTabNavigator({ activeTab, onTabPress }: BottomTabNavigatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <AnimatedButton
              key={tab.name}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => {
                Haptics.selectionAsync();
                onTabPress(tab.name);
              }}
              scaleTo={0.9}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={isActive ? COLORS.primary : COLORS.textMuted}
              />
              {isActive && <View style={styles.activeDot} />}
            </AnimatedButton>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingVertical: 10,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: COLORS.background,
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
