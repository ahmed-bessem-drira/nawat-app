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
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';
import { syncService } from '@/services/sync.service';
import { getTranslation } from '@/i18n/translations';
import { Language } from '../shared/types';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';

// ===== RESPONSIVE HELPERS =====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 375; // référence (iPhone SE)
const scale = SCREEN_WIDTH / BASE_WIDTH;
const fontScale = PixelRatio.getFontScale() * scale;

// Fonctions de mise à l'échelle
const s = (size: number) => Math.round(size * scale);
const f = (size: number) => Math.round(size * fontScale);

// Détection tablette
const isTablet = SCREEN_WIDTH > 600;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// ===== TYPES =====
type GameScreen = 'PERMISSION' | 'GET_READY' | 'GAMEPLAY' | 'RESULTS';

interface CalmMoveStep {
  id: number;
  instructionKey: string;
  iconType: 'hand' | 'both_hands' | 'shoulders' | 'head' | 'balance' | 'breath' | 'stretch_arms';
  durationMs: number;
}

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
      { id: 4, instructionKey: 'cloudValley.stretchArms', iconType: 'stretch_arms', durationMs: 8000 },
      { id: 5, instructionKey: 'cloudValley.deepBreath', iconType: 'breath', durationMs: 10000 },
    ],
    inhaleDuration: 5000,
    holdDuration: 3000,
    exhaleDuration: 5000,
    targetScore: 90,
  },
};

const EXPLORERS = [
  { id: 'avatar_1', name: 'Nawat', image: require('../../assets/nawat_character.png') },
  { id: 'avatar_2', name: 'Zahra', image: require('../../assets/zahra_placeholder.png') },
  { id: 'avatar_3', name: 'Sami', image: require('../../assets/sami_placeholder.png') },
  { id: 'avatar_4', name: 'Lulu', image: require('../../assets/lulu_placeholder.png') },
];

// Map Database string to Language enum properly
const getLanguageEnum = (dbLang: string | null | undefined): Language => {
  if (!dbLang) return Language.ENGLISH;
  const upper = dbLang.toUpperCase();
  if (upper === 'FRENCH' || upper === 'FR') return Language.FRENCH;
  if (upper === 'ARABIC' || upper === 'AR') return Language.ARABIC;
  return Language.ENGLISH;
};

const ArrowRightIcon = () => (
  <Svg width={s(18)} height={s(18)} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);

