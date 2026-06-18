import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';
import * as Haptics from 'expo-haptics';

interface Task {
  id: string;
  text: string;
  order: number;
}

const TASKS: Task[] = [
  { id: '1', text: 'Pack notebook', order: 1 },
  { id: '2', text: 'Drink water', order: 2 },
  { id: '3', text: 'Do homework', order: 3 },
  { id: '4', text: 'Prepare bag', order: 4 },
];

export default function BackpackOasisScreen() {
  const router = useRouter();
  const { startSession, endSession, clearSession, rewards } = useGameStore();
  const { child } = useChildStore();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledTasks, setShuffledTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [correctSequence, setCorrectSequence] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    shuffleTasks();
  }, []);

  const shuffleTasks = () => {
    const shuffled = [...TASKS].sort(() => Math.random() - 0.5);
    setShuffledTasks(shuffled);
    setSelectedTasks([]);
    setCorrectSequence(0);
    setAttempts(0);
  };

  const startGame = () => {
    startSession('BACKPACK_OASIS');
    setIsPlaying(true);
    setStartTime(Date.now());
    shuffleTasks();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTaskSelect = (task: Task) => {
    if (!isPlaying) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const expectedOrder = selectedTasks.length + 1;
    
    if (task.order === expectedOrder) {
      // Correct selection
      setSelectedTasks((prev) => [...prev, task]);
      setCorrectSequence((prev) => prev + 1);
      
      // Check if game is complete
      if (selectedTasks.length + 1 === TASKS.length) {
        endGame();
      }
    } else {
      // Wrong selection
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setAttempts((prev) => prev + 1);
      setSelectedTasks([]);
      setCorrectSequence(0);
    }
  };

  const endGame = async () => {
    setIsPlaying(false);
    setGameOver(true);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    setCompletionTime(duration);

    const metrics = {
      correctSequence,
      completionTime: duration,
    };

    endSession(metrics);

    // Save to database
    if (child) {
      const sessionId = Date.now().toString();
      await databaseService.insert('session', {
        id: sessionId,
        child_id: child.id,
        game_type: 'BACKPACK_OASIS',
        duration: Math.round(duration / 1000),
        synced: 0,
        created_at: Date.now(),
      });

      await databaseService.insert('game_metrics', {
        id: Date.now().toString() + '_metrics',
        session_id: sessionId,
        child_id: child.id,
        game_type: 'BACKPACK_OASIS',
        correct_sequence: correctSequence,
        completion_time: duration,
        synced: 0,
        created_at: Date.now(),
      });

      // Award rewards
      if (correctSequence === TASKS.length && attempts === 0) {
        rewards.addWaterDrop();
        rewards.addFlower();
      } else if (correctSequence === TASKS.length) {
        rewards.addWaterDrop();
      }
    }
  };

  const handleBack = () => {
    clearSession();
    router.back();
  };

  const handlePlayAgain = () => {
    setGameOver(false);
    shuffleTasks();
    startGame();
  };

  if (gameOver) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Game Over!</Text>
        <Text style={styles.stat}>Correct Sequence: {correctSequence}/{TASKS.length}</Text>
        <Text style={styles.stat}>Attempts: {attempts}</Text>
        <Text style={styles.stat}>Time: {Math.round(completionTime / 1000)}s</Text>
        
        <TouchableOpacity style={styles.button} onPress={handlePlayAgain}>
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleBack}>
          <Text style={styles.buttonText}>Back to Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>
          Progress: {selectedTasks.length}/{TASKS.length}
        </Text>
      </View>

      <Text style={styles.title}>Organize Your Tasks</Text>
      <Text style={styles.instruction}>
        Arrange the tasks in the correct order:
      </Text>
      <Text style={styles.instruction}>
        1. Pack notebook → 2. Drink water → 3. Do homework → 4. Prepare bag
      </Text>

      <View style={styles.selectedContainer}>
        <Text style={styles.sectionTitle}>Your Order:</Text>
        {selectedTasks.length === 0 ? (
          <Text style={styles.emptyText}>Tap tasks below in order</Text>
        ) : (
          <View style={styles.selectedList}>
            {selectedTasks.map((task, index) => (
              <View key={task.id} style={styles.selectedItem}>
                <Text style={styles.selectedItemText}>{index + 1}. {task.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.tasksContainer}>
        <Text style={styles.sectionTitle}>Available Tasks:</Text>
        {shuffledTasks
          .filter((task) => !selectedTasks.find((s) => s.id === task.id))
          .map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskButton}
              onPress={() => handleTaskSelect(task)}
              disabled={!isPlaying}
            >
              <Text style={styles.taskButtonText}>{task.text}</Text>
            </TouchableOpacity>
          ))}
      </View>

      {!isPlaying && (
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      )}
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
  progress: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 16,
    color: '#66BB6A',
    textAlign: 'center',
    marginBottom: 5,
  },
  selectedContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    minHeight: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  selectedList: {
    gap: 8,
  },
  selectedItem: {
    backgroundColor: '#C8E6C9',
    padding: 12,
    borderRadius: 8,
  },
  selectedItemText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  tasksContainer: {
    gap: 10,
    marginBottom: 20,
  },
  taskButton: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  taskButtonText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stat: {
    fontSize: 18,
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: '#66BB6A',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
