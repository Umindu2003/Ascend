import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import MissionCard from '../components/MissionCard';
import AddMissionModal from '../components/AddMissionModal';
import RewardModal from '../components/RewardModal';
import ConfettiOverlay from '../components/ConfettiOverlay';
import AnimatedButton from '../components/AnimatedButton';
import BottomTabNavigator, { TabName } from '../navigation/BottomTabNavigator';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { differenceInCalendarDays, isSameDay } from 'date-fns';

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  // ⏳ Loading State
  const [isMathLoading, setIsMathLoading] = useState(true);
  const [username, setUsername] = useState('Player 1');

  // 🎯 Missions State
  const [missions, setMissions] = useState<any[]>([]);
  
  // 📊 Player Stats State
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
    coins: 0,
    gems: 0,
    achievementsCount: 0,
  });
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>('Home');

  // 🩸 Damage Modal States
  const [damageTaken, setDamageTaken] = useState(0);
  const [showDamageModal, setShowDamageModal] = useState(false);

  // 🏆 Custom Reward Sheet Modal States
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardDetails, setRewardDetails] = useState({
    title: '🎉 Mission Cleared',
    subtitle: 'Great job staying consistent!',
    xp: 0,
    coins: 0,
    gems: 0,
    badgeTitle: '',
    badgeIcon: '',
  });

  // 🎊 Confetti Overlay State
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    loadPlayerData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 👋';
    if (hour < 18) return 'Good Afternoon 👋';
    return 'Good Evening 👋';
  };

  // 📥 Load player stats + missions + DAILY CATCH-UP LOGIC
  const loadPlayerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUsername(user.user_metadata?.username || 'Player 1');

      // 1. Load Player Stats
      const { data: statsData, error: statsError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (statsError) throw statsError;

      // 2. Count unlocked achievements
      const { count: achCount } = await supabase
        .from('achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

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

        setPlayerStats({
          level: statsData.level || 1,
          xp: statsData.xp || 0,
          combo: newCombo,
          health: newHealth,
          id: user.id,
          lastComboDate: statsData.last_combo_date,
          int_xp: statsData.int_xp || 0,
          str_xp: statsData.str_xp || 0,
          cha_xp: statsData.cha_xp || 0,
          end_xp: statsData.end_xp || 0,
          coins: statsData.coins || 0,
          gems: statsData.gems || 0,
          achievementsCount: achCount || 0,
        });
      }

      // 3. Load Missions
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

  // Secret Achievement Checker
  const checkAchievements = async (userId: string, currentHealth: number, statCategory: string) => {
    const today = new Date();
    const hour = today.getHours();
    const newUnlocks = [];

    if (hour < 9) newUnlocks.push({ id: 'silver_arrow', title: 'The Silver Arrow 🏎️', icon: '🏁', desc: 'Flawless execution. Cleared a mission before 9 AM!' });
    if (hour >= 1 && hour < 4) newUnlocks.push({ id: 'night_owl', title: 'The Night Owl 🧛‍♂️', icon: '🌙', desc: 'Grinding while the world sleeps!' });
    
    if (statCategory === 'INT') {
      newUnlocks.push({ id: 'startup_hustle', title: 'The Startup Hustle 💻', icon: '🚀', desc: 'Big brain energy. Keep building!' });
    }

    if (currentHealth < 20) newUnlocks.push({ id: 'clutch_comeback', title: 'Clutch Comeback 💀', icon: '❤️‍🔥', desc: 'Never back down. Grinding on low health!' });

    for (const badge of newUnlocks) {
      const { data, error } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', badge.id);

      if (!error && data && data.length === 0) {
        await supabase.from('achievements').insert([
          { user_id: userId, achievement_id: badge.id }
        ]);

        setShowConfetti(true);
        setRewardDetails({
          title: '🏆 Achievement Unlocked!',
          subtitle: badge.desc,
          xp: 100,
          coins: 50,
          gems: 1,
          badgeTitle: badge.title,
          badgeIcon: badge.icon,
        });
        setShowRewardModal(true);
        setPlayerStats((prev) => ({ ...prev, achievementsCount: prev.achievementsCount + 1 }));
        break; 
      }
    }
  };

  // Toggle Mission with XP, Leveling, Economy and Custom Reward Card Modal
  const toggleMission = async (
    missionId: number,
    currentStatus: boolean,
    missionXp: number,
    missionStat: string
  ) => {
    const isCompleting = !currentStatus;

    setMissions(
      missions.map((m) =>
        m.id === missionId ? { ...m, isCompleted: isCompleting } : m
      )
    );

    let newXp = isCompleting ? playerStats.xp + missionXp : playerStats.xp - missionXp;
    let newLevel = playerStats.level;
    let newHealth = playerStats.health;
    let didLevelUp = false;

    if (newXp >= 1000) {
      newLevel += 1;
      newXp -= 1000;
      newHealth = 100 + (newLevel - 1) * 20;
      didLevelUp = true;
    } else if (newXp < 0 && newLevel > 1) {
      newLevel -= 1;
      newXp += 1000;
    } else if (newXp < 0) {
      newXp = 0; 
    }

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
      }
    }

    const dbStatKey = `${missionStat.toLowerCase()}_xp` as keyof typeof playerStats;
    let currentStatXp = (playerStats[dbStatKey] as number) || 0;
    let newStatXp = isCompleting ? currentStatXp + missionXp : currentStatXp - missionXp;
    if (newStatXp < 0) newStatXp = 0;

    let newCoins = playerStats.coins;
    let newGems = playerStats.gems;
    let coinsEarned = 0;
    let gemsEarned = 0;

    if (isCompleting) {
      coinsEarned = Math.floor(missionXp / 2);
      newCoins += coinsEarned;

      const foundGem = Math.random() < 0.10; 
      if (foundGem) {
        gemsEarned = 1;
        newGems += 1;
      }
    } else {
      coinsEarned = Math.floor(missionXp / 2);
      newCoins = Math.max(0, newCoins - coinsEarned);
    }

    setPlayerStats((prev) => ({
      ...prev,
      xp: newXp,
      level: newLevel,
      health: newHealth,
      combo: newCombo,
      lastComboDate: newLastComboDate,
      [dbStatKey]: newStatXp,
      coins: newCoins,
      gems: newGems,
    }));

    if (isCompleting) {
      if (didLevelUp) {
        setShowConfetti(true);
        setRewardDetails({
          title: `⚡ LEVEL UP! LEVEL ${newLevel}`,
          subtitle: `Congratulations! Max HP expanded to ${newHealth} ❤️!`,
          xp: missionXp,
          coins: coinsEarned,
          gems: gemsEarned,
          badgeTitle: 'Ascendant Level',
          badgeIcon: '⚡',
        });
        setShowRewardModal(true);
      } else {
        setRewardDetails({
          title: '🎉 Mission Cleared!',
          subtitle: `You earned +${missionXp} XP towards your character level.`,
          xp: missionXp,
          coins: coinsEarned,
          gems: gemsEarned,
          badgeTitle: '',
          badgeIcon: '🎯',
        });
        setShowRewardModal(true);
      }
    }

    await supabase
      .from('missions')
      .update({ is_completed: isCompleting })
      .eq('id', missionId);

    await supabase
      .from('users')
      .update({ 
        xp: newXp, 
        level: newLevel,
        health: newHealth,
        combo: newCombo,
        last_combo_date: newLastComboDate,
        [dbStatKey]: newStatXp,
        coins: newCoins,
        gems: newGems,
      })
      .eq('id', playerStats.id);

    if (isCompleting) {
      await checkAchievements(playerStats.id, newHealth, missionStat);
    }
  };

  const deleteMission = async (missionId: number) => {
    setMissions(missions.filter(m => m.id !== missionId));
    await supabase.from('missions').delete().eq('id', missionId);
  };

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'Profile') {
      navigation.navigate('Profile');
    } else if (tab === 'Shop') {
      navigation.navigate('Shop');
    }
  };

  if (isMathLoading) {
    return <View style={styles.loadingContainer} />;
  }

  const xpPercentage = Math.min(100, Math.max(0, (playerStats.xp / 1000) * 100));

  return (
    <SafeAreaView style={styles.container}>
      <ConfettiOverlay visible={showConfetti} onComplete={() => setShowConfetti(false)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Top Greeting with Username */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.headerTitle}>{username}</Text>
          </View>

          <AnimatedButton
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </AnimatedButton>
        </View>

        {/* 2. Player Card */}
        <View style={styles.playerCard}>
          <View style={styles.playerCardHeader}>
            <View style={styles.levelBadgeContainer}>
              <Text style={styles.levelBadgeText}>LEVEL {playerStats.level}</Text>
            </View>
            <View style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>Explorer ✨</Text>
            </View>
          </View>

          {/* XP Progress */}
          <View style={styles.xpSection}>
            <View style={styles.xpLabelRow}>
              <Text style={styles.xpLabelTitle}>XP Progress</Text>
              <Text style={styles.xpValueText}>{playerStats.xp} / 1000 XP</Text>
            </View>

            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${xpPercentage}%` }]} />
            </View>
          </View>
        </View>

        {/* 3. Stats Section Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{playerStats.combo}</Text>
            <Text style={styles.statLabel}>Combo</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statNumber}>{playerStats.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statNumber}>{playerStats.achievementsCount}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>🪙</Text>
            <Text style={styles.statNumber}>{playerStats.coins}</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>
        </View>

        {/* 4. Today's Missions Section */}
        <View style={styles.missionsHeader}>
          <Text style={styles.sectionTitle}>Today's Missions 🎯</Text>
          <AnimatedButton
            style={styles.addInlineButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={20} color={COLORS.textLight} />
            <Text style={styles.addInlineText}>New</Text>
          </AnimatedButton>
        </View>

        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            title={mission.title}
            xp={mission.xp}
            statCategory={mission.statCategory}
            isCompleted={mission.isCompleted}
            onComplete={() =>
              toggleMission(mission.id, mission.isCompleted, mission.xp, mission.statCategory)
            }
            onDelete={() => deleteMission(mission.id)}
          />
        ))}

        {missions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🚀</Text>
            <Text style={styles.emptyStateTitle}>No missions set for today!</Text>
            <Text style={styles.emptyStateText}>Tap 'New' above to level up your character.</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Nav */}
      <BottomTabNavigator activeTab={activeTab} onTabPress={handleTabPress} />

      {/* Add Mission Modal */}
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

          if (!error && data) {
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

      {/* Reward Popup Modal Sheet */}
      <RewardModal
        visible={showRewardModal}
        title={rewardDetails.title}
        subtitle={rewardDetails.subtitle}
        xpReward={rewardDetails.xp}
        coinsReward={rewardDetails.coins}
        gemsReward={rewardDetails.gems}
        badgeTitle={rewardDetails.badgeTitle}
        badgeIcon={rewardDetails.badgeIcon}
        onClose={() => setShowRewardModal(false)}
      />

      {/* 🍏 Damage Alert Modal – updated with wrapper & chunky styles */}
      <Modal visible={showDamageModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.damageCard}>
            <Text style={styles.skullEmoji}>💀</Text>
            <Text style={styles.damageTitle}>Streak Reset!</Text>
            <Text style={styles.damageText}>
              You missed a day and took <Text style={styles.redText}>{damageTaken} damage</Text>.
            </Text>
            
            {/* 🚀 Wrapper ensures the flexbox respects the width */}
            <View style={styles.reviveButtonWrapper}>
              <AnimatedButton
                style={styles.reviveButton}
                onPress={() => setShowDamageModal(false)}
                scaleTo={0.95}
              >
                <Text style={styles.buttonText}>Keep Fighting ⚔️</Text>
              </AnimatedButton>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  profileButton: {
    backgroundColor: COLORS.card,
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  playerCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  playerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadgeContainer: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
  },
  levelBadgeText: {
    color: COLORS.textLight,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  titleBadge: {
    backgroundColor: COLORS.xpBackground,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 197, 66, 0.3)',
  },
  titleBadgeText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  xpSection: {
    marginTop: 4,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpLabelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  xpValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  xpTrack: {
    height: 12,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: COLORS.xp,
    borderRadius: RADIUS.full,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  missionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  addInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  addInlineText: {
    color: COLORS.textLight,
    fontWeight: '800',
    fontSize: 13,
  },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  emptyStateEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // ---- Damage Modal Styles (updated) ----
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  damageCard: {
    backgroundColor: COLORS.card,
    padding: 30,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    ...SHADOWS.modal,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skullEmoji: { fontSize: 48, marginBottom: 12 },
  damageTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8, color: COLORS.textPrimary },
  damageText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24, fontWeight: '500' },
  redText: { color: COLORS.danger, fontWeight: '800' },

  // New wrapper & button styles (chunky Apple aesthetic)
  reviveButtonWrapper: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  reviveButton: {
    backgroundColor: '#111111', // or COLORS.primary
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16, // use RADIUS variable if you prefer
    width: '85%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});