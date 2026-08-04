import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  
  // 🧬 State to hold our new Skill Tree data
  const [stats, setStats] = useState({
    int: 0,
    str: 0,
    cha: 0,
    end: 0,
  });

  useEffect(() => {
    // 🔍 Fetch the current logged-in player and their stats!
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setUsername(user.user_metadata?.username || 'Player 1');

        // Fetch the skill tree XP from the database
        const { data: userData, error } = await supabase
          .from('users')
          .select('int_xp, str_xp, cha_xp, end_xp')
          .eq('id', user.id)
          .single();

        if (userData && !error) {
          setStats({
            int: userData.int_xp || 0,
            str: userData.str_xp || 0,
            cha: userData.cha_xp || 0,
            end: userData.end_xp || 0,
          });
        }
      }
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error Logging Out', error.message);
    }
  };

  // 🧮 Helper function to calculate Stat Level and Bar Width
  const calculateStatProgress = (totalXp: number) => {
    const level = Math.floor(totalXp / 1000) + 1;
    const currentXp = totalXp % 1000;
    const progressPercent = (currentXp / 1000) * 100;
    return { level, currentXp, progressPercent };
  };

  // 🎨 The configuration for our sick Skill Tree UI
  const statConfig = [
    { id: 'int', name: 'Intelligence', icon: '🧠', xp: stats.int, color: '#007AFF' },
    { id: 'str', name: 'Strength', icon: '💪', xp: stats.str, color: '#FF3B30' },
    { id: 'cha', name: 'Charisma', icon: '🗣️', xp: stats.cha, color: '#FFCC00' },
    { id: 'end', name: 'Endurance', icon: '⚡', xp: stats.end, color: '#34C759' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* 🔙 Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>

        <Text style={styles.title}>Player Profile 🏆</Text>

        {/* 💳 Player ID Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* 🧬 THE SKILL TREE SECTION */}
        <View style={styles.skillTreeContainer}>
          <Text style={styles.sectionTitle}>Skill Tree 🧬</Text>
          
          {statConfig.map((stat) => {
            const { level, currentXp, progressPercent } = calculateStatProgress(stat.xp);
            
            return (
              <View key={stat.id} style={styles.statRow}>
                <View style={styles.statHeader}>
                  <Text style={styles.statName}>{stat.icon} {stat.name}</Text>
                  <Text style={styles.statLevel}>Lv.{level}</Text>
                </View>
                
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${progressPercent}%`, backgroundColor: stat.color }
                    ]} 
                  />
                </View>
                <Text style={styles.statXpText}>{currentXp} / 1000 XP</Text>
              </View>
            );
          })}
        </View>

        {/* 🛍️ Shop Navigation Button */}
        <TouchableOpacity 
          style={styles.shopButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Shop' as never); // 👈 Opens the Shop!
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>🛒</Text>
            <View>
              <Text style={styles.shopButtonTitle}>Ascend Shop</Text>
              <Text style={styles.shopButtonSubtitle}>Spend your 🪙 Coins & 💎 Gems</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#111" />
        </TouchableOpacity>

        {/* 🚪 Small Logout Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', 
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'flex-start',
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111',
    marginBottom: 30,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 40,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
  },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  
  // 🧬 Skill Tree Styles
  skillTreeContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111',
    marginBottom: 20,
  },
  statRow: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
  statLevel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  statXpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A0A0',
    textAlign: 'right',
  },

  // 🛍️ Shop Button Styles
  shopButton: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  shopButtonTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
  shopButtonSubtitle: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    marginTop: 2,
  },

  bottomSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE5E5', 
  },
  logoutText: {
    color: '#FF3B30', 
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});