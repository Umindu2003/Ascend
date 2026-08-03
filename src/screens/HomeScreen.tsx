import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import MissionCard from '../components/MissionCard';
import AddMissionModal from '../components/AddMissionModal';

export default function HomeScreen() {
  // 🎯 Missions State – now empty, filled by Supabase
  const [missions, setMissions] = useState<any[]>([]);
  // 📝 Modal State
  const [isModalVisible, setModalVisible] = useState(false);

  // 🔄 Load missions when screen opens
  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .order('id', { ascending: false }); // newest first

    if (error) {
      console.error('Supabase Fetch Error:', error);
    } else if (data) {
      // Map DB columns to component props
      const formattedMissions = data.map((m) => ({
        id: m.id,
        title: m.title,
        xp: m.xp_reward,
        isCompleted: m.is_completed,
      }));
      setMissions(formattedMissions);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🏆 Player Stats Header */}
      <View style={styles.statsContainer}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LEVEL 7 ⚡</Text>
        </View>

        <View style={styles.comboBadge}>
          <Text style={styles.comboText}>🔥 17 Days</Text>
        </View>
      </View>

      {/* 🟢 XP Progress */}
      <View style={styles.xpContainer}>
        <Text style={styles.xpLabel}>XP</Text>

        <View style={styles.xpTrack}>
          <View style={styles.xpFill} />
        </View>

        <Text style={styles.xpNumbers}>820 / 1000</Text>
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
              onComplete={() => {
                setMissions((prevMissions) =>
                  prevMissions.map((m) =>
                    m.id === mission.id
                      ? { ...m, isCompleted: !m.isCompleted }
                      : m
                  )
                );
              }}
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

      {/* 📝 Add Mission Modal */}
      <AddMissionModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={async (title, xp) => {
          // 1. Insert into Supabase
          const { data, error } = await supabase
            .from('missions')
            .insert([{ title, xp_reward: xp, is_completed: false }])
            .select();

          if (error) {
            console.error('Supabase Insert Error:', error);
          } else if (data) {
            // 2. Format the returned row and add to the top of the list
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
    width: '82%',
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

  // 🟢 Floating Action Button
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