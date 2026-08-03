import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AddMissionModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, xp: number) => void;
}

export default function AddMissionModal({ visible, onClose, onAdd }: AddMissionModalProps) {
  const [title, setTitle] = useState('');
  const [xp, setXp] = useState(20); // Default XP

  const handleAdd = () => {
    if (title.trim() === '') return;
    
    // A heavier buzz for creating something new! 💥
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    onAdd(title, xp);
    setTitle(''); 
    setXp(20);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Mission 🎯</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#A0A0A0" />
            </TouchableOpacity>
          </View>

          {/* Input Field */}
          <TextInput
            style={styles.input}
            placeholder="What's your quest?"
            placeholderTextColor="#A0A0A0"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          {/* XP Selector */}
          <Text style={styles.subtitle}>Difficulty / XP Reward</Text>
          <View style={styles.xpRow}>
            {[10, 20, 50].map((val) => (
              <TouchableOpacity 
                key={val} 
                style={[styles.xpPill, xp === val && styles.xpPillActive]}
                onPress={() => setXp(val)}
              >
                <Text style={[styles.xpText, xp === val && styles.xpTextActive]}>
                  +{val} XP
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add Button */}
          <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.8}>
            <Text style={styles.addButtonText}>Add Mission</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay for focus
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    marginBottom: 12,
  },
  xpRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  xpPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  xpPillActive: {
    backgroundColor: '#F0F8FF',
    borderColor: '#007AFF',
  },
  xpText: {
    color: '#888',
    fontWeight: '700',
  },
  xpTextActive: {
    color: '#007AFF',
  },
  addButton: {
    backgroundColor: '#111', // Gen Z high-contrast black
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});