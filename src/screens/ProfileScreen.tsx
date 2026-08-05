import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';
import BottomTabNavigator, { TabName } from '../navigation/BottomTabNavigator';
import * as Haptics from 'expo-haptics';

interface AchievementItem {
  id: string;
  achievement_id: string;
  created_at: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('Player 1');
  const [level, setLevel] = useState(1);
  const [totalXp, setTotalXp] = useState(0);
  const [joinedDate, setJoinedDate] = useState('Recently');
  const [activeTab, setActiveTab] = useState<TabName>('Profile');
  
  const [stats, setStats] = useState({
    int: 0,
    str: 0,
    cha: 0,
    end: 0,
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementItem[]>([]);

  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || '');
      setUsername(user.user_metadata?.username || 'Ascendant Player');

      if (user.created_at) {
        const date = new Date(user.created_at);
        setJoinedDate(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData) {
        setLevel(userData.level || 1);
        setTotalXp(userData.xp || 0);
        setStats({
          int: userData.int_xp || 0,
          str: userData.str_xp || 0,
          cha: userData.cha_xp || 0,
          end: userData.end_xp || 0,
        });
      }

      // Fetch unlocked achievements
      const { data: achData } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);

      if (achData) {
        setUnlockedAchievements(achData);
      }
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error Logging Out', error.message);
    }
  };

  const calculateStatProgress = (statXp: number) => {
    const statLevel = Math.floor(statXp / 1000) + 1;
    const currentXp = statXp % 1000;
    const progressPercent = (currentXp / 1000) * 100;
    return { statLevel, currentXp, progressPercent };
  };

  const statConfig = [
    { id: 'int', name: 'Intelligence', icon: '🧠', xp: stats.int, color: '#3B82F6' },
    { id: 'str', name: 'Strength', icon: '💪', xp: stats.str, color: '#EF4444' },
    { id: 'cha', name: 'Charisma', icon: '🗣️', xp: stats.cha, color: '#F59E0B' },
    { id: 'end', name: 'Endurance', icon: '⚡', xp: stats.end, color: '#22C55E' },
  ];

  const achievementBadgesList = [
    { id: 'startup_hustle', title: 'Startup Hustle', icon: '🚀', desc: 'Cleared INT missions' },
    { id: 'silver_arrow', title: 'Silver Arrow', icon: '🏁', desc: 'Cleared before 9 AM' },
    { id: 'night_owl', title: 'Night Owl', icon: '🌙', desc: 'Late night grind' },
    { id: 'clutch_comeback', title: 'Clutch Comeback', icon: '❤️‍🔥', desc: 'Low health survivor' },
  ];

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'Home') navigation.navigate('Home');
    if (tab === 'Shop') navigation.navigate('Shop');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Navigation */}
        <View style={styles.headerRow}>
          <AnimatedButton
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </AnimatedButton>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Player Avatar Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
            <View style={styles.levelBadgeFloating}>
              <Text style={styles.levelBadgeFloatingText}>LVL {level}</Text>
            </View>
          </View>

          <Text style={styles.username}>{username}</Text>
          <Text style={styles.userTitle}>Explorer • Ascendant Level {level}</Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.joinedBadge}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.joinedText}>Joined {joinedDate}</Text>
          </View>
        </View>

        {/* Skill Tree Progress */}
        <Text style={styles.sectionTitle}>Skill Tree 🧬</Text>
        <View style={styles.skillTreeContainer}>
          {statConfig.map((stat) => {
            const { statLevel, currentXp, progressPercent } = calculateStatProgress(stat.xp);
            
            return (
              <View key={stat.id} style={styles.statRow}>
                <View style={styles.statHeader}>
                  <Text style={styles.statName}>{stat.icon} {stat.name}</Text>
                  <Text style={styles.statLevel}>Lv.{statLevel}</Text>
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

        {/* Achievements Gallery */}
        <Text style={styles.sectionTitle}>Achievements 🏆</Text>
        <View style={styles.achievementsGrid}>
          {achievementBadgesList.map((badge) => {
            const isUnlocked = unlockedAchievements.some((a) => a.achievement_id === badge.id);
            return (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  isUnlocked ? styles.badgeUnlocked : styles.badgeLocked,
                ]}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={[styles.badgeTitle, !isUnlocked && styles.badgeTitleLocked]}>
                  {badge.title}
                </Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
                {isUnlocked && (
                  <View style={styles.unlockedTag}>
                    <Text style={styles.unlockedTagText}>Unlocked</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Shop Shortcut */}
        <AnimatedButton
          style={styles.shopCard}
          onPress={() => navigation.navigate('Shop')}
        >
          <View style={styles.shopCardLeft}>
            <Text style={{ fontSize: 26, marginRight: 12 }}>🛒</Text>
            <View>
              <Text style={styles.shopCardTitle}>Ascend Shop</Text>
              <Text style={styles.shopCardSubtitle}>Redeem your coins & gems for loot</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
        </AnimatedButton>

        {/* Logout Button */}
        <View style={styles.logoutWrapper}>
          <AnimatedButton style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
            <Text style={styles.logoutText}>Log Out Account</Text>
          </AnimatedButton>
        </View>

      </ScrollView>

      {/* Floating Bottom Nav */}
      <BottomTabNavigator activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.card,
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
    marginBottom: 32,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarText: {
    color: COLORS.textLight,
    fontSize: 36,
    fontWeight: '900',
  },
  levelBadgeFloating: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: COLORS.xp,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  levelBadgeFloatingText: {
    color: COLORS.textPrimary,
    fontWeight: '900',
    fontSize: 11,
  },
  username: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.achievement,
    marginBottom: 6,
  },
  email: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 16,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  joinedText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  skillTreeContainer: {
    marginBottom: 32,
  },
  statRow: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLevel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  statXpText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  badgeUnlocked: {
    borderColor: 'rgba(139, 92, 246, 0.3)',
    backgroundColor: '#FAF5FF',
  },
  badgeLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeTitleLocked: {
    color: COLORS.textMuted,
  },
  badgeDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  unlockedTag: {
    marginTop: 10,
    backgroundColor: COLORS.achievement,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  unlockedTagText: {
    color: COLORS.textLight,
    fontSize: 10,
    fontWeight: '800',
  },
  shopCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  shopCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shopCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  shopCardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  logoutWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});