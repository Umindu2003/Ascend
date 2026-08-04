import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// 1. 📝 Define the props
interface MissionCardProps {
  title: string;
  xp: number;
  isCompleted: boolean;
  onComplete: () => void;
  onDelete: () => void; // 👈 new delete prop
}

// 2. 🔗 Attach them to the component
export default function MissionCard({
  title,
  xp,
  isCompleted,
  onComplete,
  onDelete,
}: MissionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isCompleted && styles.cardCompleted]}
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onComplete();
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onDelete();
      }}
    >
      <View style={styles.leftContent}>
        <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
          {isCompleted && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </View>
        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
          {title}
        </Text>
      </View>

      <View style={styles.xpBadge}>
        <Text style={styles.xpText}>+{xp} XP</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#EBEBEB',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  checkboxCompleted: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#A0A0A0',
  },
  xpBadge: {
    backgroundColor: '#F0F8FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  xpText: {
    color: '#007AFF',
    fontWeight: '800',
    fontSize: 14,
  },
});