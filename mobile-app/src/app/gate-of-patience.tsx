import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';
import * as Haptics from 'expo-haptics';

interface Stimulus {
  id: string;
  color: 'green' | 'red' | 'yellow';
  showTime: number;
  waitTime?: number;
}

const GAME_DURATION = 60; // seconds
const STIMULUS_INTERVAL = 2000; // ms

export default function GateOfPatienceScreen() {
  const router = useRouter();
  const { startSession, endSession, clearSession, rewards } = useGameStore();
  const { child } = useChildStore();
  
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [currentStimulus, setCurrentStimulus] = useState<Stimulus | null>(null);
  const [impulsiveResponses, setImpulsiveResponses] = useState(0);
  const [correctInhibition, setCorrectInhibition] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('Get ready...');
  
  const stimulusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stimulusStartTimeRef = useRef<number>(0);

  useEffect(() => {
    startSession('GATE_OF_PATIENCE');
    setIsPlaying(true);
    startGame();

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (stimulusIntervalRef.current) clearInterval(stimulusIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const startGame = () => {
    setTimeout(() => {
      showNextStimulus();
    }, 2000);

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

  const showNextStimulus = () => {
    const colors: Array<'green' | 'red' | 'yellow'> = ['green', 'red', 'yellow'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const stimulus: Stimulus = {
      id: Date.now().toString(),
      color,
      showTime: Date.now(),
      waitTime: color === 'yellow' ? 1000 + Math.random() * 1000 : undefined,
    };

    setCurrentStimulus(stimulus);
    stimulusStartTimeRef.current = Date.now();

    if (color === 'yellow') {
      setMessage('Wait...');
    } else if (color === 'green') {
      setMessage('Tap NOW!');
    } else {
      setMessage('Do NOT tap!');
    }

    // Hide stimulus after appropriate time
    const hideTime = color === 'yellow' ? (stimulus.waitTime || 2000) : 1500;
    setTimeout(() => {
      setCurrentStimulus(null);
      setMessage('Get ready...');
      
      // Show next stimulus
      if (isPlaying && !gameOver) {
        stimulusIntervalRef.current = setTimeout(showNextStimulus, STIMULUS_INTERVAL);
      }
    }, hideTime);
  };

  const handleTap = () => {
    if (!currentStimulus) {
      // Tapped when no stimulus - impulsive
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setImpulsiveResponses((prev) => prev + 1);
      setScore((prev) => Math.max(0, prev - 5));
      setMessage('Too early! Wait for the signal.');
      return;
    }

    const reactionTime = Date.now() - stimulusStartTimeRef.current;

    if (currentStimulus.color === 'green') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScore((prev) => prev + 10);
      setReactionTimes((prev) => [...prev, reactionTime]);
      setMessage('Great job!');
      setCurrentStimulus(null);
    } else if (currentStimulus.color === 'red') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setScore((prev) => Math.max(0, prev - 5));
      setImpulsiveResponses((prev) => prev + 1);
      setMessage('You should not have tapped!');
      setCurrentStimulus(null);
    } else if (currentStimulus.color === 'yellow') {
      if (reactionTime > (currentStimulus.waitTime || 1000)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setScore((prev) => prev + 15);
        setCorrectInhibition((prev) => prev + 1);
        setReactionTimes((prev) => [...prev, reactionTime]);
        setMessage('Perfect patience!');
        setCurrentStimulus(null);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setScore((prev) => Math.max(0, prev - 5));
        setImpulsiveResponses((prev) => prev + 1);
        setMessage('Too early! Wait longer.');
        setCurrentStimulus(null);
      }
    }
  };

  const endGame = async () => {
    cleanup();
    setIsPlaying(false);
    setGameOver(true);

    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0;

    const metrics = {
      impulsiveResponses,
      correctInhibition,
      reactionTime: avgReactionTime,
    };

    endSession(metrics);

    // Save to database
    if (child) {
      const sessionId = Date.now().toString();
      await databaseService.insert('session', {
        id: sessionId,
        child_id: child.id,
        game_type: 'GATE_OF_PATIENCE',
        duration: GAME_DURATION,
        synced: 0,
        created_at: Date.now(),
      });

      await databaseService.insert('game_metrics', {
        id: Date.now().toString() + '_metrics',
        session_id: sessionId,
        child_id: child.id,
        game_type: 'GATE_OF_PATIENCE',
        impulsive_responses: impulsiveResponses,
        correct_inhibition: correctInhibition,
        reaction_time: avgReactionTime,
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
    setImpulsiveResponses(0);
    setCorrectInhibition(0);
    setReactionTimes([]);
    setIsPlaying(true);
    setMessage('Get ready...');
    startGame();
  };

  if (gameOver) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Game Over!</Text>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.stat}>Correct Inhibition: {correctInhibition}</Text>
        <Text style={styles.stat}>Impulsive Responses: {impulsiveResponses}</Text>
        
        <TouchableOpacity style={styles.button} onPress={handlePlayAgain}>
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleBack}>
          <Text style={styles.buttonText}>Back to Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const colorMap = {
    green: '#4CAF50',
    red: '#F44336',
    yellow: '#FFC107',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.timer}>{timeLeft}s</Text>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity 
        style={styles.gameArea} 
        onPress={handleTap}
        activeOpacity={0.9}
      >
        {currentStimulus && (
          <View style={[
            styles.stimulus,
            { backgroundColor: colorMap[currentStimulus.color] },
          ]} />
        )}
      </TouchableOpacity>

      <View style={styles.instructions}>
        <Text style={styles.instruction}>🟢 Green: Tap immediately</Text>
        <Text style={styles.instruction}>🔴 Red: Do NOT tap</Text>
        <Text style={styles.instruction}>🟡 Yellow: Wait, then tap</Text>
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
  message: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 30,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
  },
  stimulus: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  instructions: {
    gap: 10,
  },
  instruction: {
    fontSize: 16,
    color: '#66BB6A',
    textAlign: 'center',
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
