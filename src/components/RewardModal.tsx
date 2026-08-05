import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import AnimatedButton from './AnimatedButton';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RewardModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  xpReward?: number;
  coinsReward?: number;
  gemsReward?: number;
  badgeTitle?: string;
  badgeIcon?: string;
  onClose: () => void;
}

export default function RewardModal({
  visible,
  title,
  subtitle,
  xpReward,
  coinsReward,
  gemsReward,
  badgeTitle,
  badgeIcon,
  onClose,
}: RewardModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 6,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <Animated.View
          style={[
            styles.cardContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Top Grab Handle */}
          <View style={styles.grabBar} />

          {/* Header Icon or Emoji */}
          <Text style={styles.headerEmoji}>{badgeIcon || '🎉'}</Text>
          
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {/* Badge Name if Achievement */}
          {badgeTitle ? (
            <View style={styles.badgeBanner}>
              <Text style={styles.badgeBannerText}>{badgeTitle}</Text>
            </View>
          ) : null}

          {/* Reward Badges Grid */}
          <View style={styles.rewardsRow}>
            {xpReward && xpReward > 0 ? (
              <View style={[styles.rewardPill, styles.xpPill]}>
                <Text style={styles.rewardText}>⚡ +{xpReward} XP</Text>
              </View>
            ) : null}

            {coinsReward && coinsReward > 0 ? (
              <View style={[styles.rewardPill, styles.coinPill]}>
                <Text style={styles.rewardText}>🪙 +{coinsReward} Coins</Text>
              </View>
            ) : null}

            {gemsReward && gemsReward > 0 ? (
              <View style={[styles.rewardPill, styles.gemPill]}>
                <Text style={styles.rewardText}>💎 +{gemsReward} Gems</Text>
              </View>
            ) : null}
          </View>

          {/* Action Button */}
          <AnimatedButton style={styles.claimButton} onPress={onClose}>
            <Text style={styles.claimButtonText}>Claim Rewards ✨</Text>
          </AnimatedButton>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
    ...SHADOWS.modal,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  grabBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginBottom: 20,
  },
  headerEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 20,
    lineHeight: 22,
  },
  badgeBanner: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  badgeBannerText: {
    color: COLORS.achievement,
    fontWeight: '900',
    fontSize: 16,
  },
  rewardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  rewardPill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpPill: {
    backgroundColor: COLORS.xpBackground,
    borderWidth: 1,
    borderColor: 'rgba(245, 197, 66, 0.4)',
  },
  coinPill: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  gemPill: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  rewardText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  claimButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: RADIUS.md,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.button,
  },
  claimButtonText: {
    color: COLORS.textLight,
    fontWeight: '800',
    fontSize: 16,
  },
});
