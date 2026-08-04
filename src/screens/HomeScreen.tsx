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
import AddMissionModal from '../components/AddMissionModal';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { differenceInCalendarDays, isSameDay } from 'date-fns';

// 🎨 ASCEND DARK THEME TOKENS
const COLORS = {
  bg: '#090A0F',
  accent: '#AEFF00',
  white: '#FFFFFF',
  surface: '#161821',
  surfaceGlass: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.1)',
  steel: '#888C9E',
  danger: '#FF3B5C',
  gem: '#7B61FF',
  gold: '#FFD84D',
};

// 🧬 Stat tag colors for mission cards (cosmetic only)
const STAT_TAG: Record<string, { icon: string; color: string }> = {
  INT: { icon: '🧠', color: '#5CC8FF' },
  STR: { icon: '💪', color: '#FF6B6B' },
  CHA: { icon: '✨', color: '#FF9ECD' },
  END: { icon: '🛡️', color: '#7CFFB2' },
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  // ⏳ Loading State so they don't see the math happen
  const [isMathLoading, setIsMathLoading] = useState(true);

  // 🎯 Missions State (Now tracking the Stat Category 🧬)
  const [missions, setMissions] = useState<any[]>([]);

  // 👤 Display name (pulled from auth user's email)
  const [displayName, setDisplayName] = useState('Player');

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

      // 👤 Derive a display name from the auth email
      if (user.email) {
        setDisplayName(user.email.split('@')[0]);
      }

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
    let newHealth = playerStats.health; // track health changes

    // 🏆 LEVEL UP LOGIC!
    if (newXp >= 1000) {
      newLevel += 1;
      newXp -= 1000; // carry over extra XP

      // 🛡️ Scale Max Health on Level Up! (+20 Max HP per level)
      const newMaxHealth = 100 + (newLevel - 1) * 20;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'LEVEL UP! 🎉⚡',
        `You are now Level ${newLevel}!\nMax Health upgraded to ${newMaxHealth} ❤️!`
      );

      // Update health locally to the new max
      newHealth = newMaxHealth;
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

    // Update local player stats (including economy and scaled health)
    setPlayerStats({
      ...playerStats,
      xp: newXp,
      level: newLevel,
      health: newHealth, // 👈 health now scales on level up
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
        health: newHealth, // 👈 save scaled health
        combo: newCombo,
        last_combo_date: newLastComboDate,
        [dbStatKey]: newStatXp,
        coins: newCoins, // 👈 Save Coins
        gems: newGems,   // 👈 Save Gems
      })
      .eq('id', playerStats.id);

    // 🕵️‍♂️ Secret achievement check (only when completing)
    if (isCompleting) {
      await checkAchievements(playerStats.id, newHealth, missionStat);
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

  // 🩺 Derived display-only values (no logic change, just for rendering)
  const maxHealth = 100 + (playerStats.level - 1) * 20;
  const healthPct = Math.max(0, Math.min(1, playerStats.health / maxHealth));
  const isDangerHealth = healthPct <= 0.3;
  const xpPct = Math.max(0, Math.min(1, playerStats.xp / 1000));
  const completedCount = missions.filter(m => m.isCompleted).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 🧑‍🚀 TOP BAR — real display name + profile */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.playerName}>{displayName}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Profile');
            }}
          >
            <Ionicons name="person" size={20} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {/* ⚡ HERO CARD — Level ring + HP bar + combo */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            {/* Level Ring */}
            <View style={styles.levelRing}>
              <Text style={styles.levelRingNumber}>{playerStats.level}</Text>
              <Text style={styles.levelRingLabel}>LVL</Text>
            </View>

            <View style={styles.heroStatsCol}>
              {/* XP bar */}
              <View style={styles.xpContainer}>
                <View style={styles.xpLabelRow}>
                  <Text style={styles.xpLabel}>XP</Text>
                  <Text style={styles.xpNumbers}>{playerStats.xp} / 1000</Text>
                </View>
                <View style={styles.xpTrack}>
                  <View style={[styles.xpFill, { width: `${xpPct * 100}%` }]} />
                </View>
              </View>

              {/* HP bar */}
              <View style={styles.xpContainer}>
                <View style={styles.xpLabelRow}>
                  <Text style={[styles.xpLabel, isDangerHealth && { color: COLORS.danger }]}>
                    ❤️ HP
                  </Text>
                  <Text style={styles.xpNumbers}>{playerStats.health} / {maxHealth}</Text>
                </View>
                <View style={styles.xpTrack}>
                  <View
                    style={[
                      styles.hpFill,
                      { width: `${healthPct * 100}%` },
                      isDangerHealth && styles.hpFillDanger,
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Combo strip */}
          <View style={[styles.comboStrip, playerStats.combo > 0 && styles.comboStripActive]}>
            <Text style={styles.comboStripText}>
              🔥 {playerStats.combo} Day Streak
            </Text>
            {playerStats.combo > 0 && <View style={styles.comboDot} />}
          </View>
        </View>

        {/* 🎯 Mission Board */}
        <View style={styles.missionBoard}>
          <View style={styles.missionHeaderRow}>
            <Text style={styles.title}>Today's Missions</Text>
            <View style={styles.missionCountPill}>
              <Text style={styles.missionCountText}>
                {completedCount}/{missions.length}
              </Text>
            </View>
          </View>

          {missions.map((mission) => {
            const tag = STAT_TAG[mission.statCategory] || STAT_TAG.INT;
            return (
              <TouchableOpacity
                key={mission.id}
                activeOpacity={0.7}
                onPress={() =>
                  toggleMission(mission.id, mission.isCompleted, mission.xp, mission.statCategory)
                }
                style={[
                  styles.missionCard,
                  mission.isCompleted && styles.missionCardCompleted,
                ]}
              >
                {/* Checkbox */}
                <View
                  style={[
                    styles.missionCheckbox,
                    mission.isCompleted && styles.missionCheckboxDone,
                  ]}
                >
                  {mission.isCompleted && (
                    <Ionicons name="checkmark" size={16} color={COLORS.bg} />
                  )}
                </View>

                {/* Middle content */}
                <View style={styles.missionMiddle}>
                  <Text
                    style={[
                      styles.missionTitle,
                      mission.isCompleted && styles.missionTitleDone,
                    ]}
                    numberOfLines={2}
                  >
                    {mission.title}
                  </Text>
                  <View style={styles.missionMetaRow}>
                    <View style={[styles.statTag, { borderColor: tag.color }]}>
                      <Text style={styles.statTagIcon}>{tag.icon}</Text>
                      <Text style={[styles.statTagText, { color: tag.color }]}>
                        {mission.statCategory}
                      </Text>
                    </View>
                    <View style={styles.xpPill}>
                      <Text style={styles.xpPillText}>+{mission.xp} XP</Text>
                    </View>
                  </View>
                </View>

                {/* Delete button */}
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => deleteMission(mission.id, mission.title)}
                  style={styles.missionDeleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.steel} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          {missions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💪</Text>
              <Text style={styles.emptyStateText}>
                Ready to grind today, bro?
              </Text>
              <Text style={styles.emptyStateSubtext}>Tap + to add your first mission</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 🟢 Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={32} color={COLORS.bg} />
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

      {/* 🏆 THE ACHIEVEMENT MODAL (Dark Glassmorphism + Neon) */}
      <Modal visible={showAchievementModal} transparent={true} animationType="slide">
        <View style={styles.achievementOverlay}>
          <View style={styles.achievementCard}>
            <View style={styles.achievementIconRing}>
              <Text style={styles.achievementIcon}>{unlockedBadge.icon}</Text>
            </View>
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
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  eyebrow: {
    color: COLORS.steel,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  playerName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  profileButton: {
    backgroundColor: COLORS.surfaceGlass,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Hero card
  heroCard: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  levelRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(174,255,0,0.06)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  levelRingNumber: {
    color: COLORS.accent,
    fontSize: 24,
    fontWeight: '900',
  },
  levelRingLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroStatsCol: {
    flex: 1,
    gap: 14,
  },
  xpContainer: {},
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpLabel: {
    fontWeight: '700',
    fontSize: 11,
    color: COLORS.steel,
    letterSpacing: 1,
  },
  xpTrack: {
    height: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  xpFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#4DDB6E',
    borderRadius: 8,
  },
  hpFillDanger: {
    backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  xpNumbers: {
    color: COLORS.steel,
    fontWeight: '700',
    fontSize: 11,
  },

  // Combo strip
  comboStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  comboStripActive: {
    borderColor: '#FF7F50',
    backgroundColor: 'rgba(255,127,80,0.08)',
    shadowColor: '#FF7F50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  comboStripText: {
    color: '#FF7F50',
    fontWeight: '800',
    fontSize: 14,
  },
  comboDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF7F50',
  },

  // Mission board
  missionBoard: {
    marginTop: 28,
  },
  missionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  missionCountPill: {
    backgroundColor: COLORS.surfaceGlass,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  missionCountText: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 12,
  },

  // Mission cards
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  missionCardCompleted: {
    borderColor: 'rgba(174,255,0,0.4)',
    backgroundColor: 'rgba(174,255,0,0.04)',
  },
  missionCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  missionCheckboxDone: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  missionMiddle: {
    flex: 1,
  },
  missionTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  missionTitleDone: {
    color: COLORS.steel,
    textDecorationLine: 'line-through',
  },
  missionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  statTagIcon: {
    fontSize: 11,
  },
  statTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  xpPill: {
    backgroundColor: 'rgba(174,255,0,0.1)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  xpPillText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  missionDeleteBtn: {
    marginLeft: 10,
    padding: 6,
  },

  emptyState: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceGlass,
    paddingVertical: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyStateIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyStateText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateSubtext: {
    color: COLORS.steel,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: COLORS.accent,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 10,
  },

  // Damage modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  damageCard: {
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger,
    shadowColor: COLORS.danger,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    width: '80%'
  },
  skullEmoji: { fontSize: 50, marginBottom: 10 },
  damageTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, color: COLORS.white },
  damageText: { fontSize: 16, color: COLORS.steel, textAlign: 'center', marginBottom: 20, fontWeight: '500' },
  redText: { color: COLORS.danger, fontWeight: '800' },
  reviveButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: COLORS.bg, fontWeight: '800', fontSize: 16 },

  // Achievement modal
  achievementOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementCard: {
    backgroundColor: 'rgba(22, 24, 33, 0.92)',
    padding: 32,
    borderRadius: 28,
    alignItems: 'center',
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
  },
  achievementIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(174,255,0,0.08)',
    marginBottom: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
  },
  achievementIcon: {
    fontSize: 46,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8
  },
  achievementName: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 12,
    textAlign: 'center'
  },
  achievementDesc: {
    fontSize: 16,
    color: COLORS.steel,
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '600',
    lineHeight: 22
  },
  claimButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  claimButtonText: {
    color: COLORS.bg,
    fontWeight: '900',
    fontSize: 16
  },
});