import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import MissionCard from '../components/MissionCard';
import AddMissionModal from '../components/AddMissionModal';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  // 🎯 Missions State
  const [missions, setMissions] = useState<any[]>([]);
  // 📊 Player Stats State
  const [playerStats, setPlayerStats] = useState({
    level: 1,
    xp: 0,
    combo: 0,
    id: '',
  });
  const [isModalVisible, setModalVisible] = useState(false);

  // 🔄 Load everything when screen opens
  useEffect(() => {
    loadPlayerData();
  }, []);

  // 📥 Load player stats + missions
  const loadPlayerData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Load Player Stats 📊
    const { data: statsData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (statsData) {
      setPlayerStats({
        level: statsData.level,
        xp: statsData.xp,
        combo: statsData.combo,
        id: user.id,
      });
    }

    // 2. Load Missions 🎯
    const { data: missionsData } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false });

    if (missionsData) {
      setMissions(
        missionsData.map((m) => ({
          id: m.id,
          title: m.title,
          xp: m.xp_reward,
          isCompleted: m.is_completed,
        }))
      );
    }
  };

  // ⚡ Toggle Mission with Level-Up Logic
  const toggleMission = async (
    missionId: number,
    currentStatus: boolean,
    missionXp: number
  ) => {
    const isCompleting = !currentStatus;

    // 1. Instantly update UI ⚡
    setMissions(
      missions.map((m) =>
        m.id === missionId ? { ...m, isCompleted: isCompleting } : m
      )
    );

    // 2. Calculate new XP and Levels 🧮
    let newXp = isCompleting
      ? playerStats.xp + missionXp
      : playerStats.xp - missionXp;
    let newLevel = playerStats.level;

    // 🏆 LEVEL UP LOGIC!
    if (newXp >= 1000) {
      newLevel += 1;
      newXp -= 1000; // carry over extra XP
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('LEVEL UP! 🎉⚡', `You are now Level ${newLevel}! Keep grinding, bro!`);
    } else if (newXp < 0 && newLevel > 1) {
      // unchecking a mission can drop a level
      newLevel -= 1;
      newXp += 1000;
    } else if (newXp < 0) {
      newXp = 0; // floor at 0 when level 1
    }

    // Update local player stats
    setPlayerStats({ ...playerStats, xp: newXp, level: newLevel });

    // 3. Save to Supabase in the background ☁️
    await supabase
      .from('missions')
      .update({ is_completed: isCompleting })
      .eq('id', missionId);

    await supabase
      .from('users')
      .update({ xp: newXp, level: newLevel })
      .eq('id', playerStats.id);
  };

  // 🗑️ Delete Mission Function (NEW!)
  const deleteMission = (missionId: number, missionTitle: string) => {
    Alert.alert(
      "Scrap Mission? 🗑️",
      `Are you sure you want to delete "${missionTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            // 1. Remove it from the UI instantly ⚡
            setMissions(missions.filter(m => m.id !== missionId));
            
            // 2. Delete it from the cloud ☁️
            const { error } = await supabase
              .from('missions')
              .delete()
              .eq('id', missionId);
              
            if (error) {
              console.error("Delete Error:", error);
              Alert.alert("Error", "Could not delete mission from database.");
              loadPlayerData(); // Reload if there's an error to keep UI in sync
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🏆 Player Stats Header */}
      <View style={styles.statsContainer}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LEVEL {playerStats.level} ⚡</Text>
          </View>
          <View style={styles.comboBadge}>
            <Text style={styles.comboText}>🔥 {playerStats.combo} Days</Text>
          </View>
        </View>

        {/* 👤 Profile Button */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Profile');
          }}
        >
          <Ionicons name="person" size={18} color="#111" />
        </TouchableOpacity>
      </View>

      {/* 🟢 XP Progress Bar – dynamic width! */}
      <View style={styles.xpContainer}>
        <Text style={styles.xpLabel}>XP</Text>
        <View style={styles.xpTrack}>
          <View
            style={[
              styles.xpFill,
              { width: `${(playerStats.xp / 1000) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.xpNumbers}>
          {playerStats.xp} / 1000
        </Text>
      </View>

      {/* 🎯 Mission Board */}
      <View style={styles.missionBoard}>
        <Text style={styles.title}>Today's Missions 🎯</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              title={mission.title}
              xp={mission.xp}
              isCompleted={mission.isCompleted}
              onComplete={() =>
                toggleMission(mission.id, mission.isCompleted, mission.xp)
              }
              onDelete={() => deleteMission(mission.id, mission.title)} // 👈 Connected the delete prop right here!
            />
          ))}

          {missions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Ready to grind today, bro? 💪
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* 🟢 Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      {/* 📝 Add Mission Modal with user_id */}
      <AddMissionModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={async (title, xp) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('missions')
            .insert([
              {
                title: title,
                xp_reward: xp,
                is_completed: false,
                user_id: user.id,
              },
            ])
            .select();

          if (error) {
            console.error('Supabase Insert Error:', error);
          } else if (data) {
            const newMission = {
              id: data[0].id,
              title: data[0].title,
              xp: data[0].xp_reward,
              isCompleted: data[0].is_completed,
            };
            setMissions([newMission, ...missions]);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 24,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },

  levelBadge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  levelText: {
    fontWeight: '800',
    fontSize: 16,
    color: '#111',
  },

  comboBadge: {
    backgroundColor: '#FFF2E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  comboText: {
    fontWeight: '800',
    fontSize: 16,
    color: '#FF7F50',
  },

  profileButton: {
    backgroundColor: '#FFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  xpContainer: {
    marginTop: 32,
  },

  xpLabel: {
    fontWeight: '700',
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },

  xpTrack: {
    height: 14,
    backgroundColor: '#EBEBEB',
    borderRadius: 12,
    overflow: 'hidden',
  },

  xpFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 12,
  },

  xpNumbers: {
    textAlign: 'right',
    marginTop: 8,
    color: '#A0A0A0',
    fontWeight: '600',
    fontSize: 12,
  },

  missionBoard: {
    marginTop: 40,
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111',
    marginBottom: 20,
  },

  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },

  emptyStateText: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '600',
  },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    backgroundColor: '#111',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});