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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import AnimatedButton from './AnimatedButton';
import * as Haptics from 'expo-haptics';

const STAT_CATEGORIES = [
  { id: 'INT', label: '🧠 INT' },
  { id: 'STR', label: '💪 STR' },
  { id: 'CHA', label: '🗣️ CHA' },
  { id: 'END', label: '⚡ END' },
];

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
              <Ionicons name="close-circle" size={28} color={COLORS.textMuted} />
            </AnimatedButton>
          </View>

          <Text style={styles.label}>Mission Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Code for 30 minutes"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <View style={styles.row}>
            <Text style={styles.label}>XP Reward:</Text>
            <TextInput
              style={styles.xpInput}
              keyboardType="number-pad"
              value={xp}
              onChangeText={setXp}
            />
          </View>

          {/* Stat Category Selector */}
          <Text style={styles.label}>Stat Category:</Text>
          <View style={styles.statContainer}>
            {STAT_CATEGORIES.map((stat) => {
              const isActive = selectedStat === stat.id;
              return (
                <AnimatedButton
                  key={stat.id}
                  style={[
                    styles.statButton,
                    isActive && styles.statButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedStat(stat.id);
                  }}
                  scaleTo={0.94}
                >
                  <Text
                    style={[
                      styles.statText,
                      isActive && styles.statTextActive,
                    ]}
                  >
                    {stat.label}
                  </Text>
                </AnimatedButton>
              );
            })}
          </View>

          <AnimatedButton style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Create Mission ✨</Text>
          </AnimatedButton>
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
    paddingTop: 16,
    paddingBottom: 40,
    ...SHADOWS.modal,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  grabBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  xpInput: {
    backgroundColor: COLORS.xpBackground,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(245, 197, 66, 0.4)',
    textAlign: 'center',
    minWidth: 80,
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  statButtonActive: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statTextActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: 18,
    alignItems: 'center',
    ...SHADOWS.button,
  },
  addButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
});