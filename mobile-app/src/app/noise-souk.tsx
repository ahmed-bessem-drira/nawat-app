import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';
import * as Haptics from 'expo-haptics';

interface GameObject {
  id: string;
  x: number;
  y: number;
  isTarget: boolean;
  color: string;
}

const GAME_DURATION = 60; // seconds
const SPAWN_INTERVAL = 1000; // ms

export default function NoiseSoukScreen() {
  const router = useRouter();
  const { startSession, endSession, clearSession, rewards } = useGameStore();
  const { child } = useChildStore();
  
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [correctHits, setCorrectHits] = useState(0);
  const [omissions, setOmissions] = useState(0);
  const [commissions, setCommissions] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [targetSpawnTime, setTargetSpawnTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startSession('NOISE_SOUK');
    setIsPlaying(true);
    startGame();

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const startGame = () => {
    spawnIntervalRef.current = setInterval(() => {
      spawnObject();
    }, SPAWN_INTERVAL);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const spawnObject = () => {
    const isTarget = Math.random() > 0.4; // 60% targets
    const newObject: GameObject = {
      id: Date.now().toString(),
      x: Math.random() * 200 + 50,
      y: Math.random() * 400 + 100,
      isTarget,
      color: isTarget ? '#4CAF50' : '#FF5722',
    };

    setObjects((prev) => [...prev, newObject]);

    if (isTarget) {
      setTargetSpawnTime(Date.now());
    }

    // Remove object after 2 seconds if not tapped
    setTimeout(() => {
      setObjects((prev) => {
        const obj = prev.find((o) => o.id === newObject.id);
        if (obj && obj.isTarget && !gameOver) {
          setOmissions((prev) => prev + 1);
        }
        return prev.filter((o) => o.id !== newObject.id);
      });
    }, 2000);
  };

  const handleObjectTap = (obj: GameObject) => {
    const reactionTime = Date.now() - targetSpawnTime;
    
    if (obj.isTarget) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScore((prev) => prev + 10);
      setCorrectHits((prev) => prev + 1);
      setReactionTimes((prev) => [...prev, reactionTime]);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setScore((prev) => Math.max(0, prev - 5));
      setCommissions((prev) => prev + 1);
    }

    setObjects((prev) => prev.filter((o) => o.id !== obj.id));
  };

  const endGame = async () => {
    cleanup();
    setIsPlaying(false);
    setGameOver(true);

    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0;

    const reactionTimeVariability = reactionTimes.length > 1
      ? Math.sqrt(reactionTimes.reduce((sum, rt) => sum + Math.pow(rt - avgReactionTime, 2), 0) / reactionTimes.length)
      : 0;

    const metrics = {
      omissions,
      commissions,
      reactionTime: avgReactionTime,
      reactionTimeVariability,
    };

    endSession(metrics);

    // Save to database
    if (child) {
      const sessionId = Date.now().toString();
      await databaseService.insert('session', {
        id: sessionId,
        child_id: child.id,
        game_type: 'NOISE_SOUK',
        duration: GAME_DURATION,
        synced: 0,
        created_at: Date.now(),
      });

      await databaseService.insert('game_metrics', {
        id: Date.now().toString() + '_metrics',
        session_id: sessionId,
        child_id: child.id,
        game_type: 'NOISE_SOUK',
        omissions,
        commissions,
        reaction_time: avgReactionTime,
        reaction_time_variability: reactionTimeVariability,
        synced: 0,
        created_at: Date.now(),
      });

      // Award rewards
      if (score > 50) {
        rewards.addWaterDrop();
      }
      if (score > 100) {
        rewards.addFlower();
      }
    }
  };

  const handleBack = () => {
    cleanup();
    clearSession();
    router.back();
  };

  const handlePlayAgain = () => {
    setGameOver(false);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setObjects([]);
    setCorrectHits(0);
    setOmissions(0);
    setCommissions(0);
    setReactionTimes([]);
    setIsPlaying(true);
    startGame();
  };

  if (gameOver) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Game Over!</Text>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.stat}>Correct Hits: {correctHits}</Text>
        <Text style={styles.stat}>Omissions: {omissions}</Text>
        <Text style={styles.stat}>Commissions: {commissions}</Text>
        
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.timer}>{timeLeft}s</Text>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      <Text style={styles.instruction}>Tap the GREEN circles!</Text>
      <Text style={styles.instruction}>Ignore the ORANGE circles!</Text>

      <View style={styles.gameArea}>
        {objects.map((obj) => (
          <TouchableOpacity
            key={obj.id}
            style={[
              styles.gameObject,
              { 
                left: obj.x, 
                top: obj.y, 
                backgroundColor: obj.color,
              },
            ]}
            onPress={() => handleObjectTap(obj)}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
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
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  score: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '600',
  },
  instruction: {
    fontSize: 16,
    color: '#66BB6A',
    textAlign: 'center',
    marginBottom: 5,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  gameObject: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 20,
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
