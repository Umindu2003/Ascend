import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import AnimatedButton from './AnimatedButton';
import FloatingXP from './FloatingXP';

interface MissionCardProps {
  title: string;
  xp: number;
  statCategory?: string;
  isCompleted: boolean;
  onComplete: () => void;
  onDelete: () => void;
}

export default function MissionCard({
  title,
  xp,
  statCategory = 'INT',
  isCompleted,
  onComplete,
  onDelete,
}: MissionCardProps) {
  const [showFloatingXP, setShowFloatingXP] = useState(false);

  const handlePressComplete = () => {
    if (!isCompleted) {
      setShowFloatingXP(true);
    }
    onComplete();
  };

  const getStatBadgeColor = (category: string) => {
    switch (category) {
      case 'INT': return '#3B82F6'; // Blue
      case 'STR': return '#EF4444'; // Red
      case 'CHA': return '#F59E0B'; // Amber
      case 'END': return '#22C55E'; // Green
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.cardWrapper}>
      {showFloatingXP && (
        <FloatingXP
          xp={xp}
          onAnimationComplete={() => setShowFloatingXP(false)}
        />
      )}

      <AnimatedButton
        style={[styles.card, isCompleted && styles.cardCompleted]}
        onPress={handlePressComplete}
        onLongPress={onDelete}
        scaleTo={0.97}
      >
        <View style={styles.leftSection}>
          {/* Custom Checkbox Circle */}
          <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
            {isCompleted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
              {title}
            </Text>
            
            <View style={styles.badgeRow}>
              {/* Stat Badge */}
              <View style={[styles.statBadge, { backgroundColor: `${getStatBadgeColor(statCategory)}15` }]}>
                <Text style={[styles.statBadgeText, { color: getStatBadgeColor(statCategory) }]}>
                  {statCategory}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gold XP Badge */}
        <View style={[styles.xpBadge, isCompleted && styles.xpBadgeCompleted]}>
          <Text style={[styles.xpText, isCompleted && styles.xpTextCompleted]}>
            +{xp} XP
          </Text>
        </View>
      </AnimatedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardCompleted: {
    backgroundColor: '#FAFBF9',
    borderColor: '#E5E7EB',
    shadowOpacity: 0.01,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#FAFAFA',
  },
  checkboxCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  xpBadge: {
    backgroundColor: COLORS.xpBackground,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 197, 66, 0.4)',
  },
  xpBadgeCompleted: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  xpText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 13,
  },
  xpTextCompleted: {
    color: COLORS.textMuted,
  },
});