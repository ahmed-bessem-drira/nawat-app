import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/stores/gameStore';

const VILLAGES = [
  {
    id: 'noise-souk',
    name: 'Noise Souk',
    description: 'Attention Training',
    emoji: '🎯',
    color: '#FF8A65',
    gameType: 'NOISE_SOUK',
  },
  {
    id: 'gate-of-patience',
    name: 'Gate of Patience',
    description: 'Impulse Control',
    emoji: '🚦',
    color: '#4FC3F7',
    gameType: 'GATE_OF_PATIENCE',
  },
  {
    id: 'cloud-valley',
    name: 'Cloud Valley',
    description: 'Calm & Relaxation',
    emoji: '☁️',
    color: '#81C784',
    gameType: 'CLOUD_VALLEY',
  },
  {
    id: 'backpack-oasis',
    name: 'Backpack Oasis',
    description: 'Organization',
    emoji: '🎒',
    color: '#FFD54F',
    gameType: 'BACKPACK_OASIS',
  },
];

export default function VillageMapScreen() {
  const router = useRouter();
  const { rewards } = useGameStore();

  const handleVillagePress = (village: typeof VILLAGES[0]) => {
    router.push(`/${village.id}`);
  };

  const handleGardenPress = () => {
    router.push('/focus-garden');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Choose Your Adventure</Text>
      <Text style={styles.subtitle}>Help Nawat travel through the villages!</Text>

      <View style={styles.villagesContainer}>
        {VILLAGES.map((village) => (
          <TouchableOpacity
            key={village.id}
            style={[styles.villageCard, { backgroundColor: village.color }]}
            onPress={() => handleVillagePress(village)}
            activeOpacity={0.8}
          >
            <Text style={styles.villageEmoji}>{village.emoji}</Text>
            <Text style={styles.villageName}>{village.name}</Text>
            <Text style={styles.villageDescription}>{village.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.gardenButton} onPress={handleGardenPress}>
        <Text style={styles.gardenEmoji}>🌸</Text>
        <Text style={styles.gardenText}>Focus Garden</Text>
        <View style={styles.rewardsBadge}>
          <Text style={styles.rewardsText}>{rewards.waterDrops + rewards.flowers + rewards.trees}</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#66BB6A',
    marginBottom: 30,
    textAlign: 'center',
  },
  villagesContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 30,
  },
  villageCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  villageEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  villageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  villageDescription: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  gardenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#4CAF50',
    position: 'relative',
  },
  gardenEmoji: {
    fontSize: 32,
    marginRight: 10,
  },
  gardenText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  rewardsBadge: {
    position: 'absolute',
    right: 15,
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
