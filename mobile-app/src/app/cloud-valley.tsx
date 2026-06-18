import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  ImageBackground,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';
import { getTranslation } from '@/i18n/translations';
import { Language } from '../shared/types';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH > 600;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// Game Screens
type GameScreen = 'PERMISSION' | 'GET_READY' | 'GAMEPLAY' | 'RESULTS';

interface CalmMoveStep {
  id: number;
  instructionKey: string;
  iconType: 'hand' | 'both_hands' | 'shoulders' | 'head' | 'balance' | 'breath';
  durationMs: number;
}

// Level configs
interface LevelConfig {
  nameKey: string;
  descriptionKey: string;
  steps: CalmMoveStep[];
  inhaleDuration: number;
  holdDuration: number;
  exhaleDuration: number;
  targetScore: number;
}

const LEVELS: Record<number, LevelConfig> = {
  1: {
    nameKey: 'Initiation',
    descriptionKey: '3 simple calm moves',
    steps: [
      { id: 1, instructionKey: 'cloudValley.raiseOneHand', iconType: 'hand', durationMs: 5000 },
      { id: 2, instructionKey: 'cloudValley.raiseBothHands', iconType: 'both_hands', durationMs: 5000 },
      { id: 4, instructionKey: 'cloudValley.deepBreath', iconType: 'breath', durationMs: 6000 },
    ],
    inhaleDuration: 3000,
    holdDuration: 0,
    exhaleDuration: 3000,
    targetScore: 70,
  },
  2: {
    nameKey: 'Calm Master',
    descriptionKey: '4 balanced calm moves',
    steps: [
      { id: 1, instructionKey: 'cloudValley.raiseOneHand', iconType: 'hand', durationMs: 6000 },
      { id: 2, instructionKey: 'cloudValley.raiseBothHands', iconType: 'both_hands', durationMs: 6000 },
      { id: 3, instructionKey: 'cloudValley.touchShoulders', iconType: 'shoulders', durationMs: 6000 },
      { id: 4, instructionKey: 'cloudValley.deepBreath', iconType: 'breath', durationMs: 8000 },
    ],
    inhaleDuration: 4000,
    holdDuration: 2000,
    exhaleDuration: 4000,
    targetScore: 80,
  },
  3: {
    nameKey: 'Zen Legend',
    descriptionKey: '5 advanced calm moves',
    steps: [
      { id: 1, instructionKey: 'cloudValley.raiseOneHand', iconType: 'hand', durationMs: 7000 },
      { id: 2, instructionKey: 'cloudValley.touchShoulders', iconType: 'shoulders', durationMs: 7000 },
      { id: 3, instructionKey: 'cloudValley.putHandsHead', iconType: 'head', durationMs: 7000 },
      { id: 4, instructionKey: 'cloudValley.balanceFoot', iconType: 'balance', durationMs: 8000 },
      { id: 5, instructionKey: 'cloudValley.deepBreath', iconType: 'breath', durationMs: 10000 },
    ],
    inhaleDuration: 5000,
    holdDuration: 3000,
    exhaleDuration: 5000,
    targetScore: 90,
  },
};

// Map Database string to Language enum properly
const getLanguageEnum = (dbLang: string | null | undefined): Language => {
  if (!dbLang) return Language.ENGLISH;
  const upper = dbLang.toUpperCase();
  if (upper === 'FRENCH' || upper === 'FR') return Language.FRENCH;
  if (upper === 'ARABIC' || upper === 'AR') return Language.ARABIC;
  return Language.ENGLISH;
};

