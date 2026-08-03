import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.levelText}>LEVEL 1 ⚡</Text>
        <Text style={styles.xpText}>XP: 0 / 1000</Text>
      </View>
      
      <View style={styles.missionBoard}>
        <Text style={styles.title}>Today's Missions 🎯</Text>
        {/* We will add your glass-morphism checkboxes here next! */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Super clean light mode background
  },
  header: {
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  levelText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111',
    letterSpacing: 1.5,
  },
  xpText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontWeight: '600',
  },
  missionBoard: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  }
});