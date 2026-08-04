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

  // ⏳ Loading State so they don't see the math happen
  const [isMathLoading, setIsMathLoading] = useState(true);

  // 🎯 Missions State (Now tracking the Stat Category 🧬)
  const [missions, setMissions] = useState<any[]>([]);
  
  // 📊 Player Stats State (Now with Economy 💰)
  const [playerStats, setPlayerStats] = useState({
    level: 1,
    xp: 0,
    combo: 0,
    health: 100,
    id: '',
    lastComboDate: null as string | null,
    int_xp: 0,
    str_xp: 0,
    cha_xp: 0,
    end_xp: 0,
    coins: 0, // 👈 New!
    gems: 0,  // 👈 New!
  });
  
  const [isModalVisible, setModalVisible] = useState(false);

  // 🩸 Damage Modal States
  const [damageTaken, setDamageTaken] = useState(0);
  const [showDamageModal, setShowDamageModal] = useState(false);

  // 🏆 Achievement Modal States
  const [unlockedBadge, setUnlockedBadge] = useState({ id: '', title: '', icon: '', desc: '' });
  const [showAchievementModal, setShowAchievementModal] = useState(false);

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
        
        const daysMissed = differenceInCalendarDays(today, lastActiveDate);
        
        let newHealth = statsData.health ?? 100; 
        let newCombo = statsData.combo ?? 0;

        if (daysMissed > 1) {
          const damage = (daysMissed - 1) * 20; 
          newHealth = Math.max(0, newHealth - damage); 
          newCombo = 0; 
          
          setDamageTaken(damage);
          setShowDamageModal(true);
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

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

        // ⚡ Set the local state with all stats + economy
        setPlayerStats({
          level: statsData.level,
          xp: statsData.xp,
          combo: newCombo,
          health: newHealth,
          id: user.id,
          lastComboDate: statsData.last_combo_date,
          int_xp: statsData.int_xp || 0,
          str_xp: statsData.str_xp || 0,
          cha_xp: statsData.cha_xp || 0,
          end_xp: statsData.end_xp || 0,
          coins: statsData.coins || 0,  // 👈 Load coins
          gems: statsData.gems || 0,    // 👈 Load gems
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
            statCategory: m.stat_category || 'INT',
          }))
        );
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsMathLoading(false);
    }
  };

  // 🕵️‍♂️ THE SECRET EASTER EGG CHECKER (With Bug Radars 📡)
  const checkAchievements = async (userId: string, currentHealth: number, statCategory: string) => {
    console.log("🕵️‍♂️ Secret Check Started! Stat:", statCategory);
    
    const today = new Date();
    const hour = today.getHours();
    const newUnlocks = [];

    if (hour < 9) newUnlocks.push({ id: 'silver_arrow', title: 'The Silver Arrow 🏎️', icon: '🏁', desc: 'Flawless execution. Cleared a mission before 9 AM!' });
    if (hour >= 1 && hour < 4) newUnlocks.push({ id: 'night_owl', title: 'The Night Owl 🧛‍♂️', icon: '🌙', desc: 'Grinding while the world sleeps!' });
    
    if (statCategory === 'INT') {
      console.log("💻 INT Mission detected! Prepping Startup Hustle badge...");
      newUnlocks.push({ id: 'startup_hustle', title: 'The Startup Hustle 💻', icon: '🚀', desc: 'Big brain energy. Keep building!' });
    }

    if (currentHealth < 20) newUnlocks.push({ id: 'clutch_comeback', title: 'Clutch Comeback 💀', icon: '❤️‍🔥', desc: 'Never back down. Grinding on low health!' });

    for (const badge of newUnlocks) {
      console.log(`🔍 Checking Supabase for badge: ${badge.id}`);
      
      const { data, error } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', badge.id);

      if (error) {
        console.error("🚨 SUPABASE SELECT ERROR:", error);
      }

      console.log(`📊 DB Data returned:`, data);

      if (!error && data && data.length === 0) {
        console.log(`🎉 UNLOCKING BADGE NOW: ${badge.id}`);
        
        const { error: insertError } = await supabase.from('achievements').insert([
          { user_id: userId, achievement_id: badge.id }
        ]);

        if (insertError) {
          console.error("🚨 SUPABASE INSERT ERROR:", insertError);
        } else {
          console.log("✅ Successfully saved to Database! Triggering UI...");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);

          setUnlockedBadge(badge);
          setShowAchievementModal(true);
          break; 
        }
      } else if (data && data.length > 0) {
        console.log(`⚠️ Badge ${badge.id} is already unlocked for this user.`);
      }
    }
  };

  // ⚡ Toggle Mission with Level-Up, Combo, SKILL TREE & ECONOMY Logic 🧬💰
  const toggleMission = async (
    missionId: number,
    currentStatus: boolean,
    missionXp: number,
    missionStat: string
  ) => {
    const isCompleting = !currentStatus;

    // 1. Instantly update UI ⚡
    setMissions(
      missions.map((m) =>
        m.id === missionId ? { ...m, isCompleted: isCompleting } : m
      )
    );

    // 2. Calculate new XP and Levels 🧮
    let newXp = isCompleting ? playerStats.xp + missionXp : playerStats.xp - missionXp;
    let newLevel = playerStats.level;

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

    // 🔥 COMBO BOOST LOGIC
    let newCombo = playerStats.combo;
    let newLastComboDate = playerStats.lastComboDate;
    const today = new Date();

    if (isCompleting) {
      const alreadyGotComboToday = playerStats.lastComboDate 
        ? isSameDay(new Date(playerStats.lastComboDate), today)
        : false;

      if (!alreadyGotComboToday) {
        newCombo += 1;
        newLastComboDate = today.toISOString(); 
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('🔥 COMBO BOOST!', `You started your daily streak! ${newCombo} Days strong!`);
      }
    }

    // 🧬 SKILL TREE LOGIC: Distribute the specific stat XP!
    const dbStatKey = `${missionStat.toLowerCase()}_xp` as keyof typeof playerStats;
    let currentStatXp = (playerStats[dbStatKey] as number) || 0;
    
    let newStatXp = isCompleting ? currentStatXp + missionXp : currentStatXp - missionXp;
    if (newStatXp < 0) newStatXp = 0;

    // 💰 ASCEND ECONOMY LOGIC
    let newCoins = playerStats.coins;
    let newGems = playerStats.gems;

    if (isCompleting) {
      // 1. Calculate guaranteed coins (Half of the XP reward)
      const coinsEarned = Math.floor(missionXp / 2);
      newCoins += coinsEarned;

      // 2. The 10% Rare Gem Drop Chance! 💎
      const foundGem = Math.random() < 0.10; 
      if (foundGem) {
        newGems += 1;
        
        // Delay the alert slightly so it pops up AFTER the mission clears
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('💎 RARE LOOT DROP!', 'You found a hidden Gem while grinding!');
        }, 600);
      }
    } else {
      // If they uncheck a mission, take the coins back!
      const coinsEarned = Math.floor(missionXp / 2);
      newCoins = Math.max(0, newCoins - coinsEarned);
    }

    // Update local player stats (including economy)
    setPlayerStats({ 
      ...playerStats, 
      xp: newXp, 
      level: newLevel,
      combo: newCombo,
      lastComboDate: newLastComboDate,
      [dbStatKey]: newStatXp,
      coins: newCoins, // 👈 Update coins
      gems: newGems,   // 👈 Update gems
    });

    // 3. Save to Supabase in the background ☁️
    await supabase
      .from('missions')
      .update({ is_completed: isCompleting })
      .eq('id', missionId);

    await supabase
      .from('users')
      .update({ 
        xp: newXp, 
        level: newLevel,
        combo: newCombo,
        last_combo_date: newLastComboDate,
        [dbStatKey]: newStatXp,
        coins: newCoins, // 👈 Save Coins
        gems: newGems,   // 👈 Save Gems
      })
      .eq('id', playerStats.id);

    // 🕵️‍♂️ Secret achievement check (only when completing)
    if (isCompleting) {
      await checkAchievements(playerStats.id, playerStats.health, missionStat);
    }
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
            setMissions(missions.filter(m => m.id !== missionId));
            const { error } = await supabase.from('missions').delete().eq('id', missionId);
            if (error) loadPlayerData(); 
          }
        }
      ]
    );
  };

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
          <View style={styles.healthBadge}>
            <Text style={styles.healthText}>❤️ {playerStats.health}</Text>
          </View>
        </View>

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

      {/* 🟢 XP Progress Bar */}
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
                toggleMission(mission.id, mission.isCompleted, mission.xp, mission.statCategory)
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
        onAdd={async (title: string, xp: number, statCategory: string) => {
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
                stat_category: statCategory,
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
              statCategory: data[0].stat_category,
            };
            setMissions([newMission, ...missions]);
          }
        }}
      />

      {/* 🩸 THE DAMAGE MODAL */}
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

      {/* 🏆 THE ACHIEVEMENT MODAL (Premium Glassmorphism) */}
      <Modal visible={showAchievementModal} transparent={true} animationType="slide">
        <View style={styles.achievementOverlay}>
          <View style={styles.achievementCard}>
            <Text style={styles.achievementIcon}>{unlockedBadge.icon}</Text>
            <Text style={styles.achievementTitle}>Achievement Unlocked!</Text>
            <Text style={styles.achievementName}>{unlockedBadge.title}</Text>
            <Text style={styles.achievementDesc}>{unlockedBadge.desc}</Text>
            
            <Pressable 
              style={styles.claimButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setShowAchievementModal(false);
              }}
            >
              <Text style={styles.claimButtonText}>Claim Reward 🏆</Text>
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
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
  buttonText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  // 🏆 ACHIEVEMENT MODAL STYLES (Glassmorphism)
  achievementOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 32,
    borderRadius: 28,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
  },
  achievementIcon: { 
    fontSize: 70, 
    marginBottom: 16 
  },
  achievementTitle: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#FF7F50', 
    textTransform: 'uppercase', 
    letterSpacing: 1.5,
    marginBottom: 8 
  },
  achievementName: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#111', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  achievementDesc: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center', 
    marginBottom: 28, 
    fontWeight: '600', 
    lineHeight: 22 
  },
  claimButton: {
    backgroundColor: '#111',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  claimButtonText: { 
    color: '#FFF', 
    fontWeight: '900', 
    fontSize: 16 
  },
});