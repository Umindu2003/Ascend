import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const STAT_CATEGORIES = [
  { id: 'INT', label: '🧠 INT' },
  { id: 'STR', label: '💪 STR' },
  { id: 'CHA', label: '🗣️ CHA' },
  { id: 'END', label: '⚡ END' },
];

export default function AddMissionModal({ visible, onClose, onAdd }: any) {
  const [title, setTitle] = useState('');
  const [xp, setXp] = useState('50');
  const [selectedStat, setSelectedStat] = useState('INT');

  const handleAdd = () => {
    if (!title.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // We now pass the selectedStat back to HomeScreen!
    onAdd(title, parseInt(xp) || 50, selectedStat);
    
    setTitle('');
    setXp('50');
    setSelectedStat('INT');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>New Mission 🎯</Text>
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
            >
              <Ionicons name="close-circle" size={28} color="#EBEBEB" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="What's the mission?"
            placeholderTextColor="#A0A0A0"
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

          {/* 🧬 THE SKILL TREE SELECTOR */}
          <Text style={styles.label}>Stat Category:</Text>
          <View style={styles.statContainer}>
            {STAT_CATEGORIES.map((stat) => (
              <TouchableOpacity
                key={stat.id}
                style={[
                  styles.statButton,
                  selectedStat === stat.id && styles.statButtonActive
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedStat(stat.id);
                }}
              >
                <Text 
                  style={[
                    styles.statText,
                    selectedStat === stat.id && styles.statTextActive
                  ]}
                >
                  {stat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add Mission</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
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
    color: '#111',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  xpInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
    width: 80,
    textAlign: 'center',
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statButtonActive: {
    backgroundColor: '#FFF',
    borderColor: '#111',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  statTextActive: {
    color: '#111',
    fontWeight: '800',
  },
  addButton: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});