export default function CloudValleyScreen() {
  const router = useRouter();
  const { startSession, endSession, clearSession, rewards } = useGameStore();
  const { child } = useChildStore();
  
  // Resolve correct Language enum to avoid raw key outputs
  const lang = getLanguageEnum(child?.language);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [screen, setScreen] = useState<GameScreen>('PERMISSION');
  const [useCamera, setUseCamera] = useState(true);
  
  // Level State
  const [selectedLevel, setSelectedLevel] = useState<number>(2); // Default to Calm Master
  const activeLevelConfig = LEVELS[selectedLevel];
  const stepsList = activeLevelConfig.steps;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Gameplay Metrics
  const [calmProgress, setCalmProgress] = useState(0);
  const [sensorValues, setSensorValues] = useState({ x: 0, y: 0, z: 0 });
  const [isSensorAvailable, setIsSensorAvailable] = useState(true);
  const [motionVariance, setMotionVariance] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');

  // Aggregated Scores
  const [smoothMovesScore, setSmoothMovesScore] = useState(100);
  const [goodFocusScore, setGoodFocusScore] = useState(100);
  const [calmMomentsScore, setCalmMomentsScore] = useState(100);
  const [finalCalmScore, setFinalCalmScore] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(0);

  // Animations
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Refs for tracking values inside stable interval loop
  const motionVarianceRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const currentStepIndexRef = useRef(0);
  const isSensorAvailableRef = useRef(true);
  const totalStepsRef = useRef(4);

  // Sync refs with local states
  useEffect(() => { motionVarianceRef.current = motionVariance; }, [motionVariance]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { currentStepIndexRef.current = currentStepIndex; }, [currentStepIndex]);
  useEffect(() => { isSensorAvailableRef.current = isSensorAvailable; }, [isSensorAvailable]);
  useEffect(() => { totalStepsRef.current = stepsList.length; }, [stepsList]);

  // HTML5 Web Video Ref
  const videoRef = useRef<any>(null);

  // Accelerometer subscription
  useEffect(() => {
    let subscription: any = null;
    let lastX = 0, lastY = 0, lastZ = 0;

    const startAccelerometer = async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        setIsSensorAvailable(available);
        if (available) {
          Accelerometer.setUpdateInterval(150);
          subscription = Accelerometer.addListener((data) => {
            setSensorValues(data);
            const variance =
              Math.abs(data.x - lastX) +
              Math.abs(data.y - lastY) +
              Math.abs(data.z - lastZ);
            setMotionVariance(variance);
            lastX = data.x;
            lastY = data.y;
            lastZ = data.z;
          });
        }
      } catch (err) {
        setIsSensorAvailable(false);
      }
    };

    startAccelerometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Web camera hook - creates video element via DOM API to avoid RN web JSX issues
  useEffect(() => {
    if (Platform.OS === 'web' && useCamera && screen === 'GAMEPLAY' && !isPaused && isPlaying) {
      const container = videoRef.current;
      if (!container) return;

      // Create a native video element via DOM
      let videoEl = container.querySelector('video');
      if (!videoEl) {
        videoEl = document.createElement('video');
        videoEl.setAttribute('muted', 'true');
        videoEl.setAttribute('playsinline', 'true');
        videoEl.muted = true;
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        container.appendChild(videoEl);
      }

      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          if (videoEl) {
            videoEl.srcObject = stream;
            videoEl.play().catch(() => {});
          }
        })
        .catch(err => {
          console.log('Webcam load error:', err);
        });

      return () => {
        // Stop all tracks when leaving gameplay
        if (videoEl && videoEl.srcObject) {
          const tracks = (videoEl.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
      };
    }
  }, [useCamera, screen, isPaused, isPlaying]);

  // Breathing Cycle Guide Loop
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    let timer: NodeJS.Timeout;
    
    const runBreathingCycle = () => {
      const inhaleT = activeLevelConfig.inhaleDuration;
      const holdT = activeLevelConfig.holdDuration;
      const exhaleT = activeLevelConfig.exhaleDuration;

      if (breathingPhase === 'INHALE') {
        Animated.timing(breathingAnim, {
          toValue: 1.5,
          duration: inhaleT,
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start();

        timer = setTimeout(() => {
          if (holdT > 0) {
            setBreathingPhase('HOLD');
          } else {
            setBreathingPhase('EXHALE');
          }
        }, inhaleT);
      } else if (breathingPhase === 'HOLD') {
        Animated.sequence([
          Animated.timing(breathingAnim, { toValue: 1.55, duration: holdT / 2, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(breathingAnim, { toValue: 1.5, duration: holdT / 2, useNativeDriver: USE_NATIVE_DRIVER }),
        ]).start();

        timer = setTimeout(() => {
          setBreathingPhase('EXHALE');
        }, holdT);
      } else {
        Animated.timing(breathingAnim, {
          toValue: 1.0,
          duration: exhaleT,
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start();

        timer = setTimeout(() => {
          setBreathingPhase('INHALE');
        }, exhaleT);
      }
    };

    runBreathingCycle();

    return () => clearTimeout(timer);
  }, [isPlaying, isPaused, breathingPhase, selectedLevel]);

  // Mascot pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1300, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 1300, useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    ).start();
  }, []);

  // Stable gameplay logic timer (resolves the timer resets from accelerometer values)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      const currentVariance = isSensorAvailableRef.current ? motionVarianceRef.current : Math.random() * 0.05;
      const isCalm = currentVariance < 0.12;

      // Adjust metrics
      if (!isCalm) {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setSmoothMovesScore((prev) => Math.max(40, prev - 2));
        setGoodFocusScore((prev) => Math.max(50, prev - 1));
        
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 4, duration: 40, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(shakeAnim, { toValue: -4, duration: 40, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: USE_NATIVE_DRIVER }),
        ]).start();
      } else {
        setCalmMomentsScore((prev) => Math.min(100, prev + 1));
      }

      // Progress bar fill
      setCalmProgress((prev) => {
        const increment = isCalm ? 3 : 1;
        const nextProgress = prev + increment;
        
        if (nextProgress >= 100) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          
          if (currentStepIndexRef.current < totalStepsRef.current - 1) {
            setCurrentStepIndex((idx) => idx + 1);
            return 0;
          } else {
            endGame();
            return 100;
          }
        }
        return nextProgress;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const endGame = async () => {
    setIsPlaying(false);
    setScreen('RESULTS');

    const duration = Date.now() - sessionStartTime;
    const finalScore = Math.round(
      (smoothMovesScore * 0.4) + (goodFocusScore * 0.3) + (calmMomentsScore * 0.3)
    );
    setFinalCalmScore(finalScore);

    endSession({
      accuracy: goodFocusScore,
      smoothness: smoothMovesScore,
      completionTime: duration,
      calmScore: finalScore,
    });

    if (child) {
      const sessionId = Date.now().toString();
      try {
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
          accuracy: goodFocusScore,
          smoothness: smoothMovesScore,
          completion_time: duration,
          path_deviation: 0,
          calm_score: finalScore,
          synced: 0,
          created_at: Date.now(),
        });

        if (finalScore >= activeLevelConfig.targetScore) {
          rewards.addFlower();
          rewards.addWaterDrop();
        } else {
          rewards.addWaterDrop();
        }
      } catch (e) {
        console.error('Failed to save metrics:', e);
      }
    }
  };

  const handleBack = () => {
    clearSession();
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/village-map');
    }
  };

  const handlePlayAgain = () => {
    setCurrentStepIndex(0);
    setCalmProgress(0);
    setSmoothMovesScore(100);
    setGoodFocusScore(100);
    setCalmMomentsScore(100);
    setFinalCalmScore(0);
    setIsPlaying(false);
    setIsPaused(false);
    setBreathingPhase('INHALE');
    setScreen('PERMISSION');
  };

  const handleStartGame = () => {
    setCurrentStepIndex(0);
    setCalmProgress(0);
    setSmoothMovesScore(100);
    setGoodFocusScore(100);
    setCalmMomentsScore(100);
    setBreathingPhase('INHALE');
    setSessionStartTime(Date.now());
    startSession('CLOUD_VALLEY');
    setIsPlaying(true);
    setIsPaused(false);
    setScreen('GAMEPLAY');
  };

  // Helper translations lookup
  const t = (key: string, variables?: Record<string, string | number>) => {
    let value = getTranslation(lang, key);
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }
    return value;
  };

  // SVGs steps icons mapping
  const renderStepIcon = (type: string, color = '#00B4D8') => {
    switch (type) {
      case 'hand':
        return (
          <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
            <Path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" />
            <Path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v9" />
            <Path d="M6 14v1.5A5.5 5.5 0 0 0 11.5 21h3a5.5 5.5 0 0 0 5.5-5.5V11" />
          </Svg>
        );
      case 'both_hands':
        return (
          <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <G transform="translate(-2, 0)">
              <Path d="M9 11V6a1.5 1.5 0 0 0-1.5-1.5v0A1.5 1.5 0 0 0 6 6v5" />
              <Path d="M6 10V4a1.5 1.5 0 0 0-1.5-1.5v0A1.5 1.5 0 0 0 3 4v6" />
              <Path d="M3 14.5c0 2 1.5 3.5 3.5 3.5h1" />
            </G>
            <G transform="translate(10, 0)">
              <Path d="M3 11V6A1.5 1.5 0 0 1 4.5 4.5v0A1.5 1.5 0 0 1 6 6v5" />
              <Path d="M6 10V4a1.5 1.5 0 0 1 1.5-1.5v0A1.5 1.5 0 0 1 9 4v6" />
              <Path d="M9 14.5c0 2-1.5 3.5-3.5 3.5h-1" />
            </G>
          </Svg>
        );
      case 'shoulders':
        return (
          <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <Circle cx="12" cy="7" r="4" />
            <Path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            <Path d="M4 11l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M20 11l-2 2 2 2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );
      case 'head':
        return (
          <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <Circle cx="12" cy="8" r="4" />
            <Path d="M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
            <Path d="M8 5a2 2 0 0 1 8 0" strokeLinecap="round" />
          </Svg>
        );
      case 'balance':
        return (
          <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <Path d="M12 3v18M5 12h14" strokeLinecap="round" />
            <Circle cx="12" cy="12" r="3" fill={color} />
          </Svg>
        );
      case 'breath':
        return (
          <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <Circle cx="12" cy="12" r="9" />
            <Path d="M12 7v10M7 12h10" strokeLinecap="round" />
          </Svg>
        );
      default:
        return null;
    }
  };

  // SCREEN 1: PRIVACY & CAMERA CONFIG (Image 1 layout)
  const renderPermissionScreen = () => {
    return (
      <View style={styles.cardContainer}>
        {/* Ivory Shield Card */}
        <View style={styles.shieldCard}>
          {/* Overlapping Shield Icon */}
          <View style={styles.shieldBadge}>
            <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#02B3C9" />
              <Rect x="9" y="10" width="6" height="5" rx="1" fill="#FFF" />
              <Path d="M10 10V8a2 2 0 0 1 4 0v2" stroke="#FFF" strokeWidth="1.5" />
            </Svg>
          </View>

          <Text style={styles.shieldHeading}>{t('cloudValley.cameraMoves')}</Text>
          <View style={styles.divider} />

          {/* List items */}
          <View style={styles.pointRow}>
            <View style={[styles.circleIconBg, { backgroundColor: '#E0F7FA' }]}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00A896" strokeWidth="2.5">
                <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <Circle cx="12" cy="13" r="4" />
              </Svg>
            </View>
            <View style={styles.pointTextContainer}>
              <Text style={styles.pointTitle}>{t('cloudValley.cameraMoves')}</Text>
              <Text style={styles.pointDesc}>{t('cloudValley.cameraMovesDesc')}</Text>
            </View>
          </View>

          <View style={styles.pointRow}>
            <View style={[styles.circleIconBg, { backgroundColor: '#FFEBEE' }]}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF5350" strokeWidth="2.5">
                <Path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                <Circle cx="8.5" cy="8.5" r="1.5" />
                <Path d="M21 15l-5-5L5 21" />
                <Path d="M19.2 4.8L4.8 19.2" stroke="#EF5350" strokeWidth="2.5" />
              </Svg>
            </View>
            <View style={styles.pointTextContainer}>
              <Text style={styles.pointTitle}>{t('cloudValley.noPhotos')}</Text>
              <Text style={styles.pointDesc}>{t('cloudValley.noPhotosDesc')}</Text>
            </View>
          </View>

          <View style={styles.pointRow}>
            <View style={[styles.circleIconBg, { backgroundColor: '#FFEBEE' }]}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF5350" strokeWidth="2.5">
                <Path d="M23 7l-7 5 7 5V7z" />
                <Rect x="1" y="5" width="15" height="14" rx="2" />
                <Path d="M19.2 4.8L4.8 19.2" stroke="#EF5350" strokeWidth="2.5" />
              </Svg>
            </View>
            <View style={styles.pointTextContainer}>
              <Text style={styles.pointTitle}>{t('cloudValley.noVideos')}</Text>
              <Text style={styles.pointDesc}>{t('cloudValley.noVideosDesc')}</Text>
            </View>
          </View>
        </View>

        {/* Mascot Mascot Standing Next (Responsive Layout) */}
        <Animated.View style={[styles.permissionMascotWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <Image
            source={require('../../assets/nawat_character.png')}
            style={styles.permissionMascot}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Bottom Buttons */}
        <View style={styles.permissionButtonsWrapper}>
          <TouchableOpacity
            style={styles.btnUseCamera}
            activeOpacity={0.9}
            onPress={async () => {
              setUseCamera(true);
              if (!cameraPermission?.granted) {
                const res = await requestCameraPermission();
                if (res.granted) {
                  setScreen('GET_READY');
                } else {
                  setUseCamera(false);
                  setScreen('GET_READY');
                }
              } else {
                setScreen('GET_READY');
              }
            }}
          >
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" style={{ marginRight: 8 }}>
              <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <Circle cx="12" cy="13" r="4" />
            </Svg>
            <Text style={styles.btnUseCameraText}>{t('cloudValley.useCamera')} ✨</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // SCREEN 2: GET READY (Image 2 layout with Levels system)
  const renderGetReadyScreen = () => {
    return (
      <View style={styles.readyContainer}>
        {/* Rules horizontal row */}
        <View style={styles.cardsRowWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScrollContent}
          >
            {/* Safe space */}
            <View style={styles.ruleCard}>
              <View style={[styles.cardBadge, { backgroundColor: '#4CAF50' }]}>
                <Text style={{ color: '#FFF', fontSize: 13 }}>🌿</Text>
              </View>
              <View style={styles.ruleIconRoundBg}>
                <Svg width="54" height="54" viewBox="0 0 24 24" fill="none">
                  <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93.03-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 1.76-.56 3.39-1.5 4.73z" fill="#A5D6A7" />
                  <Path d="M6 14c0-2.5 3-4 6-4s6 1.5 6 4-2.5 3-6 3-6-1.5-6-3zm3 0c0 .8 1.3 1.5 3 1.5s3-.7 3-1.5-1.3-.8-3-.8-3 .3-3 .8z" fill="#4CAF50" />
                </Svg>
              </View>
              <Text style={styles.ruleCardLabel}>{t('cloudValley.safeSpace')}</Text>
            </View>

            {/* Show hand */}
            <View style={styles.ruleCard}>
              <View style={[styles.cardBadge, { backgroundColor: '#FFC107' }]}>
                <Text style={{ color: '#FFF', fontSize: 13 }}>🖐️</Text>
              </View>
              <View style={styles.ruleIconRoundBg}>
                <Svg width="54" height="54" viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" fill="#FFE082" />
                  <Path d="M12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="#FFB300" />
                  <Path d="M12 5l1.5 4.5L18 11l-4.5 1.5L12 17l-1.5-4.5L6 11l4.5-1.5z" fill="#FFF" />
                </Svg>
              </View>
              <Text style={styles.ruleCardLabel}>{t('cloudValley.showYourHand')}</Text>
            </View>

            {/* Move slowly */}
            <View style={styles.ruleCard}>
              <View style={[styles.cardBadge, { backgroundColor: '#0288D1' }]}>
                <Text style={{ color: '#FFF', fontSize: 13 }}>🐌</Text>
              </View>
              <View style={styles.ruleIconRoundBg}>
                <Svg width="54" height="54" viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" fill="#90CAF9" />
                  <Path d="M15 14h-6a3 3 0 0 0-3 3h12a3 3 0 0 0-3-3z" fill="#1565C0" />
                  <Path d="M8 14a3 3 0 1 1 6 0" fill="#1E88E5" />
                  <Path d="M13.5 11.5a1.5 1.5 0 1 1 3 0" fill="#90CAF9" />
                </Svg>
              </View>
              <Text style={styles.ruleCardLabel}>{t('cloudValley.moveSlowly')}</Text>
            </View>
          </ScrollView>
        </View>

        {/* Level Choice selector (ADHD Levels progression) */}
        <View style={styles.levelSelectorContainer}>
          <Text style={styles.levelSelectorHeading}>{t('cloudValley.chooseLevel')}</Text>
          <View style={styles.levelButtonsRow}>
            {[1, 2, 3].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.levelPillBtn,
                  selectedLevel === lvl && styles.levelPillBtnActive,
                ]}
                onPress={() => {
                  setSelectedLevel(lvl);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Text style={[
                  styles.levelPillText,
                  selectedLevel === lvl && styles.levelPillTextActive,
                ]}>
                  {LEVELS[lvl].nameKey}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.levelDescriptionPill}>
            {activeLevelConfig.descriptionKey} • {t('cloudValley.targetCalm')}: {activeLevelConfig.targetScore}%
          </Text>
        </View>

        {/* Mascot and Wooden signpost */}
        <View style={styles.readyFooterRow}>
          <Image
            source={require('../../assets/nawat_character.png')}
            style={styles.mascotReady}
            resizeMode="contain"
          />

          <View style={styles.woodSignpost}>
            <View style={styles.woodSignboard}>
              <Text style={{ fontSize: 24, marginRight: 6 }}>😴</Text>
              <Text style={styles.woodSignText}>Calm Moves</Text>
            </View>
            <View style={styles.woodSignPole} />
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.btnStartCalmMoves}
          activeOpacity={0.9}
          onPress={handleStartGame}
        >
          <Text style={styles.btnStartCalmMovesText}>{t('cloudValley.startCalmMoves')} ➔</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // SCREEN 3: GAMEPLAY (Image 3 layout)
  const renderGameplayScreen = () => {
    const currentStep = stepsList[currentStepIndex];

    return (
      <View style={styles.playContainer}>
        {/* Progress header */}
        <View style={styles.stepHeaderCard}>
          <Text style={styles.stepHeaderText}>
            {t('cloudValley.stepProgress', { current: currentStepIndex + 1, total: stepsList.length })}
          </Text>
          <View style={styles.stepDotsRow}>
            {stepsList.map((step, idx) => (
              <View
                key={step.id}
                style={[
                  styles.stepProgressDot,
                  idx === currentStepIndex && styles.stepProgressDotActive,
                  idx < currentStepIndex && styles.stepProgressDotDone,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Instruction Banner Card with Mascot peeking */}
        <View style={styles.instructionBannerCard}>
          <View style={styles.instructionIconBadge}>
            {renderStepIcon(currentStep.iconType, '#00A896')}
          </View>
          <Text style={styles.instructionCardText}>{t(currentStep.instructionKey)}</Text>
          <Image
            source={require('../../assets/nawat_character.png')}
            style={styles.peekingMascotImage}
            resizeMode="contain"
          />
        </View>

        {/* Main interactive camera viewport */}
        <Animated.View style={[
          styles.viewportWrapper,
          { transform: [{ translateX: shakeAnim }] }
        ]}>
          {useCamera ? (
            Platform.OS === 'web' ? (
              /* HTML5 Web Camera Fallback */
              <View style={styles.webcamContainer}>
                {/* Video element is created via DOM API in useEffect, attached to this container */}
                <View ref={videoRef} style={styles.webcamVideoContainer} />
                <View style={styles.viewportOverlay}>
                  {/* Silhouette guide */}
                  <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 100 100">
                    <Path
                      d="M 50 15 C 40 15 35 25 35 35 C 35 45 42 48 50 48 C 58 48 65 45 65 35 C 65 25 60 15 50 15 Z M 50 48 C 30 48 20 62 20 85 L 80 85 C 80 62 70 48 50 48 Z"
                      stroke="#00E676"
                      strokeWidth="1"
                      strokeDasharray="3,2"
                      fill="none"
                      opacity="0.75"
                    />
                  </Svg>

                  {/* Concentric Breathing Circle */}
                  <Animated.View style={[
                    styles.breathingIndicator,
                    { transform: [{ scale: breathingAnim }] }
                  ]}>
                    <Text style={styles.breathingText}>{t(`cloudValley.breathing${breathingPhase.charAt(0) + breathingPhase.slice(1).toLowerCase()}`)}</Text>
                  </Animated.View>

                  {/* Progress filler */}
                  <View style={styles.progressBarWrapper}>
                    <Text style={styles.progressLabel}>{t('cloudValley.holdPose')}</Text>
                    <View style={styles.progressBarOutline}>
                      <View style={[styles.progressBarFill, { width: `${calmProgress}%` }]} />
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              /* Native Expo Camera View */
              <CameraView style={styles.cameraView} facing="front">
                <View style={styles.viewportOverlay}>
                  <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 100 100">
                    <Path
                      d="M 50 15 C 40 15 35 25 35 35 C 35 45 42 48 50 48 C 58 48 65 45 65 35 C 65 25 60 15 50 15 Z M 50 48 C 30 48 20 62 20 85 L 80 85 C 80 62 70 48 50 48 Z"
                      stroke="#00E676"
                      strokeWidth="1"
                      strokeDasharray="3,2"
                      fill="none"
                      opacity="0.75"
                    />
                  </Svg>

                  <Animated.View style={[
                    styles.breathingIndicator,
                    { transform: [{ scale: breathingAnim }] }
                  ]}>
                    <Text style={styles.breathingText}>{breathingPhase}</Text>
                  </Animated.View>

                  {/* Progress loader */}
                  <View style={styles.progressBarWrapper}>
                    <Text style={styles.progressLabel}>{t('cloudValley.holdPose')}</Text>
                    <View style={styles.progressBarOutline}>
                      <View style={[styles.progressBarFill, { width: `${calmProgress}%` }]} />
                    </View>
                  </View>

                  {/* Shakiness notification */}
                  {motionVariance > 0.12 && isSensorAvailable && (
                    <View style={styles.alertShakeCard}>
                      <Text style={styles.alertShakeText}>⚠️ {t('cloudValley.holdStill')}</Text>
                    </View>
                  )}
                </View>
              </CameraView>
            )
          ) : (
            /* Simulation mode (No Camera option) */
            <View style={styles.simulatedContainer}>
              <Svg width="140" height="140" viewBox="0 0 100 100" style={{ opacity: 0.85 }}>
                <Path
                  d="M 50 15 C 40 15 35 25 35 35 C 35 45 42 48 50 48 C 58 48 65 45 65 35 C 65 25 60 15 50 15 Z M 50 48 C 30 48 20 62 20 85 L 80 85 C 80 62 70 48 50 48 Z"
                  stroke="#00A896"
                  strokeWidth="2"
                  fill="rgba(0, 168, 150, 0.15)"
                />
              </Svg>

              <Animated.View style={[
                styles.breathingIndicatorSim,
                { transform: [{ scale: breathingAnim }] }
              ]}>
                <Text style={styles.breathingText}>{breathingPhase}</Text>
              </Animated.View>

              <View style={styles.progressBarWrapper}>
                <Text style={styles.progressLabel}>{t('cloudValley.calmHold')}: {Math.round(calmProgress)}%</Text>
                <View style={styles.progressBarOutline}>
                  <View style={[styles.progressBarFill, { width: `${calmProgress}%` }]} />
                </View>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Bottom instructions pill */}
        <View style={styles.statusInstructionPill}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>🐌</Text>
          <Text style={styles.statusInstructionText}>{t('cloudValley.moveSlowly')}</Text>
        </View>

        {/* Control Button */}
        <TouchableOpacity
          style={styles.btnGameplayPause}
          onPress={() => setIsPaused(!isPaused)}
        >
          <Text style={styles.btnGameplayPauseText}>
            {isPaused ? `▶  ${t('cloudValley.resume')}` : `❚❚  ${t('cloudValley.pause')}`}
          </Text>
        </TouchableOpacity>

        {/* Modal Pause overlay */}
        {isPaused && (
          <View style={styles.modalPauseOverlay}>
            <View style={styles.modalPauseCard}>
              <Text style={styles.modalPauseHeading}>{t('cloudValley.movesPaused')}</Text>
              <TouchableOpacity
                style={styles.modalPauseBtn}
                onPress={() => setIsPaused(false)}
              >
                <Text style={styles.modalPauseBtnText}>{t('cloudValley.resumeSession')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPauseBtn, styles.modalPauseExitBtn]}
                onPress={handleBack}
              >
                <Text style={styles.modalPauseBtnText}>{t('cloudValley.exitGame')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // SCREEN 4: RESULTS (Image 4 layout)
  const renderResultsScreen = () => {
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>{t('cloudValley.greatJob')}</Text>
        <Text style={styles.resultsSubtitle}>{t('cloudValley.bridgeComplete')}</Text>

        <View style={styles.resultsLayoutRow}>
          {/* Mascot Celebration (Thumbs Up) */}
          <Image
            source={require('../../assets/nawat_character.png')}
            style={styles.celebrationMascot}
            resizeMode="contain"
          />

          {/* Calm Score Badge Box */}
          <View style={styles.scoreResultBadge}>
            <Text style={styles.scoreBadgeLabel}>{t('cloudValley.calmScore')}</Text>
            <Text style={styles.scoreBadgeNumber}>{finalCalmScore}</Text>
            
            <View style={styles.scoreStarsRow}>
              <Text style={{ fontSize: 22, color: '#FFB300' }}>⭐</Text>
              <Text style={{ fontSize: 30, color: '#FFB300', marginHorizontal: 3, marginTop: -3 }}>⭐</Text>
              <Text style={{ fontSize: 22, color: '#FFB300' }}>⭐</Text>
            </View>
          </View>
        </View>

        {/* Badges feedback horizontal cards */}
        <View style={styles.feedbackRow}>
          <View style={styles.feedbackCardItem}>
            <View style={[styles.feedbackBadgeIconBg, { backgroundColor: '#E0F7FA' }]}>
              <Text style={{ fontSize: 22 }}>☁️</Text>
            </View>
            <Text style={styles.feedbackCardLabel}>{t('cloudValley.smoothMoves')}</Text>
            <Text style={styles.feedbackCardValue}>{smoothMovesScore}%</Text>
          </View>

          <View style={styles.feedbackCardItem}>
            <View style={[styles.feedbackBadgeIconBg, { backgroundColor: '#E8F5E9' }]}>
              <Text style={{ fontSize: 22 }}>🌿</Text>
            </View>
            <Text style={styles.feedbackCardLabel}>{t('cloudValley.goodFocus')}</Text>
            <Text style={styles.feedbackCardValue}>{goodFocusScore}%</Text>
          </View>

          <View style={styles.feedbackCardItem}>
            <View style={[styles.feedbackBadgeIconBg, { backgroundColor: '#F3E5F5' }]}>
              <Text style={{ fontSize: 22 }}>💜</Text>
            </View>
            <Text style={styles.feedbackCardLabel}>{t('cloudValley.calmMoments')}</Text>
            <Text style={styles.feedbackCardValue}>{calmMomentsScore}%</Text>
          </View>
        </View>

        {/* Award banner */}
        <View style={styles.awardBannerCard}>
          <View style={styles.awardIconBadge}>
            <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="5" fill="#E91E63" />
              <Circle cx="12" cy="6" r="3.5" fill="#9C27B0" opacity="0.8" />
              <Circle cx="12" cy="18" r="3.5" fill="#9C27B0" opacity="0.8" />
              <Circle cx="6" cy="12" r="3.5" fill="#9C27B0" opacity="0.8" />
              <Circle cx="18" cy="12" r="3.5" fill="#9C27B0" opacity="0.8" />
            </Svg>
          </View>
          <Text style={styles.awardCardText}>
            {finalCalmScore >= activeLevelConfig.targetScore ? t('cloudValley.earnedFlower') : t('cloudValley.earnedWaterDrop')}
          </Text>
        </View>

        {/* Buttons wrapper */}
        <View style={styles.resultsButtonsWrapper}>
          <TouchableOpacity
            style={styles.btnNextAdventure}
            activeOpacity={0.9}
            onPress={handleBack}
          >
            <Text style={styles.btnNextAdventureText}>{t('cloudValley.nextAdventure')} ➔</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnPlayAgainResult}
            activeOpacity={0.8}
            onPress={handlePlayAgain}
          >
            <Text style={styles.btnPlayAgainResultText}>{t('cloudValley.playAgain')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/nawat_background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeAreaContainer}>
        {/* Top Header Row */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerCircledButton}
            onPress={handleBack}
          >
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <View style={styles.headerTitleIconBg}>
              <Text style={{ fontSize: 15 }}>😴</Text>
            </View>
            <View>
              <Text style={styles.headerMainTitle}>{t('cloudValley.title')}</Text>
              <Text style={styles.headerSubTitle}>
                {screen === 'GET_READY' ? t('cloudValley.getReady') : t('cloudValley.description')}
              </Text>
            </View>
          </View>

          <View style={styles.headerRightControlsRow}>
            <TouchableOpacity
              style={[styles.headerCircledButton, { marginRight: 8 }]}
              onPress={() => setIsPaused(true)}
              disabled={screen !== 'GAMEPLAY'}
            >
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#5C4033' }}>❚❚</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerCircledButton}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="2.5">
                <Path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinejoin="round" />
                <Path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* Page Content responsive wrapper */}
        <View style={styles.responsiveContentWrapper}>
          {screen === 'PERMISSION' && renderPermissionScreen()}
          {screen === 'GET_READY' && renderGetReadyScreen()}
          {screen === 'GAMEPLAY' && renderGameplayScreen()}
          {screen === 'RESULTS' && renderResultsScreen()}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: Platform.OS === 'web' ? 48 : 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerCircledButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#ECE0CE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ECE0CE',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleIconBg: {
    marginRight: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00796B',
  },
  headerSubTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C4033',
  },
  headerRightControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responsiveContentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: isTablet ? 720 : '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  shieldCard: {
    width: '100%',
    backgroundColor: '#FFFDF6',
    borderRadius: 28,
    borderWidth: 3.5,
    borderColor: '#E6D7BD',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 24,
    position: 'relative',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 8,
  },
  shieldBadge: {
    position: 'absolute',
    top: -26,
    left: '50%',
    marginLeft: -26,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
    borderWidth: 3.5,
    borderColor: '#E6D7BD',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  shieldHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00796B',
    textAlign: 'center',
    marginVertical: 8,
  },
  divider: {
    height: 2,
    backgroundColor: '#F5EBD6',
    marginVertical: 12,
    width: '100%',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  circleIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pointTextContainer: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3E2723',
  },
  pointDesc: {
    fontSize: 12,
    color: '#6D4C41',
    fontWeight: '600',
  },
  permissionMascotWrapper: {
    marginVertical: 8,
  },
  permissionMascot: {
    width: SCREEN_WIDTH * 0.35, // responsive
    height: SCREEN_WIDTH * 0.4,
    maxWidth: 150,
    maxHeight: 170,
  },
  permissionButtonsWrapper: {
    width: '100%',
    gap: 10,
    marginBottom: 10,
  },
  btnUseCamera: {
    backgroundColor: '#02B3C9',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00838F',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00838F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnUseCameraText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  readyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  cardsRowWrapper: {
    height: 155,
    marginVertical: 8,
  },
  cardsScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 14,
  },
  ruleCard: {
    width: isTablet ? 190 : 155,
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#E6D7BD',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  cardBadge: {
    position: 'absolute',
    top: -12,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  ruleIconRoundBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F9F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ruleCardLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#5C4033',
    textAlign: 'center',
  },
  levelSelectorContainer: {
    width: '100%',
    backgroundColor: '#FFFDF4',
    borderWidth: 2,
    borderColor: '#E6D7BD',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  levelSelectorHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00796B',
    marginBottom: 8,
  },
  levelButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  levelPillBtn: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#ECE0CE',
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelPillBtnActive: {
    backgroundColor: '#02B3C9',
    borderColor: '#00838F',
  },
  levelPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5C4033',
  },
  levelPillTextActive: {
    color: '#FFF',
  },
  levelDescriptionPill: {
    fontSize: 12,
    color: '#7A5C4F',
    fontWeight: '700',
  },
  readyFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  mascotReady: {
    width: SCREEN_WIDTH * 0.3,
    height: SCREEN_WIDTH * 0.35,
    maxWidth: 130,
    maxHeight: 150,
  },
  woodSignpost: {
    alignItems: 'center',
  },
  woodSignboard: {
    backgroundColor: '#8D6E63',
    borderWidth: 3,
    borderColor: '#5D4037',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  woodSignText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
  woodSignPole: {
    width: 8,
    height: 35,
    backgroundColor: '#5D4037',
  },
  btnStartCalmMoves: {
    backgroundColor: '#02B3C9',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00838F',
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00838F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 10,
  },
  btnStartCalmMovesText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  playContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  stepHeaderCard: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E6D7BD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepHeaderText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00796B',
    marginBottom: 4,
  },
  stepDotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepProgressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ECE0CE',
    borderWidth: 1.5,
    borderColor: '#D7CCC8',
  },
  stepProgressDotActive: {
    backgroundColor: '#02B3C9',
    borderColor: '#00838F',
    transform: [{ scale: 1.2 }],
  },
  stepProgressDotDone: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
  },
  instructionBannerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#ECE0CE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 6,
  },
  instructionIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionCardText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: '#3E2723',
  },
  peekingMascotImage: {
    width: 60,
    height: 70,
    position: 'absolute',
    right: 4,
    top: -24,
  },
  viewportWrapper: {
    flex: 1,
    width: '100%',
    maxHeight: isTablet ? 380 : 340,
    aspectRatio: isTablet ? 1.2 : 0.95,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    backgroundColor: '#000',
    marginVertical: 6,
    alignSelf: 'center',
  },
  cameraView: {
    flex: 1,
  },
  webcamContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  webcamVideoContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  viewportOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'space-between',
    padding: 16,
  },
  breathingIndicator: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFF',
    alignSelf: 'center',
    marginTop: isTablet ? 25 : 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 150, 136, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  breathingIndicatorSim: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#02B3C9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 179, 201, 0.2)',
    marginVertical: 12,
  },
  breathingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  progressBarWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBarOutline: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00E676',
    borderRadius: 6,
  },
  alertShakeCard: {
    position: 'absolute',
    top: 15,
    left: '10%',
    right: '10%',
    backgroundColor: 'rgba(211, 47, 47, 0.95)',
    borderRadius: 16,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  alertShakeText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
  },
  simulatedContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  statusInstructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF0',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F2E2C9',
    marginVertical: 4,
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statusInstructionText: {
    color: '#5C4033',
    fontSize: 14,
    fontWeight: '800',
  },
  btnGameplayPause: {
    backgroundColor: '#02B3C9',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#00838F',
    paddingVertical: 12,
    paddingHorizontal: 36,
    shadowColor: '#00838F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  btnGameplayPauseText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  modalPauseOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPauseCard: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 3.5,
    borderColor: '#ECE0CE',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  modalPauseHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00796B',
    marginBottom: 20,
  },
  modalPauseBtn: {
    backgroundColor: '#02B3C9',
    borderWidth: 2,
    borderColor: '#00838F',
    borderRadius: 24,
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPauseExitBtn: {
    backgroundColor: '#EF5350',
    borderColor: '#C62828',
  },
  modalPauseBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00796B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  resultsSubtitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5C4033',
    marginBottom: 8,
  },
  resultsLayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  celebrationMascot: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.4,
    maxWidth: 150,
    maxHeight: 170,
  },
  scoreResultBadge: {
    backgroundColor: '#FFFDF4',
    borderWidth: 3.5,
    borderColor: '#ECE0CE',
    borderRadius: 28,
    padding: 16,
    alignItems: 'center',
    width: '45%',
    maxWidth: 200,
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreBadgeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00796B',
  },
  scoreBadgeNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#009688',
    marginVertical: 2,
  },
  scoreStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
    gap: 8,
  },
  feedbackCardItem: {
    flex: 1,
    backgroundColor: '#FFFDF9',
    borderWidth: 2,
    borderColor: '#ECE0CE',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  feedbackBadgeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  feedbackCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D4C41',
    textAlign: 'center',
    marginBottom: 2,
  },
  feedbackCardValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#00796B',
  },
  awardBannerCard: {
    backgroundColor: '#FFFDE7',
    borderWidth: 2,
    borderColor: '#F0E4CE',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 12,
  },
  awardIconBadge: {
    marginRight: 10,
  },
  awardCardText: {
    color: '#5C4033',
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
  },
  resultsButtonsWrapper: {
    width: '100%',
    gap: 8,
  },
  btnNextAdventure: {
    backgroundColor: '#02B3C9',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00838F',
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00838F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnNextAdventureText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  btnPlayAgainResult: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#ECE0CE',
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnPlayAgainResultText: {
    color: '#5C4033',
    fontSize: 16,
    fontWeight: '900',
  },
});