import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import MissionCard from '../components/MissionCard';
import AddMissionModal from '../components/AddMissionModal';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { differenceInCalendarDays, isSameDay } from 'date-fns';

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  // 🎯 Missions State
  const [missions, setMissions] = useState<any[]>([]);
  
  // 📊 Player Stats State (Now tracking last combo! 🔥)
  const [playerStats, setPlayerStats] = useState({
    level: 1,
    xp: 0,
    combo: 0,
    health: 100,
    id: '',
    lastComboDate: null as string | null, // 👈 ADD THIS
  });
  
  const [isModalVisible, setModalVisible] = useState(false);

  // 🩸 Damage Modal States
  const [damageTaken, setDamageTaken] = useState(0);
  const [showDamageModal, setShowDamageModal] = useState(false);

  // ⏳ Loading State so they don't see the math happen
  const [isMathLoading, setIsMathLoading] = useState(true);

  // 🔄 Load everything when screen opens
  useEffect(() => {
    loadPlayerData();
  }, []);

  // 📥 Load player stats + missions + DAILY CATCH-UP LOGIC 🧠
  const loadPlayerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Load Player Stats 📊
      const { data: statsData, error: statsError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (statsError) throw statsError;

      if (statsData) {
        const today = new Date();
        const lastActiveDate = statsData.last_active_date ? new Date(statsData.last_active_date) : today;
        
        // 🪄 The Magic Calculation
        const daysMissed = differenceInCalendarDays(today, lastActiveDate);
        
        let newHealth = statsData.health ?? 100; // Fallback just in case
        let newCombo = statsData.combo ?? 0;

        // 💀 The Penalty Check
        if (daysMissed > 1) {
          const damage = (daysMissed - 1) * 20; // 20 ❤️ lost per day missed
          newHealth = Math.max(0, newHealth - damage); 
          newCombo = 0; // Combo goes poof 💨
          
          setDamageTaken(damage);
          setShowDamageModal(true);
          
          // Heavy vibration for the damage! 📳
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        // ☁️ Update the Database if it's a new day
        if (daysMissed > 0 || !statsData.last_active_date) {
          await supabase
            .from('users')
            .update({
              last_active_date: today.toISOString(),
              health: newHealth,
              combo: newCombo,
            })
            .eq('id', user.id);
        }

        // ⚡ Set the local state (now includes lastComboDate)
        setPlayerStats({
          level: statsData.level,
          xp: statsData.xp,
          combo: newCombo,
          health: newHealth,
          id: user.id,
          lastComboDate: statsData.last_combo_date ?? null, // 👈 Include from DB
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
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      // 🎭 Turn off the local loading state instead of the splash screen!
      setIsMathLoading(false);
    }
  };

  // ⚡ Toggle Mission with Level-Up & Combo Logic
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
      newXp -= 1000;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('LEVEL UP! 🎉⚡', `You are now Level ${newLevel}! Keep grinding, bro!`);
    } else if (newXp < 0 && newLevel > 1) {
      newLevel -= 1;
      newXp += 1000;
    } else if (newXp < 0) {
      newXp = 0;
    }

    // 🔥 COMBO BOOST LOGIC!
    let newCombo = playerStats.combo;
    let newLastComboDate = playerStats.lastComboDate;
    const today = new Date();

    if (isCompleting) {
      // Check if they already got a combo today
      const alreadyGotComboToday = playerStats.lastComboDate 
        ? isSameDay(new Date(playerStats.lastComboDate), today)
        : false;

      if (!alreadyGotComboToday) {
        newCombo += 1;
        newLastComboDate = today.toISOString(); // Lock it in for today!
        
        // Massive Haptic & Alert for hitting the daily combo! 📳
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('🔥 COMBO BOOST!', `You started your daily streak! ${newCombo} Days strong!`);
      }
    }

    // Update local player stats
    setPlayerStats({ 
      ...playerStats, 
      xp: newXp, 
      level: newLevel,
      combo: newCombo, // 👈 Updated combo
      lastComboDate: newLastComboDate // 👈 Updated date
    });

    // 3. Save to Supabase in the background ☁️
    await supabase
      .from('missions')
      .update({ is_completed: isCompleting })
      .eq('id', missionId);

    // Note: Make sure 'last_combo_date' is a column in your 'users' table in Supabase!
    await supabase
      .from('users')
      .update({ 
        xp: newXp, 
        level: newLevel,
        combo: newCombo,
        last_combo_date: newLastComboDate
      })
      .eq('id', playerStats.id);
  };

  // 🗑️ Delete Mission Function
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

  // ⏳ If we are calculating stats, just show a blank screen to hide the layout shift
  if (isMathLoading) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 🏆 Player Stats Header */}
      <View style={styles.statsContainer}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LEVEL {playerStats.level} ⚡</Text>
          </View>
          <View style={styles.comboBadge}>
            <Text style={styles.comboText}>🔥 {playerStats.combo}</Text>
          </View>
          {/* NEW HEALTH BADGE ❤️ */}
          <View style={styles.healthBadge}>
            <Text style={styles.healthText}>❤️ {playerStats.health}</Text>
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
              onDelete={() => deleteMission(mission.id, mission.title)} 
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
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      {/* 📝 Add Mission Modal */}
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

      {/* 🩸 THE DAMAGE MODAL (Glassmorphism vibes) */}
      <Modal visible={showDamageModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.damageCard}>
            <Text style={styles.skullEmoji}>💀</Text>
            <Text style={styles.damageTitle}>Combo Broken!</Text>
            <Text style={styles.damageText}>
              You missed a day and took <Text style={styles.redText}>{damageTaken} damage</Text>.
            </Text>
            <Pressable 
              style={styles.reviveButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowDamageModal(false);
              }}
            >
              <Text style={styles.buttonText}>Keep Fighting ⚔️</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  levelText: {
    fontWeight: '800',
    fontSize: 14,
    color: '#111',
  },

  comboBadge: {
    backgroundColor: '#FFF2E5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  comboText: {
    fontWeight: '800',
    fontSize: 14,
    color: '#FF7F50',
  },

  // NEW: Health Badge Styles ❤️
  healthBadge: {
    backgroundColor: '#FFE5E5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  healthText: {
    fontWeight: '800',
    fontSize: 14,
    color: '#FF3B30',
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

  // 🩸 MODAL STYLES
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  damageCard: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    width: '80%'
  },
  skullEmoji: { fontSize: 50, marginBottom: 10 },
  damageTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, color: '#111' },
  damageText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20, fontWeight: '500' },
  redText: { color: '#FF3B30', fontWeight: '800' },
  reviveButton: {
    backgroundColor: '#111',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});