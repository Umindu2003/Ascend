import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
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
      Alert.alert('Bro is broke! 💀', `You need ${item.cost - currentBalance} more ${item.currency} to buy this!`);
      return;
    }

    // Process the purchase mathematically
    let newCoins = wallet.coins;
    let newGems = wallet.gems;
    let newHealth = wallet.health;

    if (item.currency === 'coins') {
      newCoins -= item.cost;
    } else {
      newGems -= item.cost;
    }

    // Special item effect: Health Potion heals you!
    if (item.id === 'health_potion') {
      newHealth = Math.min(100, newHealth + 50);
    }

    // Save to Supabase ☁️
    const { error } = await supabase
      .from('users')
      .update({ coins: newCoins, gems: newGems, health: newHealth })
      .eq('id', wallet.id);

    if (error) {
      Alert.alert('Error', 'Could not process purchase.');
      return;
    }

    // Update local state
    setWallet({ ...wallet, coins: newCoins, gems: newGems, health: newHealth });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('PURCHASE SUCCESSFUL! 🎉', `You acquired the ${item.name}!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔙 Back Button & Title */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Ascend Shop 🛒</Text>
      </View>

      {/* 💰 Wallet Card (Glassmorphism vibes) */}
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

      {/* 🛍️ Shop Items List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.sectionTitle}>Available Loot ✨</Text>

        {SHOP_ITEMS.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
            </View>

            <TouchableOpacity 
              style={styles.buyButton}
              onPress={() => buyItem(item)}
            >
              <Text style={styles.buyButtonText}>
                {item.cost} {item.currency === 'coins' ? '🪙' : '💎'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    gap: 16,
  },
  backButton: {
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
    fontSize: 28,
    fontWeight: '900',
    color: '#111',
  },
  walletCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  walletItem: {
    alignItems: 'center',
  },
  walletEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  walletValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#EBEBEB',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  buyButton: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  buyButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
});