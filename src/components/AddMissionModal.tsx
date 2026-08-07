import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import AnimatedButton from './AnimatedButton';
import * as Haptics from 'expo-haptics';

const STAT_CATEGORIES = [
  { id: 'INT', label: '🧠 INT', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'STR', label: '💪 STR', color: '#EF4444', bg: '#FEF2F2' },
  { id: 'CHA', label: '🗣️ CHA', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'END', label: '⚡ END', color: '#22C55E', bg: '#F0FDF4' },
];

const XP_PRESETS = [25, 50, 100, 150];

interface AddMissionModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, xp: number, statCategory: string) => void;
}

export default function AddMissionModal({ visible, onClose, onAdd }: AddMissionModalProps) {
  const [title, setTitle] = useState('');
  const [xp, setXp] = useState('50');
  const [selectedStat, setSelectedStat] = useState('INT');

  const handleAdd = () => {
    if (!title.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    onAdd(title.trim(), parseInt(xp) || 50, selectedStat);
    
    setTitle('');
    setXp('50');
    setSelectedStat('INT');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContent}>
          {/* Grab Handle */}
          <View style={styles.grabBar} />

          <View style={styles.header}>
            <Text style={styles.title}>New Mission 🎯</Text>
            <AnimatedButton
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
            >
              <Ionicons name="close-circle" size={30} color={COLORS.textPrimary} />
            </AnimatedButton>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollInside}
          >
            {/* Mission Title Input */}
            <Text style={styles.sectionHeaderLabel}>MISSION TITLE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Code for 30 minutes"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* XP Reward Row */}
            <View style={styles.xpHeaderRow}>
              <Text style={styles.sectionHeaderLabel}>XP REWARD</Text>
              <View style={styles.xpInputWrapper}>
                <Text style={styles.xpInputPrefix}>⚡</Text>
                <TextInput
                  style={styles.xpInput}
                  keyboardType="number-pad"
                  value={xp}
                  onChangeText={setXp}
                />
                <Text style={styles.xpInputSuffix}>XP</Text>
              </View>
            </View>

            {/* XP Quick Preset Buttons - BULLETPROOF GRID */}
            <Text style={styles.subLabel}>Quick Select XP:</Text>
            <View style={styles.gridContainer}>
              {XP_PRESETS.map((val) => {
                const isActive = parseInt(xp) === val;
                return (
                  <View key={val} style={styles.gridWrapper}>
                    <AnimatedButton
                      style={[
                        styles.presetPill,
                        isActive && styles.presetPillActive,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setXp(val.toString());
                      }}
                      scaleTo={0.92}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          isActive && styles.presetTextActive,
                        ]}
                      >
                        +{val} XP
                      </Text>
                    </AnimatedButton>
                  </View>
                );
              })}
            </View>

            {/* Stat Category Selector - BULLETPROOF GRID */}
            <Text style={styles.sectionHeaderLabel}>STAT CATEGORY</Text>
            <View style={styles.gridContainer}>
              {STAT_CATEGORIES.map((stat) => {
                const isActive = selectedStat === stat.id;
                return (
                  <View key={stat.id} style={styles.gridWrapper}>
                    <AnimatedButton
                      style={[
                        styles.statCard,
                        { backgroundColor: stat.bg, borderColor: stat.color },
                        isActive && [styles.statCardActive, { backgroundColor: stat.color }],
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedStat(stat.id);
                      }}
                      scaleTo={0.94}
                    >
                      <Text
                        style={[
                          styles.statCardText,
                          { color: stat.color },
                          isActive && styles.statCardTextActive,
                        ]}
                      >
                        {stat.label}
                      </Text>
                    </AnimatedButton>
                  </View>
                );
              })}
            </View>

            <AnimatedButton style={styles.addButton} onPress={handleAdd}>
              <Text style={styles.addButtonText}>Create Mission ✨</Text>
            </AnimatedButton>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 32,
    maxHeight: '85%',
    ...SHADOWS.modal,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  grabBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.borderDark,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  scrollInside: {
    paddingBottom: 20,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 6,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.md,
    padding: 16,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginBottom: 18,
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9E7',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#F5C542',
  },
  xpInputPrefix: {
    fontSize: 16,
    marginRight: 6,
  },
  xpInput: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    width: 50,
    textAlign: 'center',
  },
  xpInputSuffix: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  
  // NEW LAYOUT STYLES FOR PERFECT 2x2 GRID
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  gridWrapper: {
    width: '48%', // The View forces the 48% width safely!
    marginBottom: 12,
  },
  
  presetPill: {
    width: '100%', // Fills the gridWrapper
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPillActive: {
    backgroundColor: '#F5C542',
    borderColor: '#111111',
    ...SHADOWS.small,
  },
  presetText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  presetTextActive: {
    color: '#111111',
    fontWeight: '900',
  },
  statCard: {
    width: '100%', // Fills the gridWrapper
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardActive: {
    borderColor: '#111111',
    ...SHADOWS.small,
  },
  statCardText: {
    fontSize: 15,
    fontWeight: '900',
  },
  statCardTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    width: '100%', // Just to be extra safe here too!
    ...SHADOWS.button,
  },
  addButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '900',
  },
});