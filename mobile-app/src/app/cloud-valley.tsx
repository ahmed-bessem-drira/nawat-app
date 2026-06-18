import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface Point {
  x: number;
  y: number;
}

const PATH_POINTS: Point[] = [
  { x: 50, y: 100 },
  { x: 100, y: 150 },
  { x: 150, y: 150 },
  { x: 200, y: 100 },
  { x: 250, y: 150 },
  { x: 300, y: 200 },
  { x: 250, y: 250 },
  { x: 200, y: 300 },
  { x: 150, y: 250 },
  { x: 100, y: 200 },
  { x: 50, y: 150 },
  { x: 50, y: 100 },
];

export default function CloudValleyScreen() {
  const router = useRouter();
  const { startSession, endSession, clearSession, rewards } = useGameStore();
  const { child } = useChildStore();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [userPath, setUserPath] = useState<Point[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [smoothness, setSmoothness] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);
  const [pathDeviation, setPathDeviation] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [calmScore, setCalmScore] = useState(50);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isPlaying,
      onMoveShouldSetPanResponder: () => isPlaying,
      onPanResponderMove: (evt) => {
        if (!isPlaying) return;
        
        const point = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
        setUserPath((prev) => [...prev, point]);
        
        // Calculate accuracy
        const accuracy = calculateAccuracy(userPath, PATH_POINTS);
        setAccuracy(accuracy);
      },
      onPanResponderRelease: () => {
        if (userPath.length > PATH_POINTS.length * 0.8) {
          endGame();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const startGame = () => {
    startSession('CLOUD_VALLEY');
    setIsPlaying(true);
    setStartTime(Date.now());
    setUserPath([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const calculateAccuracy = (userPoints: Point[], targetPoints: Point[]): number => {
    if (userPoints.length === 0) return 0;
    
    let totalDeviation = 0;
    let matches = 0;
    
    for (const userPoint of userPoints) {
      let minDistance = Infinity;
      for (const targetPoint of targetPoints) {
        const distance = Math.sqrt(
          Math.pow(userPoint.x - targetPoint.x, 2) +
          Math.pow(userPoint.y - targetPoint.y, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
      
      if (minDistance < 30) {
        matches++;
      }
      totalDeviation += minDistance;
    }
    
    const avgDeviation = totalDeviation / userPoints.length;
    setPathDeviation(avgDeviation);
    
    return Math.round((matches / userPoints.length) * 100);
  };

  const calculateSmoothness = (points: Point[]): number => {
    if (points.length < 2) return 100;
    
    let totalAngleChange = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const angle1 = Math.atan2(points[i].y - points[i-1].y, points[i].x - points[i-1].x);
      const angle2 = Math.atan2(points[i+1].y - points[i].y, points[i+1].x - points[i].x);
      totalAngleChange += Math.abs(angle2 - angle1);
    }
    
    const avgAngleChange = totalAngleChange / (points.length - 1);
    const smoothness = Math.max(0, 100 - avgAngleChange * 10);
    return Math.round(smoothness);
  };

  const endGame = async () => {
    setIsPlaying(false);
    setGameOver(true);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    setCompletionTime(duration);
    
    const smooth = calculateSmoothness(userPath);
    setSmoothness(smooth);
    
    // Calculate calm score based on smoothness and accuracy
    const calm = Math.round((accuracy + smooth) / 2);
    setCalmScore(calm);

    const metrics = {
      accuracy,
      smoothness: smooth,
      completionTime: duration,
      pathDeviation,
      calmScore: calm,
    };

    endSession(metrics);

    // Save to database
    if (child) {
      const sessionId = Date.now().toString();
      await databaseService.insert('session', {
        id: sessionId,
        child_id: child.id,
        game_type: 'CLOUD_VALLEY',
        duration: Math.round(duration / 1000),
        synced: 0,
        created_at: Date.now(),
      });

      await databaseService.insert('game_metrics', {
        id: Date.now().toString() + '_metrics',
        session_id: sessionId,
        child_id: child.id,
        game_type: 'CLOUD_VALLEY',
        accuracy,
        smoothness: smooth,
        completion_time: duration,
        path_deviation: pathDeviation,
        calm_score: calm,
        synced: 0,
        created_at: Date.now(),
      });

      // Award rewards
      if (accuracy > 70) {
        rewards.addWaterDrop();
      }
      if (calm > 80) {
        rewards.addFlower();
      }
    }
  };

  const handleBack = () => {
    clearSession();
    router.back();
  };

  const handlePlayAgain = () => {
    setGameOver(false);
    setUserPath([]);
    setAccuracy(0);
    setSmoothness(0);
    setCompletionTime(0);
    setPathDeviation(0);
    setCalmScore(50);
    startGame();
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.message}>We need camera access for the tracing activity.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Great Job!</Text>
        <Text style={styles.stat}>Accuracy: {accuracy}%</Text>
        <Text style={styles.stat}>Smoothness: {smoothness}%</Text>
        <Text style={styles.stat}>Calm Score: {calmScore}</Text>
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

  // Generate SVG path string
  const pathString = PATH_POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  // Generate user path string
  const userPathString = userPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.accuracy}>Accuracy: {accuracy}%</Text>
      </View>

      <Text style={styles.instruction}>
        {isPlaying ? 'Trace the dashed path with your finger' : 'Press Start to begin tracing'}
      </Text>

      <View style={styles.cameraContainer} {...panResponder.panHandlers}>
        <CameraView style={styles.camera} facing="back">
          <View style={styles.overlay}>
            <Svg style={styles.svg}>
              {/* Target path */}
              <Path
                d={pathString}
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth={4}
                strokeDasharray="10,5"
                fill="none"
              />
              
              {/* User path */}
              {userPath.length > 1 && (
                <Path
                  d={userPathString}
                  stroke="#4CAF50"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
              
              {/* Target points */}
              {PATH_POINTS.map((point, index) => (
                <Circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={8}
                  fill="rgba(255, 255, 255, 0.6)"
                />
              ))}
            </Svg>
          </View>
        </CameraView>
      </View>

      {!isPlaying && (
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Tracing</Text>
        </TouchableOpacity>
      )}
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
  accuracy: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '600',
  },
  instruction: {
    fontSize: 16,
    color: '#66BB6A',
    textAlign: 'center',
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  svg: {
    flex: 1,
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#66BB6A',
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
