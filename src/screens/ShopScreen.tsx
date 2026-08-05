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

const SHOP_ITEMS = [
  {
    id: 'health_potion',
    name: 'Health Potion 🧪',
    desc: 'Restore +50 ❤️ Health instantly!',
    cost: 50,
    currency: 'coins',
  },
  {
    id: 'cyber_theme',
    name: 'Cyberpunk Theme 🎨',
    desc: 'Unlock futuristic neon accent styles.',
    cost: 100,
    currency: 'coins',
  },
  {
    id: 'legendary_title',
    name: 'Code Wizard Title 👑',
    desc: 'Flex a rare title on your Profile card.',
    cost: 5,
    currency: 'gems',
  },
];

export default function ShopScreen() {
  const navigation = useNavigation<any>();
  const [wallet, setWallet] = useState({ coins: 0, gems: 0, health: 100, id: '' });
  const [activeTab, setActiveTab] = useState<TabName>('Shop');

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('id, coins, gems, health')
      .eq('id', user.id)
      .single();

    if (data) {
      setWallet({
        coins: data.coins || 0,
        gems: data.gems || 0,
        health: data.health || 100,
        id: user.id,
      });
    }
  };

  const buyItem = async (item: typeof SHOP_ITEMS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const currentBalance = item.currency === 'coins' ? wallet.coins : wallet.gems;

    if (currentBalance < item.cost) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Insufficient Balance 💀', `You need ${item.cost - currentBalance} more ${item.currency} to buy this!`);
      return;
    }

    let newCoins = wallet.coins;
    let newGems = wallet.gems;
    let newHealth = wallet.health;

    if (item.currency === 'coins') {
      newCoins -= item.cost;
    } else {
      newGems -= item.cost;
    }

    if (item.id === 'health_potion') {
      newHealth = Math.min(100, newHealth + 50);
    }

    const { error } = await supabase
      .from('users')
      .update({ coins: newCoins, gems: newGems, health: newHealth })
      .eq('id', wallet.id);

    if (error) {
      Alert.alert('Error', 'Could not process purchase.');
      return;
    }

    setWallet({ ...wallet, coins: newCoins, gems: newGems, health: newHealth });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('PURCHASE SUCCESSFUL! 🎉', `You acquired ${item.name}!`);
  };

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'Home') navigation.navigate('Home');
    if (tab === 'Profile') navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Navigation Header */}
        <View style={styles.headerRow}>
          <AnimatedButton
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </AnimatedButton>
          <Text style={styles.headerTitle}>Ascend Shop 🛒</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Wallet Balance Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletItem}>
            <Text style={styles.walletEmoji}>🪙</Text>
            <Text style={styles.walletValue}>{wallet.coins}</Text>
            <Text style={styles.walletLabel}>Coins</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.walletItem}>
            <Text style={styles.walletEmoji}>💎</Text>
            <Text style={styles.walletValue}>{wallet.gems}</Text>
            <Text style={styles.walletLabel}>Gems</Text>
          </View>
        </View>

        {/* Shop Items Section */}
        <Text style={styles.sectionTitle}>Available Loot ✨</Text>

        {SHOP_ITEMS.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
            </View>

            <AnimatedButton 
              style={styles.buyButton}
              onPress={() => buyItem(item)}
            >
              <Text style={styles.buyButtonText}>
                {item.cost} {item.currency === 'coins' ? '🪙' : '💎'}
              </Text>
            </AnimatedButton>
          </View>
        ))}
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
  walletCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  walletItem: {
    alignItems: 'center',
  },
  walletEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  walletValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  buyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    ...SHADOWS.button,
  },
  buyButtonText: {
    color: COLORS.textLight,
    fontWeight: '900',
    fontSize: 14,
  },
});