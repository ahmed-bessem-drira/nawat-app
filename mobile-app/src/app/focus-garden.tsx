import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { syncService } from '@/services/sync.service';
import { localAIService } from '@/services/localAI.service';
import { databaseService } from '@/services/database.service';

export default function FocusGardenScreen() {
  const router = useRouter();
  const { rewards } = useGameStore();
  const { child, currentMood } = useChildStore();
  const [recommendations, setRecommendations] = React.useState<any[]>([]);
  const [encouragement, setEncouragement] = React.useState('');

  React.useEffect(() => {
    loadRecommendations();
    generateEncouragement();
  }, []);

  const loadRecommendations = async () => {
    if (child) {
      const recs = await syncService.getLocalRecommendations(child.id);
      setRecommendations(recs);
    }
  };

  const generateEncouragement = () => {
    if (currentMood) {
      const message = localAIService.getEncouragementMessage(currentMood, 'good');
      setEncouragement(message);
    }
  };

  const handleSync = async () => {
    await syncService.syncData();
    await loadRecommendations();
  };

  const handleResetRewards = () => {
    rewards.resetRewards();
  };

  const getGardenLevel = () => {
    const total = rewards.waterDrops + rewards.flowers * 5 + rewards.trees * 10;
    if (total < 10) return 'Seedling';
    if (total < 30) return 'Sprout';
    if (total < 60) return 'Growing';
    if (total < 100) return 'Blooming';
    return 'Garden Master';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Focus Garden</Text>
        <TouchableOpacity onPress={handleSync}>
          <Text style={styles.syncButton}>Sync</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.levelCard}>
        <Text style={styles.levelEmoji}>🌱</Text>
        <Text style={styles.levelText}>{getGardenLevel()}</Text>
        <Text style={styles.levelSubtext}>Keep growing your garden!</Text>
      </View>

      <View style={styles.encouragementCard}>
        <Text style={styles.encouragementText}>{encouragement}</Text>
      </View>

      <View style={styles.rewardsContainer}>
        <Text style={styles.sectionTitle}>Your Rewards</Text>
        
        <View style={styles.rewardRow}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardEmoji}>💧</Text>
            <Text style={styles.rewardCount}>{rewards.waterDrops}</Text>
            <Text style={styles.rewardLabel}>Water Drops</Text>
          </View>
          
          <View style={styles.rewardItem}>
            <Text style={styles.rewardEmoji}>🌸</Text>
            <Text style={styles.rewardCount}>{rewards.flowers}</Text>
            <Text style={styles.rewardLabel}>Flowers</Text>
          </View>
          
          <View style={styles.rewardItem}>
            <Text style={styles.rewardEmoji}>🌳</Text>
            <Text style={styles.rewardCount}>{rewards.trees}</Text>
            <Text style={styles.rewardLabel}>Trees</Text>
          </View>
        </View>
      </View>

      {recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {recommendations.slice(0, 3).map((rec) => (
            <View key={rec.id} style={styles.recommendationCard}>
              <Text style={styles.recommendationText}>{rec.encouragement}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.gardenVisual}>
        <Text style={styles.gardenTitle}>Your Garden</Text>
        <View style={styles.gardenGrid}>
          {/* Water drops */}
          {Array.from({ length: Math.min(rewards.waterDrops, 10) }).map((_, i) => (
            <Text key={`water-${i}`} style={styles.gardenItem}>💧</Text>
          ))}
          
          {/* Flowers */}
          {Array.from({ length: Math.min(rewards.flowers, 5) }).map((_, i) => (
            <Text key={`flower-${i}`} style={styles.gardenItem}>🌸</Text>
          ))}
          
          {/* Trees */}
          {Array.from({ length: Math.min(rewards.trees, 3) }).map((_, i) => (
            <Text key={`tree-${i}`} style={styles.gardenItem}>🌳</Text>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={handleResetRewards}>
        <Text style={styles.resetButtonText}>Reset Garden (Dev Only)</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  syncButton: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  levelSubtext: {
    fontSize: 14,
    color: '#66BB6A',
  },
  encouragementCard: {
    backgroundColor: '#C8E6C9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  encouragementText: {
    fontSize: 18,
    color: '#2E7D32',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  rewardsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  rewardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardEmoji: {
    fontSize: 40,
    marginBottom: 5,
  },
  rewardCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#66BB6A',
  },
  recommendationsContainer: {
    marginBottom: 20,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD54F',
  },
  recommendationText: {
    fontSize: 14,
    color: '#2E7D32',
  },
  gardenVisual: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  gardenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
    textAlign: 'center',
  },
  gardenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  gardenItem: {
    fontSize: 32,
  },
  resetButton: {
    backgroundColor: '#FF5722',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
