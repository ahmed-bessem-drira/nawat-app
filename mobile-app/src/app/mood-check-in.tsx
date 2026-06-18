import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';
import * as Haptics from 'expo-haptics';

const MOODS: { mood: string; emoji: string; color: string }[] = [
  { mood: 'CALM', emoji: '😌', color: '#81C784' },
  { mood: 'HAPPY', emoji: '😊', color: '#FFD54F' },
  { mood: 'TIRED', emoji: '😴', color: '#90A4AE' },
  { mood: 'ANGRY', emoji: '😠', color: '#E57373' },
  { mood: 'SAD', emoji: '😢', color: '#64B5F6' },
  { mood: 'EXCITED', emoji: '🤩', color: '#FF8A65' },
];

export default function MoodCheckInScreen() {
  const router = useRouter();
  const { child, setMood } = useChildStore();

  const handleMoodSelect = async (mood: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMood(mood);

    // Save mood to database
    if (child) {
      try {
        // Ensure child exists in database first
        const existingChildren = await databaseService.query('child', 'id = ?', [child.id]);
        if (existingChildren.length === 0) {
          await databaseService.insert('child', {
            id: child.id,
            nickname: child.nickname,
            avatar: child.avatar,
            language: child.language,
            created_at: new Date(child.createdAt).getTime(),
          });
        }

        await databaseService.insert('mood_entry', {
          id: Date.now().toString(),
          child_id: child.id,
          mood,
          synced: 0,
          created_at: Date.now(),
        });
      } catch (error) {
        console.error('Error saving mood:', error);
      }
    }

    router.replace('/village-map');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>How do you feel today?</Text>
      <Text style={styles.subtitle}>Select how you are feeling right now</Text>

      <View style={styles.moodsContainer}>
        {MOODS.map((item) => (
          <TouchableOpacity
            key={item.mood}
            style={[styles.moodCard, { backgroundColor: item.color }]}
            onPress={() => handleMoodSelect(item.mood)}
            activeOpacity={0.8}
          >
            <Text style={styles.moodEmoji}>{item.emoji}</Text>
            <Text style={styles.moodText}>{item.mood}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  moodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  moodCard: {
    width: 140,
    height: 140,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  moodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
});