export default function CloudValleyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedLanguage?: string; selectedAvatar?: string }>();
  const { startSession, endSession, clearSession, rewards } = useGameStore();
  const { child } = useChildStore();

  const selectedAvatarId = params.selectedAvatar || child?.avatar || 'avatar_1';
  const selectedExplorer = EXPLORERS.find((e) => e.id === selectedAvatarId) || EXPLORERS[0];

  // Resolve correct Language enum
  const lang = getLanguageEnum(child?.language);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [screen, setScreen] = useState<GameScreen>('PERMISSION');
  const [useCamera, setUseCamera] = useState(true);

  // Level State
  const [selectedLevel, setSelectedLevel] = useState<number>(2);
  const activeLevelConfig = LEVELS[selectedLevel];
  const stepsList = activeLevelConfig.steps;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Gameplay Metrics
  const [calmProgress, setCalmProgress] = useState(0);
  const [isSensorAvailable, setIsSensorAvailable] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const isShakingRef = useRef(false);
  const [breathingPhase, setBreathingPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');

  // Aggregated Scores
  const [smoothMovesScore, setSmoothMovesScore] = useState(100);
  const [goodFocusScore, setGoodFocusScore] = useState(100);
  const [calmMomentsScore, setCalmMomentsScore] = useState(100);
  const [activeParticipationScore, setActiveParticipationScore] = useState(100);
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

  // ADHD tick tracking refs
  const totalGameplayTicksRef = useRef(0);
  const calmGameplayTicksRef = useRef(0);
  const suddenMovementTicksRef = useRef(0);
  const holdPhaseTicksRef = useRef(0);
  const holdPhaseCalmTicksRef = useRef(0);
  const breathingPhaseRef = useRef<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');

  // Phase-aware and active participation refs
  const isCameraActiveRef = useRef(false);
  const hasMovedInCurrentStepRef = useRef(false);
  const stepsMovedCountRef = useRef(0);
  const holdTicksRef = useRef(0);
  const holdCalmTicksRef = useRef(0);
  const calmProgressRef = useRef(0);

  // Sync refs with local states
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { currentStepIndexRef.current = currentStepIndex; }, [currentStepIndex]);
  useEffect(() => { isSensorAvailableRef.current = isSensorAvailable; }, [isSensorAvailable]);
  useEffect(() => { totalStepsRef.current = stepsList.length; }, [stepsList]);
  useEffect(() => { breathingPhaseRef.current = breathingPhase; }, [breathingPhase]);
  useEffect(() => { calmProgressRef.current = calmProgress; }, [calmProgress]);

  // Flag to defer endGame out of render phase
  const shouldEndGameRef = useRef(false);

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
          if (Platform.OS !== 'web') {
            Accelerometer.setUpdateInterval(150);
          }
          subscription = Accelerometer.addListener((data) => {
            const variance =
              Math.abs(data.x - lastX) +
              Math.abs(data.y - lastY) +
              Math.abs(data.z - lastZ);
            
            motionVarianceRef.current = variance;
            
            const shaking = variance > 0.12;
            if (shaking !== isShakingRef.current) {
              isShakingRef.current = shaking;
              setIsShaking(shaking);
            }

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

  // Web camera hook
  useEffect(() => {
    if (Platform.OS === 'web' && useCamera && screen === 'GAMEPLAY' && !isPaused && isPlaying) {
      const container = videoRef.current;
      if (!container) return;

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

      let frameCheckInterval: NodeJS.Timeout;

      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          if (videoEl) {
            videoEl.srcObject = stream;
            videoEl.play().catch(() => {});

            // Setup camera motion detection
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 48;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            let lastFrame: Uint8ClampedArray | null = null;

            const checkFrame = () => {
              if (!videoEl || videoEl.paused || videoEl.ended || !ctx) return;
              try {
                ctx.drawImage(videoEl, 0, 0, 64, 48);
                const frame = ctx.getImageData(0, 0, 64, 48).data;
                isCameraActiveRef.current = true;
                if (lastFrame) {
                  let diff = 0;
                  // Sample every 16th value (red channel of sampled pixels) to be super fast
                  for (let i = 0; i < frame.length; i += 16) {
                    diff += Math.abs(frame[i] - lastFrame[i]);
                  }
                  const avgDiff = diff / (frame.length / 16);
                  // Normalize avgDiff (0-255) to a motion variance value (e.g. 0.0 to 1.5)
                  const normalizedVariance = avgDiff / 15; // lower divisor = more sensitive to motion
                  
                  motionVarianceRef.current = normalizedVariance;
                  
                  const shaking = normalizedVariance > 0.12;
                  if (shaking !== isShakingRef.current) {
                    isShakingRef.current = shaking;
                    setIsShaking(shaking);
                  }
                }
                lastFrame = frame;
              } catch (e) {
                // Ignore cross-origin / draw errors
              }
            };

            frameCheckInterval = setInterval(checkFrame, 150);
          }
        })
        .catch(err => {
          console.log('Webcam load error:', err);
        });

      return () => {
        if (frameCheckInterval) {
          clearInterval(frameCheckInterval);
        }
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

  // Stable gameplay logic timer
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      totalGameplayTicksRef.current += 1;

      const isInputActive = isSensorAvailableRef.current || (useCamera && isCameraActiveRef.current);
      const currentVariance = isInputActive
        ? motionVarianceRef.current
        : (Math.random() < 0.08 ? Math.random() * 0.35 : Math.random() * 0.05);

      const isCalm = currentVariance < 0.15;
      const progress = calmProgressRef.current;
      const isActionPhase = progress < 30;

      if (isActionPhase) {
        // 1. Action Phase: check if child initiates movement (variance > 0.15)
        if (currentVariance > 0.15) {
          hasMovedInCurrentStepRef.current = true;
        }
      } else {
        // 2. Hold Phase: track postural stability
        holdTicksRef.current += 1;
        if (isCalm) {
          holdCalmTicksRef.current += 1;
        }

        // Track sudden hyperactive movements (only in Hold Phase)
        if (currentVariance > 0.50) {
          suddenMovementTicksRef.current += 1;
        }

        // Track breathing sync (only in Hold Phase)
        if (breathingPhaseRef.current === 'HOLD' || breathingPhaseRef.current === 'EXHALE') {
          holdPhaseTicksRef.current += 1;
          if (isCalm) {
            holdPhaseCalmTicksRef.current += 1;
          }
        }
      }

      // Legacy calm ticks track
      if (isCalm) {
        calmGameplayTicksRef.current += 1;
      }

      // Screen shake and haptics ONLY during Hold Phase when not calm
      if (!isActionPhase && !isCalm) {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 4, duration: 40, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(shakeAnim, { toValue: -4, duration: 40, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: USE_NATIVE_DRIVER }),
        ]).start();
      }

      setCalmProgress((prev) => {
        // In action phase, progress increments steadily (+3) to transition to hold phase.
        // In hold phase, progress increments +3 if calm, and +1 if not calm.
        const increment = isActionPhase ? 3 : (isCalm ? 3 : 1);
        const nextProgress = prev + increment;

        if (nextProgress >= 100) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          const currentTotalSteps = totalStepsRef.current;
          if (currentStepIndexRef.current < currentTotalSteps - 1) {
            // Check movement for completed step
            if (hasMovedInCurrentStepRef.current) {
              stepsMovedCountRef.current += 1;
            }
            hasMovedInCurrentStepRef.current = false;
            setCurrentStepIndex((idx) => idx + 1);
            return 0;
          } else {
            // Check movement for final step
            if (hasMovedInCurrentStepRef.current) {
              stepsMovedCountRef.current += 1;
            }
            // Defer endGame to avoid setState during render
            shouldEndGameRef.current = true;
            return 100;
          }
        }
        return nextProgress;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Deferred endGame handler — runs outside the render phase
  useEffect(() => {
    if (shouldEndGameRef.current) {
      shouldEndGameRef.current = false;
      endGame();
    }
  }, [calmProgress]);

  const endGame = async () => {
    setIsPlaying(false);
    setScreen('RESULTS');

    const duration = Date.now() - sessionStartTime;

    const totalSteps = stepsList.length;
    const isInputActive = isSensorAvailableRef.current || (useCamera && isCameraActiveRef.current);
    const calculatedParticipation = isInputActive ? Math.round((stepsMovedCountRef.current / totalSteps) * 100) : 100;

    // Postural Control (Smooth Moves): holdCalmTicks / holdTicks during HOLD phase
    const totalHoldTicks = Math.max(1, holdTicksRef.current);
    const calculatedSmoothMoves = Math.round((holdCalmTicksRef.current / totalHoldTicks) * 100);

    // Inhibitory Control (Good Focus): deduct 10 points per sudden movement (variance > 0.5)
    const calculatedGoodFocus = Math.max(40, 100 - (suddenMovementTicksRef.current * 10));

    // Breathing Sync: calm percentage during HOLD/EXHALE phases within Hold phase
    const totalHoldBreathingTicks = Math.max(1, holdPhaseTicksRef.current);
    const calculatedCalmMoments = Math.round(
      (holdPhaseCalmTicksRef.current / totalHoldBreathingTicks) * 100
    );

    // Final score: average of clinical metrics scaled by active participation rate
    const rawScore = (calculatedSmoothMoves * 0.4) + (calculatedGoodFocus * 0.3) + (calculatedCalmMoments * 0.3);
    const finalScore = Math.round((rawScore * calculatedParticipation) / 100);

    setSmoothMovesScore(calculatedSmoothMoves);
    setGoodFocusScore(calculatedGoodFocus);
    setCalmMomentsScore(calculatedCalmMoments);
    setActiveParticipationScore(calculatedParticipation);
    setFinalCalmScore(finalScore);

    endSession({
      accuracy: calculatedGoodFocus,
      smoothness: calculatedSmoothMoves,
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
          accuracy: calculatedGoodFocus,
          smoothness: calculatedSmoothMoves,
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

      syncService.syncData().catch(() => {});
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
    setActiveParticipationScore(100);
    setFinalCalmScore(0);
    setIsPlaying(false);
    setIsPaused(false);
    setBreathingPhase('INHALE');
    setScreen('PERMISSION');

    // Reset refs
    totalGameplayTicksRef.current = 0;
    calmGameplayTicksRef.current = 0;
    suddenMovementTicksRef.current = 0;
    holdPhaseTicksRef.current = 0;
    holdPhaseCalmTicksRef.current = 0;
    hasMovedInCurrentStepRef.current = false;
    stepsMovedCountRef.current = 0;
    holdTicksRef.current = 0;
    holdCalmTicksRef.current = 0;
  };

  const handleStartGame = () => {
    setCurrentStepIndex(0);
    setCalmProgress(0);
    setSmoothMovesScore(100);
    setGoodFocusScore(100);
    setCalmMomentsScore(100);
    setActiveParticipationScore(100);
    setBreathingPhase('INHALE');
    setSessionStartTime(Date.now());
    startSession('CLOUD_VALLEY');
    setIsPlaying(true);
    setIsPaused(false);
    setScreen('GAMEPLAY');

    // Reset refs
    totalGameplayTicksRef.current = 0;
    calmGameplayTicksRef.current = 0;
    suddenMovementTicksRef.current = 0;
    holdPhaseTicksRef.current = 0;
    holdPhaseCalmTicksRef.current = 0;
    hasMovedInCurrentStepRef.current = false;
    stepsMovedCountRef.current = 0;
    holdTicksRef.current = 0;
    holdCalmTicksRef.current = 0;
  };

  // Translation helper
  const t = (key: string, variables?: Record<string, string | number>) => {
    let value = getTranslation(lang, key);
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }
    return value;
  };

  // SVG icons
  const renderStepIcon = (type: string, color = '#00B4D8') => {
    const iconSize = s(40);
    switch (type) {
      case 'hand':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
            <Path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" />
            <Path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v9" />
            <Path d="M6 14v1.5A5.5 5.5 0 0 0 11.5 21h3a5.5 5.5 0 0 0 5.5-5.5V11" />
          </Svg>
        );
      case 'both_hands':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <Circle cx="12" cy="7" r="4" />
            <Path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            <Path d="M4 11l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M20 11l-2 2 2 2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );
      case 'head':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <Circle cx="12" cy="8" r="4" />
            <Path d="M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
            <Path d="M8 5a2 2 0 0 1 8 0" strokeLinecap="round" />
          </Svg>
        );
      case 'stretch_arms':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="6" r="3" />
            <Path d="M12 9v7M5 12h14M9 20l3-4 3 4" />
          </Svg>
        );
      case 'balance':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <Path d="M12 3v18M5 12h14" strokeLinecap="round" />
            <Circle cx="12" cy="12" r="3" fill={color} />
          </Svg>
        );
      case 'breath':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <Circle cx="12" cy="12" r="9" />
            <Path d="M12 7v10M7 12h10" strokeLinecap="round" />
          </Svg>
        );
      default:
        return null;
    }
  };

  // ===== SCREENS =====
  const renderPermissionScreen = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.introScrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Title Section */}
      <View style={styles.introTitleWrap}>
        <Image
          source={require('../../assets/cloude_valley_title.png')}
          style={styles.introTitleImg}
          resizeMode="contain"
        />
        <Text style={styles.introSubtitle}>{t('cloudValley.description')}</Text>
      </View>

      <View style={styles.shieldCard}>
        <View style={styles.shieldBadge}>
          <Svg width={s(32)} height={s(32)} viewBox="0 0 24 24" fill="none">
            <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#02B3C9" />
            <Rect x="9" y="10" width="6" height="5" rx="1" fill="#FFF" />
            <Path d="M10 10V8a2 2 0 0 1 4 0v2" stroke="#FFF" strokeWidth="1.5" />
          </Svg>
        </View>

        <Text style={styles.shieldHeading}>{t('cloudValley.cameraMoves')}</Text>
        <View style={styles.divider} />

        <View style={styles.pointRow}>
          <View style={[styles.circleIconBg, { backgroundColor: '#E0F7FA' }]}>
            <Svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="#00A896" strokeWidth="2.5">
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
            <Svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="#EF5350" strokeWidth="2.5">
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
            <Svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="#EF5350" strokeWidth="2.5">
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

      <Animated.View style={[styles.permissionMascotWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <Image
          source={selectedExplorer.image}
          style={styles.permissionMascot}
          resizeMode="contain"
        />
      </Animated.View>

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
          <Text style={styles.btnUseCameraText}>{t('cloudValley.useCamera')} </Text>
          <ArrowRightIcon />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderGetReadyScreen = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.introScrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Title Section */}
      <View style={styles.introTitleWrap}>
        <Image
          source={require('../../assets/cloude_valley_title.png')}
          style={styles.introTitleImg}
          resizeMode="contain"
        />
        <Text style={styles.introSubtitle}>{t('cloudValley.description')}</Text>
      </View>

      <View style={styles.cardsRowWrapper}>
        <View style={styles.cardsRow}>
          <View style={styles.ruleCard}>
            <View style={[styles.cardBadge, { backgroundColor: '#4CAF50' }]}>
              <Text style={{ color: '#FFF', fontSize: f(13) }}>🌿</Text>
            </View>
            <View style={styles.ruleIconRoundBg}>
              <Svg width={isTablet ? s(54) : s(36)} height={isTablet ? s(54) : s(36)} viewBox="0 0 24 24" fill="none">
                <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93.03-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 1.76-.56 3.39-1.5 4.73z" fill="#A5D6A7" />
                <Path d="M6 14c0-2.5 3-4 6-4s6 1.5 6 4-2.5 3-6 3-6-1.5-6-3zm3 0c0 .8 1.3 1.5 3 1.5s3-.7 3-1.5-1.3-.8-3-.8-3 .3-3 .8z" fill="#4CAF50" />
              </Svg>
            </View>
            <Text style={styles.ruleCardLabel}>{t('cloudValley.safeSpace')}</Text>
          </View>

          <View style={styles.ruleCard}>
            <View style={[styles.cardBadge, { backgroundColor: '#FFC107' }]}>
              <Text style={{ color: '#FFF', fontSize: f(13) }}>🖐️</Text>
            </View>
            <View style={styles.ruleIconRoundBg}>
              <Svg width={isTablet ? s(54) : s(36)} height={isTablet ? s(54) : s(36)} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" fill="#FFE082" />
                <Path d="M12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="#FFB300" />
                <Path d="M12 5l1.5 4.5L18 11l-4.5 1.5L12 17l-1.5-4.5L6 11l4.5-1.5z" fill="#FFF" />
              </Svg>
            </View>
            <Text style={styles.ruleCardLabel}>{t('cloudValley.showYourHand')}</Text>
          </View>

          <View style={styles.ruleCard}>
            <View style={[styles.cardBadge, { backgroundColor: '#0288D1' }]}>
              <Text style={{ color: '#FFF', fontSize: f(13) }}>🐌</Text>
            </View>
            <View style={styles.ruleIconRoundBg}>
              <Svg width={isTablet ? s(54) : s(36)} height={isTablet ? s(54) : s(36)} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" fill="#90CAF9" />
                <Path d="M15 14h-6a3 3 0 0 0-3 3h12a3 3 0 0 0-3-3z" fill="#1565C0" />
                <Path d="M8 14a3 3 0 1 1 6 0" fill="#1E88E5" />
                <Path d="M13.5 11.5a1.5 1.5 0 1 1 3 0" fill="#90CAF9" />
              </Svg>
            </View>
            <Text style={styles.ruleCardLabel}>{t('cloudValley.moveSlowly')}</Text>
          </View>
        </View>
      </View>

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

      <View style={styles.readyFooterRow}>
        <Image
          source={selectedExplorer.image}
          style={styles.mascotReady}
          resizeMode="contain"
        />

        <View style={styles.woodSignpost}>
          <View style={styles.woodSignboard}>
            <Text style={{ fontSize: f(24), marginRight: s(6) }}>😴</Text>
            <Text style={styles.woodSignText}>Calm Moves</Text>
          </View>
          <View style={styles.woodSignPole} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.btnStartCalmMoves}
        activeOpacity={0.9}
        onPress={handleStartGame}
      >
        <Text style={styles.btnStartCalmMovesText}>{t('cloudValley.startCalmMoves')} </Text>
        <ArrowRightIcon />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderGameplayScreen = () => {
    const currentStep = stepsList[currentStepIndex];
    return (
      <View style={styles.playContainer}>
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

        <View style={styles.instructionBannerCard}>
          <View style={styles.instructionIconBadge}>
            {renderStepIcon(currentStep.iconType, '#00A896')}
          </View>
          <Text style={styles.instructionCardText}>{t(currentStep.instructionKey)}</Text>
          <Image
            source={selectedExplorer.image}
            style={styles.peekingMascotImage}
            resizeMode="contain"
          />
        </View>

        <Animated.View style={[
          styles.viewportWrapper,
          { transform: [{ translateX: shakeAnim }] }
        ]}>
          {useCamera ? (
            Platform.OS === 'web' ? (
              <View style={styles.webcamContainer}>
                <View ref={videoRef} style={styles.webcamVideoContainer} />
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
                    <Text style={styles.breathingText}>
                      {t(`cloudValley.breathing${breathingPhase.charAt(0) + breathingPhase.slice(1).toLowerCase()}`)}
                    </Text>
                  </Animated.View>

                  <View style={styles.progressBarWrapper}>
                    <Text style={styles.progressLabel}>{t('cloudValley.holdPose')}</Text>
                    <View style={styles.progressBarOutline}>
                      <View style={[styles.progressBarFill, { width: `${calmProgress}%` }]} />
                    </View>
                  </View>
                </View>
              </View>
            ) : (
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
                  <View style={styles.progressBarWrapper}>
                    <Text style={styles.progressLabel}>{t('cloudValley.holdPose')}</Text>
                    <View style={styles.progressBarOutline}>
                      <View style={[styles.progressBarFill, { width: `${calmProgress}%` }]} />
                    </View>
                  </View>
                  {isShaking && isSensorAvailable && (
                    <View style={styles.alertShakeCard}>
                      <Text style={styles.alertShakeText}>⚠️ {t('cloudValley.holdStill')}</Text>
                    </View>
                  )}
                </View>
              </CameraView>
            )
          ) : (
            <View style={styles.simulatedContainer}>
              <Svg width={s(140)} height={s(140)} viewBox="0 0 100 100" style={{ opacity: 0.85 }}>
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

        <View style={styles.statusInstructionPill}>
          <Text style={{ fontSize: f(18), marginRight: s(8) }}>🐌</Text>
          <Text style={styles.statusInstructionText}>{t('cloudValley.moveSlowly')}</Text>
        </View>

        <TouchableOpacity
          style={styles.btnGameplayPause}
          onPress={() => setIsPaused(!isPaused)}
        >
          <Text style={styles.btnGameplayPauseText}>
            {isPaused ? `▶  ${t('cloudValley.resume')}` : `❚❚  ${t('cloudValley.pause')}`}
          </Text>
        </TouchableOpacity>

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

  const getADHDFeedback = () => {
    let posturalText = '';
    if (smoothMovesScore > 80) {
      posturalText = t('cloudValley.evalPosturalHigh');
    } else if (smoothMovesScore > 50) {
      posturalText = t('cloudValley.evalPosturalMed');
    } else {
      posturalText = t('cloudValley.evalPosturalLow');
    }

    let inhibitoryText = '';
    if (goodFocusScore > 75) {
      inhibitoryText = t('cloudValley.evalInhibitoryHigh');
    } else {
      inhibitoryText = t('cloudValley.evalInhibitoryLow');
    }

    let syncText = '';
    if (calmMomentsScore > 70) {
      syncText = t('cloudValley.evalSyncHigh');
    } else {
      syncText = t('cloudValley.evalSyncLow');
    }

    let participationText = '';
    if (activeParticipationScore > 75) {
      participationText = t('cloudValley.evalParticipationHigh');
    } else {
      participationText = t('cloudValley.evalParticipationLow');
    }

    return { posturalText, inhibitoryText, syncText, participationText };
  };

  const getSimpleLabel = (score: number) => {
    if (score >= 80) return 'Great! 🌟';
    if (score >= 50) return 'Good! 👍';
    return 'Nice! ✨';
  };

  const renderResultsScreen = () => (
    <ScrollView
      style={styles.resultsScroll}
      contentContainerStyle={styles.resultsScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.resultsTitle}>{t('cloudValley.greatJob')}</Text>
      <Text style={styles.resultsSubtitle}>{t('cloudValley.bridgeComplete')}</Text>

      <View style={styles.resultsLayoutRow}>
        <Image
          source={selectedExplorer.image}
          style={styles.celebrationMascot}
          resizeMode="contain"
        />

        <View style={styles.scoreResultBadge}>
          <Text style={styles.scoreBadgeLabel}>{t('cloudValley.calmScore')}</Text>
          <Text style={styles.scoreBadgeNumber}>{finalCalmScore}</Text>

          <View style={styles.scoreStarsRow}>
            <Text style={{ fontSize: f(22), color: '#FFB300' }}>⭐</Text>
            <Text style={{ fontSize: f(30), color: '#FFB300', marginHorizontal: s(3), marginTop: -s(3) }}>⭐</Text>
            <Text style={{ fontSize: f(22), color: '#FFB300' }}>⭐</Text>
          </View>
        </View>
      </View>

      <View style={styles.feedbackRow}>
        <View style={styles.feedbackCardItem}>
          <View style={[styles.feedbackBadgeIconBg, { backgroundColor: '#E0F7FA' }]}>
            <Text style={{ fontSize: f(22) }}>☁️</Text>
          </View>
          <Text style={styles.feedbackCardLabel}>{t('cloudValley.smoothMoves')}</Text>
          <Text style={styles.feedbackCardValue}>{getSimpleLabel(smoothMovesScore)}</Text>
        </View>

        <View style={styles.feedbackCardItem}>
          <View style={[styles.feedbackBadgeIconBg, { backgroundColor: '#E8F5E9' }]}>
            <Text style={{ fontSize: f(22) }}>🌿</Text>
          </View>
          <Text style={styles.feedbackCardLabel}>{t('cloudValley.goodFocus')}</Text>
          <Text style={styles.feedbackCardValue}>{getSimpleLabel(goodFocusScore)}</Text>
        </View>

        <View style={styles.feedbackCardItem}>
          <View style={[styles.feedbackBadgeIconBg, { backgroundColor: '#F3E5F5' }]}>
            <Text style={{ fontSize: f(22) }}>💜</Text>
          </View>
          <Text style={styles.feedbackCardLabel}>{t('cloudValley.calmMoments')}</Text>
          <Text style={styles.feedbackCardValue}>{getSimpleLabel(calmMomentsScore)}</Text>
        </View>
      </View>

      <View style={styles.rewardCard}>
        <View style={styles.rewardCardIconBg}>
          <Text style={{ fontSize: f(36) }}>{finalCalmScore >= activeLevelConfig.targetScore ? '🌸' : '💧'}</Text>
        </View>
        <View style={styles.rewardCardTextWrapper}>
          <Text style={styles.rewardCardTitle}>
            {finalCalmScore >= activeLevelConfig.targetScore ? 'You earned a flower!' : 'You earned a water drop!'}
          </Text>
          <Text style={styles.rewardCardDesc}>Your Focus Garden is growing!</Text>
        </View>
      </View>

      <View style={styles.resultsButtonsWrapper}>
        <TouchableOpacity
          style={styles.btnNextAdventure}
          activeOpacity={0.9}
          onPress={handleBack}
        >
          <Text style={styles.btnNextAdventureText}>{t('cloudValley.nextAdventure')} </Text>
          <ArrowRightIcon />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnPlayAgainResult}
          activeOpacity={0.8}
          onPress={handlePlayAgain}
        >
          <Text style={styles.btnPlayAgainResultText}>{t('cloudValley.playAgain')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <ImageBackground
      source={require('../../assets/cloud_valley_background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerCircledButton}
            onPress={handleBack}
          >
            <Svg width={s(22)} height={s(22)} viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>

          {screen === 'GAMEPLAY' && (
            <View style={styles.headerTitleBox}>
              <View style={styles.headerTitleIconBg}>
                <Text style={{ fontSize: f(15) }}>😴</Text>
              </View>
              <View>
                <Text style={styles.headerMainTitle}>{t('cloudValley.title')}</Text>
                <Text style={styles.headerSubTitle}>
                  {t('cloudValley.description')}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.headerRightControlsRow}>
            <TouchableOpacity
              style={[styles.headerCircledButton, { marginRight: s(8) }]}
              onPress={() => setIsPaused(true)}
              disabled={screen !== 'GAMEPLAY'}
            >
              <Text style={{ fontSize: f(15), fontWeight: 'bold', color: '#5C4033' }}>❚❚</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerCircledButton}>
              <Svg width={s(18)} height={s(18)} viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="2.5">
                <Path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinejoin="round" />
                <Path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

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

// ==================== STYLES (with scaling) ====================
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: Platform.OS === 'web' ? s(10) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingTop: s(6),
    paddingBottom: s(6),
    zIndex: 10,
  },
  headerCircledButton: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
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
    paddingVertical: s(6),
    paddingHorizontal: s(16),
    borderRadius: s(24),
    borderWidth: 2,
    borderColor: '#ECE0CE',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleIconBg: {
    marginRight: s(8),
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMainTitle: {
    fontSize: f(16),
    fontWeight: '900',
    color: '#00796B',
  },
  headerSubTitle: {
    fontSize: f(11),
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
    paddingHorizontal: s(16),
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(10),
  },
  shieldCard: {
    width: '100%',
    backgroundColor: '#FFFDF6',
    borderRadius: s(28),
    borderWidth: 3.5,
    borderColor: '#E6D7BD',
    paddingHorizontal: s(20),
    paddingTop: s(28),
    paddingBottom: s(16),
    position: 'relative',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: s(6),
  },
  shieldBadge: {
    position: 'absolute',
    top: -s(26),
    left: '50%',
    marginLeft: -s(26),
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    backgroundColor: '#FFF',
    borderWidth: 3.5,
    borderColor: '#E6D7BD',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  shieldHeading: {
    fontSize: f(20),
    fontWeight: '900',
    color: '#00796B',
    textAlign: 'center',
    marginVertical: s(8),
  },
  divider: {
    height: 2,
    backgroundColor: '#F5EBD6',
    marginVertical: s(12),
    width: '100%',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(10),
  },
  circleIconBg: {
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  pointTextContainer: {
    flex: 1,
  },
  pointTitle: {
    fontSize: f(15),
    fontWeight: '800',
    color: '#3E2723',
  },
  pointDesc: {
    fontSize: f(12),
    color: '#6D4C41',
    fontWeight: '600',
  },
  permissionMascotWrapper: {
    marginVertical: s(8),
  },
  permissionMascot: {
    width: SCREEN_WIDTH * 0.24,
    height: SCREEN_WIDTH * 0.28,
    maxWidth: s(100),
    maxHeight: s(120),
  },
  permissionButtonsWrapper: {
    width: '100%',
    gap: s(10),
    marginBottom: s(10),
  },
  btnUseCamera: {
    backgroundColor: '#02B3C9',
    borderRadius: s(25),
    borderWidth: 2,
    borderColor: '#00838F',
    flexDirection: 'row',
    paddingVertical: s(14),
    paddingHorizontal: s(24),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00838F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    gap: s(8),
  },
  btnUseCameraText: {
    color: '#FFFFFF',
    fontSize: f(18),
    fontWeight: '800',
  },
  readyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(10),
  },
  cardsRowWrapper: {
    width: '100%',
    marginVertical: s(8),
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: s(4),
  },
  ruleCard: {
    width: isTablet ? s(190) : (SCREEN_WIDTH - s(48)) / 3,
    backgroundColor: '#FFFDF9',
    borderRadius: s(20),
    borderWidth: 3,
    borderColor: '#E6D7BD',
    paddingVertical: s(12),
    paddingHorizontal: s(6),
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
    top: -s(13),
    left: '50%',
    marginLeft: -s(13),
    width: s(26),
    height: s(26),
    borderRadius: s(13),
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
    width: isTablet ? s(70) : s(48),
    height: isTablet ? s(70) : s(48),
    borderRadius: isTablet ? s(35) : s(24),
    backgroundColor: '#F9F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(6),
  },
  ruleCardLabel: {
    fontSize: isTablet ? f(14) : f(11),
    fontWeight: '900',
    color: '#5C4033',
    textAlign: 'center',
    lineHeight: isTablet ? f(18) : f(14),
  },
  levelSelectorContainer: {
    width: '100%',
    backgroundColor: '#FFFDF4',
    borderWidth: 2,
    borderColor: '#E6D7BD',
    borderRadius: s(20),
    padding: s(12),
    alignItems: 'center',
    marginVertical: s(10),
  },
  levelSelectorHeading: {
    fontSize: f(14),
    fontWeight: '800',
    color: '#00796B',
    marginBottom: s(8),
  },
  levelButtonsRow: {
    flexDirection: 'row',
    gap: s(8),
    marginBottom: s(8),
  },
  levelPillBtn: {
    flex: 1,
    backgroundColor: '#FFFDF9',
    borderWidth: 2,
    borderColor: '#E6D7BD',
    borderRadius: s(16),
    paddingVertical: s(10),
    paddingHorizontal: s(2),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  levelPillBtnActive: {
    backgroundColor: '#02B3C9',
    borderColor: '#02B3C9',
    shadowColor: '#02B3C9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  levelPillText: {
    fontSize: isTablet ? f(13) : f(11),
    fontWeight: '900',
    color: '#7A5C4F',
    textAlign: 'center',
  },
  levelPillTextActive: {
    color: '#FFF',
  },
  levelDescriptionPill: {
    fontSize: f(12),
    color: '#7A5C4F',
    fontWeight: '700',
  },
  readyFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    marginVertical: s(8),
  },
  mascotReady: {
    width: SCREEN_WIDTH * 0.22,
    height: SCREEN_WIDTH * 0.26,
    maxWidth: s(95),
    maxHeight: s(115),
  },
  woodSignpost: {
    alignItems: 'center',
  },
  woodSignboard: {
    backgroundColor: '#8D6E63',
    borderWidth: 3,
    borderColor: '#5D4037',
    borderRadius: s(8),
    paddingVertical: s(6),
    paddingHorizontal: s(12),
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
    fontSize: f(15),
    fontWeight: '900',
  },
  woodSignPole: {
    width: s(8),
    height: s(35),
    backgroundColor: '#5D4037',
  },
  btnStartCalmMoves: {
    backgroundColor: '#02B3C9',
    borderRadius: s(25),
    borderWidth: 2,
    borderColor: '#00838F',
    width: '100%',
    paddingVertical: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00838F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: s(10),
    gap: s(8),
  },
  btnStartCalmMovesText: {
    color: '#FFFFFF',
    fontSize: f(18),
    fontWeight: '800',
  },
  playContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: s(8),
  },
  stepHeaderCard: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: s(24),
    borderWidth: 2,
    borderColor: '#E6D7BD',
    paddingVertical: s(8),
    paddingHorizontal: s(16),
    alignItems: 'center',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepHeaderText: {
    fontSize: f(14),
    fontWeight: '800',
    color: '#00796B',
    marginBottom: s(4),
  },
  stepDotsRow: {
    flexDirection: 'row',
    gap: s(8),
  },
  stepProgressDot: {
    width: s(12),
    height: s(12),
    borderRadius: s(6),
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
    borderRadius: s(24),
    borderWidth: 3,
    borderColor: '#ECE0CE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s(12),
    paddingHorizontal: s(16),
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: s(6),
  },
  instructionIconBadge: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  instructionCardText: {
    flex: 1,
    fontSize: f(16),
    fontWeight: '900',
    color: '#3E2723',
  },
  peekingMascotImage: {
    width: s(60),
    height: s(70),
    position: 'absolute',
    right: s(4),
    top: -s(24),
  },
  viewportWrapper: {
    flex: 1,
    width: '100%',
    maxHeight: isTablet ? s(380) : s(340),
    aspectRatio: isTablet ? 1.2 : 0.95,
    borderRadius: s(32),
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    backgroundColor: '#000',
    marginVertical: s(6),
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
    padding: s(16),
  },
  breathingIndicator: {
    width: s(76),
    height: s(76),
    borderRadius: s(38),
    borderWidth: 4,
    borderColor: '#FFF',
    alignSelf: 'center',
    marginTop: isTablet ? s(25) : s(35),
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
    width: s(84),
    height: s(84),
    borderRadius: s(42),
    borderWidth: 4,
    borderColor: '#02B3C9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 179, 201, 0.2)',
    marginVertical: s(12),
  },
  breathingText: {
    color: '#FFFFFF',
    fontSize: f(10),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  progressBarWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: s(12),
    marginBottom: s(6),
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: f(12),
    fontWeight: '900',
    marginBottom: s(4),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBarOutline: {
    width: '100%',
    height: s(12),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: s(6),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00E676',
    borderRadius: s(6),
  },
  alertShakeCard: {
    position: 'absolute',
    top: s(15),
    left: '10%',
    right: '10%',
    backgroundColor: 'rgba(211, 47, 47, 0.95)',
    borderRadius: s(16),
    paddingVertical: s(6),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  alertShakeText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: f(12),
  },
  simulatedContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: s(16),
  },
  statusInstructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF0',
    paddingVertical: s(8),
    paddingHorizontal: s(20),
    borderRadius: s(24),
    borderWidth: 2,
    borderColor: '#F2E2C9',
    marginVertical: s(4),
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statusInstructionText: {
    color: '#5C4033',
    fontSize: f(14),
    fontWeight: '800',
  },
  btnGameplayPause: {
    backgroundColor: '#02B3C9',
    borderRadius: s(28),
    borderWidth: 2,
    borderColor: '#00838F',
    paddingVertical: s(12),
    paddingHorizontal: s(36),
    shadowColor: '#00838F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  btnGameplayPauseText: {
    color: '#FFF',
    fontSize: f(18),
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
    borderRadius: s(24),
    borderWidth: 3.5,
    borderColor: '#ECE0CE',
    padding: s(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  modalPauseHeading: {
    fontSize: f(20),
    fontWeight: '900',
    color: '#00796B',
    marginBottom: s(20),
  },
  modalPauseBtn: {
    backgroundColor: '#02B3C9',
    borderWidth: 2,
    borderColor: '#00838F',
    borderRadius: s(24),
    width: '100%',
    paddingVertical: s(12),
    alignItems: 'center',
    marginBottom: s(12),
  },
  modalPauseExitBtn: {
    backgroundColor: '#EF5350',
    borderColor: '#C62828',
  },
  modalPauseBtnText: {
    color: '#FFF',
    fontSize: f(16),
    fontWeight: '900',
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(10),
  },
  resultsScroll: {
    flex: 1,
    width: '100%',
  },
  resultsScrollContent: {
    alignItems: 'center',
    paddingVertical: s(10),
    paddingBottom: s(30),
  },
  resultsTitle: {
    fontSize: f(32),
    fontWeight: '900',
    color: '#00796B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  resultsSubtitle: {
    fontSize: f(16),
    fontWeight: '800',
    color: '#5C4033',
    marginBottom: s(8),
  },
  resultsLayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
    marginVertical: s(8),
  },
  celebrationMascot: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.4,
    maxWidth: s(150),
    maxHeight: s(170),
  },
  scoreResultBadge: {
    backgroundColor: '#FFFDF4',
    borderWidth: 3.5,
    borderColor: '#ECE0CE',
    borderRadius: s(32),
    padding: s(24),
    alignItems: 'center',
    width: '55%',
    maxWidth: 240,
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  scoreBadgeLabel: {
    fontSize: f(16),
    fontWeight: '800',
    color: '#7A5C4F',
    marginBottom: s(4),
  },
  scoreBadgeNumber: {
    fontSize: f(58),
    fontWeight: '900',
    color: '#00796B',
    marginVertical: s(4),
    lineHeight: f(64),
  },
  scoreStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: s(10),
    gap: s(8),
  },
  feedbackCardItem: {
    flex: 1,
    backgroundColor: '#FFFDF9',
    borderWidth: 2,
    borderColor: '#ECE0CE',
    borderRadius: s(20),
    padding: s(8),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  feedbackBadgeIconBg: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(4),
  },
  feedbackCardLabel: {
    fontSize: f(10),
    fontWeight: '800',
    color: '#6D4C41',
    textAlign: 'center',
    marginBottom: s(2),
  },
  feedbackCardValue: {
    fontSize: f(13),
    fontWeight: '900',
    color: '#00796B',
    textAlign: 'center',
  },
  rewardCard: {
    backgroundColor: '#E0F7FA',
    borderWidth: 2.5,
    borderColor: '#B2EBF2',
    borderRadius: s(24),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s(16),
    paddingHorizontal: s(20),
    width: '100%',
    marginBottom: s(20),
    shadowColor: '#00838F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  rewardCardIconBg: {
    width: s(54),
    height: s(54),
    borderRadius: s(27),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(16),
    shadowColor: '#00838F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  rewardCardTextWrapper: {
    flex: 1,
  },
  rewardCardTitle: {
    color: '#006064',
    fontSize: f(17),
    fontWeight: '900',
    marginBottom: s(2),
  },
  rewardCardDesc: {
    color: '#00838F',
    fontSize: f(13),
    fontWeight: '700',
  },
  resultsButtonsWrapper: {
    width: '100%',
    gap: s(8),
  },
  btnNextAdventure: {
    backgroundColor: '#02B3C9',
    borderRadius: s(25),
    borderWidth: 2,
    borderColor: '#00838F',
    width: '100%',
    paddingVertical: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00838F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    flexDirection: 'row',
    gap: s(8),
  },
  btnNextAdventureText: {
    color: '#FFFFFF',
    fontSize: f(18),
    fontWeight: '800',
  },
  btnPlayAgainResult: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(25),
    borderWidth: 2.5,
    borderColor: '#ECE0CE',
    width: '100%',
    paddingVertical: s(12),
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
    fontSize: f(16),
    fontWeight: '800',
  },
  introScrollContent: {
    flexGrow: 1,
    paddingHorizontal: s(16),
    paddingTop: s(10),
    paddingBottom: s(45),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  introTitleWrap: {
    alignItems: 'center',
    marginTop: s(5),
    marginBottom: s(32),
    width: '100%',
  },
  introTitleImg: {
    width: SCREEN_WIDTH * 0.98,
    height: s(160),
    marginVertical: s(4),
  },
  introSubtitle: {
    fontSize: f(15),
    fontWeight: '700',
    color: '#37474F',
    textAlign: 'center',
    marginTop: s(2),
  },
});