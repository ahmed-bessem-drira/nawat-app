import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect, Polygon, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';

const { width: SW, height: SH } = Dimensions.get('window');

// ── EXPLORER MOCK DATA (Fallback) ──────────────────────────────────────
const EXPLORERS = [
  { id: 'avatar_1', name: 'Nawat', image: require('../../assets/nawat_character.png') },
  { id: 'avatar_2', name: 'Zahra', image: require('../../assets/zahra_placeholder.png') },
  { id: 'avatar_3', name: 'Sami', image: require('../../assets/sami_placeholder.png') },
  { id: 'avatar_4', name: 'Lulu', image: require('../../assets/lulu_placeholder.png') },
];

// ── ICONS & SVGS ───────────────────────────────────────────────────────
const BackArrowIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);
const PauseIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10 4H6v16h4V4zM18 4h-4v16h4V4z" />
  </Svg>
);
const SoundIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </Svg>
);
const LeafIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="#4CAF50" />
    <Path d="M2 22l8-8" />
  </Svg>
);
const ClockIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0077B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);
const GamepadIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#673AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 12h4M8 10v4M15 13h.01M18 11h.01" />
    <Rect x="2" y="6" width="20" height="12" rx="4" />
  </Svg>
);
const MagnifyingGlassIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#673AB7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Path d="M21 21l-4.35-4.35" />
    <Path d="M11 8v.01" />
  </Svg>
);
const BookIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0077B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Svg>
);
const ArrowRightIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);
const RefreshIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0077B6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 4v6h-6M1 20v-6h6" />
    <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </Svg>
);
const CheckCircleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#4CAF50" />
    <Path d="M8 12l3 3 5-6" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CrossCircleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Polygon points="12 2 22 8.5 18.5 20 5.5 20 2 8.5" fill="#EF5350" />
    <Path d="M15 9l-6 6M9 9l6 6" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ShieldIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#673AB7" />
    <Path d="M9 12l2 2 4-4" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const StarIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="#FFC107">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
  </Svg>
);

// Built-in node graphics for safety
const GreenNodeSvg = () => (
  <Svg width="70" height="70" viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="45" fill="#4CAF50" stroke="#388E3C" strokeWidth="4" />
    <Circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
    <Circle cx="35" cy="40" r="4" fill="#1B5E20" />
    <Circle cx="65" cy="40" r="4" fill="#1B5E20" />
    <Path d="M 40 60 Q 50 70 60 60" fill="none" stroke="#1B5E20" strokeWidth="4" strokeLinecap="round" />
  </Svg>
);

const RedNodeSvg = () => (
  <Svg width="70" height="70" viewBox="0 0 100 100">
    <Polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" fill="#EF5350" stroke="#C62828" strokeWidth="4" />
    <Polygon points="33,10 67,10 90,33 90,67 67,90 33,90 10,67 10,33" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
    <Circle cx="35" cy="45" r="4" fill="#4A148C" />
    <Circle cx="65" cy="45" r="4" fill="#4A148C" />
    <Path d="M 40 65 Q 50 55 60 65" fill="none" stroke="#4A148C" strokeWidth="4" strokeLinecap="round" />
    <Path d="M 30 35 L 45 40" stroke="#4A148C" strokeWidth="3" strokeLinecap="round" />
    <Path d="M 70 35 L 55 40" stroke="#4A148C" strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

const YellowNodeSvg = () => (
  <Svg width="70" height="70" viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="45" fill="#FFCA28" stroke="#F57F17" strokeWidth="4" />
    <Circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
    <Circle cx="35" cy="45" r="4" fill="#5D4037" />
    <Circle cx="65" cy="45" r="4" fill="#5D4037" />
    <Path d="M 45 60 L 55 60" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
  </Svg>
);

type ScreenState = 'INTRO' | 'GAMEPLAY' | 'RESULTS';
type ColorType = 'GREEN' | 'RED' | 'YELLOW';

export default function GateOfPatienceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedAvatar?: string }>();
  const { startSession, endSession, clearSession, rewards } = useGameStore();
  const { child } = useChildStore();

  const selectedAvatarId = params.selectedAvatar || 'avatar_1';
  const selectedExplorer = EXPLORERS.find((e) => e.id === selectedAvatarId) || EXPLORERS[0];

  const [screen, setScreen] = useState<ScreenState>('INTRO');

  // Game Logic State
  const TOTAL_ROUNDS = 8;
  const [currentRound, setCurrentRound] = useState(1);
  const [activeColor, setActiveColor] = useState<ColorType | null>(null);
  const [isYellowWaitPhase, setIsYellowWaitPhase] = useState(false);
  const [timeLeft, setTimeLeft] = useState(100); // 100% for progress bar

  // Stats
  const [stats, setStats] = useState({
    rightTaps: 0,
    wrongTaps: 0,
    missed: 0,
    goodWaits: 0,
  });

  const [message, setMessage] = useState("Wait first. Then make your move.");
  const [isPaused, setIsPaused] = useState(false);

  // Timers & Refs
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isYellowWaitPhaseRef = useRef(false);

  // Animations
  const nodeScale = useRef(new Animated.Value(1)).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const clearTimers = () => {
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  const runHaptic = (type: 'success' | 'error' | 'light') => {
    if (Platform.OS !== 'web') {
      if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStartGame = () => {
    setStats({ rightTaps: 0, wrongTaps: 0, missed: 0, goodWaits: 0 });
    setCurrentRound(1);
    setScreen('GAMEPLAY');
    startSession('GATE_OF_PATIENCE');
    startRound();
  };

  const startRound = () => {
    clearTimers();
    setTimeLeft(100);
    setIsYellowWaitPhase(false);
    isYellowWaitPhaseRef.current = false;

    // Pick random color
    const colors: ColorType[] = ['GREEN', 'RED', 'YELLOW'];
    const selectedColor = colors[Math.floor(Math.random() * colors.length)];
    setActiveColor(selectedColor);

    // Set message
    if (selectedColor === 'GREEN') setMessage("Great! Tap the green one!");
    else if (selectedColor === 'RED') setMessage("Careful, wait on red.");
    else setMessage("Wait briefly, then tap!");

    // Pulse animation
    Animated.sequence([
      Animated.timing(nodeScale, { toValue: 1.15, duration: 200, useNativeDriver: true }),
      Animated.timing(nodeScale, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();

    // Setup round timeout
    let duration = 2500;
    if (selectedColor === 'YELLOW') {
      duration = 3500;
      setIsYellowWaitPhase(true);
      isYellowWaitPhaseRef.current = true;
      // Change to active after wait
      setTimeout(() => {
        setIsYellowWaitPhase(false);
        isYellowWaitPhaseRef.current = false;
        setMessage("NOW! Tap yellow!");
        runHaptic('light');
        Animated.sequence([
          Animated.timing(nodeScale, { toValue: 1.1, duration: 150, useNativeDriver: true }),
          Animated.timing(nodeScale, { toValue: 1, duration: 150, useNativeDriver: true })
        ]).start();
      }, 1500);
    }

    // Progress bar tick
    const tickRate = 50;
    const dropPerTick = 100 / (duration / tickRate);
    progressTimerRef.current = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - dropPerTick));
    }, tickRate);

    // End of round timeout
    roundTimerRef.current = setTimeout(() => {
      handleTimeout(selectedColor);
    }, duration);
  };

  const handleTimeout = (color: ColorType) => {
    if (color === 'GREEN') {
      // Missed
      setStats(s => ({ ...s, missed: s.missed + 1 }));
      runHaptic('error');
    } else if (color === 'RED') {
      // Good wait!
      setStats(s => ({ ...s, goodWaits: s.goodWaits + 1 }));
      runHaptic('success');
    } else if (color === 'YELLOW') {
      // Missed the tap window
      setStats(s => ({ ...s, missed: s.missed + 1 }));
      runHaptic('error');
    }

    proceedToNextRound();
  };

  const handleNodeTap = (tappedColor: ColorType) => {
    clearTimers();

    if (tappedColor === 'GREEN' && activeColor === 'GREEN') {
      setStats(s => ({ ...s, rightTaps: s.rightTaps + 1 }));
      runHaptic('success');
    } else if (tappedColor === 'RED' && activeColor === 'RED') {
      setStats(s => ({ ...s, wrongTaps: s.wrongTaps + 1 }));
      runHaptic('error');
      setMessage("Oops! You shouldn't tap red.");
    } else if (tappedColor === 'YELLOW' && activeColor === 'YELLOW') {
      if (isYellowWaitPhaseRef.current) {
        // Tapped too early
        setStats(s => ({ ...s, wrongTaps: s.wrongTaps + 1 }));
        runHaptic('error');
        setMessage("Too early! Wait next time.");
      } else {
        // Tapped correctly after wait
        setStats(s => ({ ...s, rightTaps: s.rightTaps + 1, goodWaits: s.goodWaits + 1 }));
        runHaptic('success');
      }
    } else {
      // Tapped wrong color entirely
      setStats(s => ({ ...s, wrongTaps: s.wrongTaps + 1 }));
      runHaptic('error');
    }

    setTimeout(proceedToNextRound, 500); // brief pause to see outcome
  };

  const proceedToNextRound = () => {
    setActiveColor(null);
    setCurrentRound(prev => {
      const next = prev + 1;
      if (next > TOTAL_ROUNDS) {
        finishGame();
        return prev;
      }
      setTimeout(startRound, 800);
      return next;
    });
  };

  const finishGame = async () => {
    setScreen('RESULTS');

    // Calculate Score
    const baseScore = stats.rightTaps * 10 + stats.goodWaits * 5 - stats.wrongTaps * 5;
    const finalScore = Math.max(0, Math.min(100, Math.round((baseScore / ((TOTAL_ROUNDS) * 10)) * 100)));

    endSession({
      accuracy: finalScore,
      correctInhibition: stats.goodWaits,
      impulsiveResponses: stats.wrongTaps,
    });

    if (child) {
      const sessionId = Date.now().toString();
      try {
        await databaseService.insert('session', {
          id: sessionId,
          child_id: child.id,
          game_type: 'GATE_OF_PATIENCE',
          duration: 120, // Approx
          synced: 0,
          created_at: Date.now(),
        });

        await databaseService.insert('game_metrics', {
          id: Date.now().toString() + '_metrics',
          session_id: sessionId,
          child_id: child.id,
          game_type: 'GATE_OF_PATIENCE',
          accuracy: finalScore,
          correct_inhibition: stats.goodWaits,
          impulsive_responses: stats.wrongTaps,
          synced: 0,
          created_at: Date.now(),
        });

        if (finalScore > 50) rewards.addWaterDrop();
        if (finalScore > 80) rewards.addFlower();
      } catch (e) {
        console.error('Error saving metrics', e);
      }
    }
  };

  const handleBack = () => {
    clearTimers();
    clearSession();
    if (router.canGoBack()) router.back();
    else router.replace('/village-map');
  };

  // ── RENDER STATES ──────────────────────────────────────────────────────

  if (screen === 'INTRO') {
    return (
      <View style={s.screen}>
        <Image source={require('../../assets/gate_background.png')} style={s.bg} resizeMode="cover" />
        <StatusBar style="dark" />
        <SafeAreaView style={s.safe}>
          {/* Top Nav */}
          <View style={s.topNav}>
            <TouchableOpacity style={s.iconBtn} onPress={handleBack}><BackArrowIcon /></TouchableOpacity>
            <View style={s.rightNav}>
              <TouchableOpacity style={s.iconBtn}><PauseIcon /></TouchableOpacity>
              <TouchableOpacity style={s.iconBtn}><SoundIcon /></TouchableOpacity>
            </View>
          </View>

          <View style={s.introBody}>
            {/* Title Area */}
            <View style={s.titleWrap}>
              <Image source={require('../../assets/gate_patience_title.png')} style={s.titleImg} resizeMode="contain" />
              <Text style={s.subtitleText}>Wait, watch, then tap</Text>
            </View>

            {/* Instruction Card */}
            <View style={s.introCard}>
              <View style={s.introRow}>
                <LeafIcon />
                <View style={s.introTextWrap}>
                  <Text style={s.introMainText}>
                    Tap <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>green</Text>. Wait on <Text style={{ color: '#F44336', fontWeight: 'bold' }}>red</Text>.
                  </Text>
                  <Text style={s.introSubText}>Pause, then tap on <Text style={{ color: '#F57F17', fontWeight: 'bold' }}>yellow</Text>.</Text>
                </View>
              </View>
            </View>

            {/* Pills */}
            <View style={s.pillsRow}>
              <View style={s.pill}><ClockIcon /><Text style={s.pillText}>Time: 2 min</Text></View>
              <View style={s.pill}><GamepadIcon /><Text style={s.pillText}>Patience game</Text></View>
            </View>

            {/* Preview Graphics */}
            <View style={s.previewArea}>
              <Image source={selectedExplorer.image} style={s.explorerImage} resizeMode="contain" />
              <Image source={require('../../assets/gate_door_image.png')} style={s.gateImage} resizeMode="contain" />

              <View style={s.nodePreviewsRow}>
                <View style={s.nodePreviewItem}>
                  <GreenNodeSvg />
                  <View style={s.nodeLabel}><Text style={s.nodeLabelText}>TAP NOW</Text></View>
                </View>
                <View style={s.nodePreviewItem}>
                  <RedNodeSvg />
                  <View style={s.nodeLabel}><Text style={s.nodeLabelText}>WAIT</Text></View>
                </View>
                <View style={s.nodePreviewItem}>
                  <YellowNodeSvg />
                  <View style={s.nodeLabel}><Text style={s.nodeLabelText}>WAIT, THEN TAP</Text></View>
                </View>
              </View>
            </View>

            {/* Bottom Section */}
            <View style={s.bottomBox}>
              <View style={s.tipCard}>
                <MagnifyingGlassIcon />
                <Text style={s.tipText}>Look carefully before you tap.</Text>
              </View>

              <View style={s.actionsRow}>
                <TouchableOpacity style={s.btnPractice} activeOpacity={0.8}>
                  <BookIcon /><Text style={s.btnPracticeText}>Practice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnStart} activeOpacity={0.8} onPress={handleStartGame}>
                  <Text style={s.btnStartText}>Start Game</Text><ArrowRightIcon />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (screen === 'GAMEPLAY') {
    return (
      <View style={s.screen}>
        <Image source={require('../../assets/gate_background.png')} style={s.bg} resizeMode="cover" />
        <StatusBar style="dark" />
        <SafeAreaView style={s.safe}>
          {/* Top Nav */}
          <View style={s.topNav}>
            <TouchableOpacity style={s.iconBtn} onPress={handleBack}><BackArrowIcon /></TouchableOpacity>
            <View style={s.rightNav}>
              <TouchableOpacity style={s.iconBtn} onPress={() => setIsPaused(!isPaused)}><PauseIcon /></TouchableOpacity>
              <TouchableOpacity style={s.iconBtn}><SoundIcon /></TouchableOpacity>
            </View>
          </View>

          <View style={s.playBody}>
            {/* Header */}
            <Image source={require('../../assets/gate_patience_title.png')} style={s.smallTitleImg} resizeMode="contain" />
            <Text style={s.subtitleText}>Tap only at the right time</Text>

            {/* Instruction Card */}
            <View style={s.playCard}>
              <Text style={s.playMainInstr}>
                <LeafIcon /> <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Green</Text> = tap now
              </Text>
              <Text style={s.playSubInstr}>Wait for green. Don't tap <Text style={{ color: '#F44336' }}>red</Text> or <Text style={{ color: '#F57F17' }}>yellow</Text>!</Text>
            </View>

            {/* Round info */}
            <View style={s.roundRow}>
              <View style={s.roundPill}><Text style={s.roundText}>Round {currentRound} of {TOTAL_ROUNDS}</Text></View>
              <View style={s.timerBarWrap}>
                <ClockIcon />
                <View style={s.timerBarBg}>
                  <View style={[s.timerBarFill, { width: `${timeLeft}%` }]} />
                </View>
              </View>
            </View>

            {/* Nodes Area */}
            <View style={s.nodesGameArea}>
              {/* Green */}
              <TouchableOpacity
                style={[s.gameNodeWrap, activeColor === 'GREEN' && s.nodeActiveGlowGreen]}
                activeOpacity={0.8}
                onPress={() => handleNodeTap('GREEN')}
              >
                <Animated.View style={activeColor === 'GREEN' ? { transform: [{ scale: nodeScale }] } : {}}>
                  <GreenNodeSvg />
                </Animated.View>
              </TouchableOpacity>

              {/* Red */}
              <TouchableOpacity
                style={[s.gameNodeWrap, activeColor === 'RED' && s.nodeActiveGlowRed]}
                activeOpacity={0.8}
                onPress={() => handleNodeTap('RED')}
              >
                <Animated.View style={activeColor === 'RED' ? { transform: [{ scale: nodeScale }] } : {}}>
                  <RedNodeSvg />
                </Animated.View>
              </TouchableOpacity>

              {/* Yellow */}
              <TouchableOpacity
                style={[s.gameNodeWrap, activeColor === 'YELLOW' && s.nodeActiveGlowYellow]}
                activeOpacity={0.8}
                onPress={() => handleNodeTap('YELLOW')}
              >
                <Animated.View style={activeColor === 'YELLOW' ? { transform: [{ scale: nodeScale }] } : {}}>
                  <YellowNodeSvg />
                  {isYellowWaitPhase && (
                    <View style={s.yellowWaitOverlay}><ClockIcon /></View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Mascot Tip */}
            <View style={s.mascotTipRow}>
              <Image source={selectedExplorer.image} style={s.smallExplorerImage} resizeMode="contain" />
              <View style={s.speechBubble}>
                <Text style={s.speechText}>{message}</Text>
              </View>
            </View>

            {/* Stats Card */}
            <View style={s.statsCard}>
              <View style={s.statCol}>
                <CheckCircleIcon />
                <View>
                  <Text style={s.statLabelGreen}>Correct</Text>
                  <Text style={s.statValGreen}>{stats.rightTaps}</Text>
                </View>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCol}>
                <CrossCircleIcon />
                <View>
                  <Text style={s.statLabelRed}>Missed</Text>
                  <Text style={s.statValRed}>{stats.missed}</Text>
                </View>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCol}>
                <View style={s.wrongIcon}><Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>X</Text></View>
                <View>
                  <Text style={s.statLabelPurple}>Wrong</Text>
                  <Text style={s.statValPurple}>{stats.wrongTaps}</Text>
                </View>
              </View>
            </View>

            {/* Pause Button */}
            <TouchableOpacity style={s.btnPauseLg} activeOpacity={0.8}>
              <View style={s.pauseBarsRow}><View style={s.pauseBar} /><View style={s.pauseBar} /></View>
              <Text style={s.btnPauseLgText}>Pause</Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // RESULTS
  const scoreNum = Math.max(0, Math.min(100, Math.round(((stats.rightTaps * 10 + stats.goodWaits * 5 - stats.wrongTaps * 5) / (TOTAL_ROUNDS * 10)) * 100)));

  return (
    <View style={s.screen}>
      <Image source={require('../../assets/gate_background.png')} style={s.bg} resizeMode="cover" />
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>
        <View style={s.topNav}>
          <TouchableOpacity style={s.iconBtn} onPress={handleBack}><BackArrowIcon /></TouchableOpacity>
          <View style={s.starPill}><StarIcon /><Text style={s.starPillText}>25</Text></View>
        </View>

        <View style={s.resBody}>
          <Text style={s.resTitle}>Great job!</Text>
          <Text style={s.resSubtitle}>You crossed the Gate of Patience!</Text>

          <View style={s.resTopArea}>
            <Image source={selectedExplorer.image} style={s.resExplorerImg} resizeMode="contain" />
            <View style={s.scoreCard}>
              <View style={s.scoreRibbon}><Text style={s.scoreRibbonTxt}>Patience Score</Text></View>
              <Text style={s.scoreNumTxt}>{scoreNum}</Text>
              <Text style={s.scoreRatingTxt}>{scoreNum >= 80 ? 'Wonderful!' : scoreNum >= 50 ? 'Good!' : 'Keep Practicing!'}</Text>
              <Text style={s.scoreDescTxt}>You showed great patience and self-control.</Text>
            </View>
          </View>

          {/* Stats Breakdown */}
          <View style={s.resStatsCard}>
            <Text style={s.resStatsHeader}>Here's how you did:</Text>
            <View style={s.resStatsRow}>
              <View style={s.resStatItem}>
                <CheckCircleIcon /><Text style={s.resStatLabel}>Right taps</Text><Text style={s.resStatValGreen}>{stats.rightTaps}/{TOTAL_ROUNDS}</Text>
              </View>
              <View style={s.resStatItem}>
                <CrossCircleIcon /><Text style={s.resStatLabel}>Wrong taps</Text><Text style={s.resStatValRed}>{stats.wrongTaps}</Text>
              </View>
              <View style={s.resStatItem}>
                <Svg width="20" height="20" viewBox="0 0 24 24"><Circle cx="12" cy="12" r="10" fill="#FFCA28" /><Path d="M8 10h8M8 15h8" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" /></Svg>
                <Text style={s.resStatLabel}>Good waits</Text><Text style={s.resStatValYellow}>{stats.goodWaits}</Text>
              </View>
              <View style={s.resStatItem}>
                <ShieldIcon /><Text style={s.resStatLabel}>Response control</Text><Text style={s.resStatValPurple}>{scoreNum >= 70 ? 'Great' : 'Fair'}</Text>
              </View>
            </View>
          </View>

          {/* Highlights */}
          <Text style={s.resHighlightHeader}>What you did well:</Text>
          <View style={s.resHighlightRow}>
            <View style={s.highlightCard}><ClockIcon /><Text style={s.highlightTxt}>Waited carefully</Text></View>
            <View style={s.highlightCard}><Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0077B6" strokeWidth="2"><Circle cx="12" cy="12" r="10" /><Circle cx="12" cy="12" r="4" /></Svg><Text style={s.highlightTxt}>Tapped at the right time</Text></View>
            <View style={s.highlightCard}><ShieldIcon /><Text style={s.highlightTxt}>Stayed in control</Text></View>
          </View>

          {/* Rewards */}
          <View style={s.rewardCard}>
            <StarIcon />
            <View>
              <Text style={s.rewardTitle}>You earned a star!</Text>
              <Text style={s.rewardDesc}>Your Focus Garden is growing!</Text>
            </View>
          </View>

          {/* Action buttons */}
          <TouchableOpacity style={s.btnNext} onPress={handleBack} activeOpacity={0.8}>
            <Text style={s.btnNextTxt}>Next Adventure</Text><ArrowRightIcon />
          </TouchableOpacity>
          <TouchableOpacity style={s.btnReplay} onPress={handleStartGame} activeOpacity={0.7}>
            <RefreshIcon /><Text style={s.btnReplayTxt}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────
const HP = 20;

const s = StyleSheet.create({
  screen: { flex: 1, width: SW, height: SH, backgroundColor: '#E8F5E9' },
  bg: { ...StyleSheet.absoluteFillObject, width: SW, height: SH },
  safe: { flex: 1 },

  // Shared Nav
  topNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: HP, paddingTop: 10, alignItems: 'center' },
  iconBtn: { width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  rightNav: { flexDirection: 'row', gap: 10 },

  subtitleText: { fontSize: 16, fontWeight: '700', color: '#1A237E', textAlign: 'center', marginTop: -5, marginBottom: 10 },

  // INTRO
  introBody: { flex: 1, paddingHorizontal: HP, justifyContent: 'space-evenly', alignItems: 'center' },
  titleWrap: { alignItems: 'center' },
  titleImg: { width: SW * 0.95, height: SH * 0.27, marginTop: -20, marginBottom: -25 },
  introCard: { backgroundColor: '#FFFDF0', borderRadius: 16, padding: 12, borderWidth: 1.5, borderColor: '#F5E6CA', width: '100%', alignItems: 'center' },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  introTextWrap: { flex: 1 },
  introMainText: { fontSize: 15, color: '#37474F' },
  introSubText: { fontSize: 14, color: '#546E7A', marginTop: 2 },

  pillsRow: { flexDirection: 'row', gap: 10, marginVertical: 5 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  pillText: { fontSize: 12, fontWeight: '700', color: '#455A64' },

  previewArea: { width: '100%', height: SH * 0.35, position: 'relative', alignItems: 'center', justifyContent: 'flex-end' },
  gateImage: { width: SW * 0.5, height: SH * 0.25, position: 'absolute', top: 0, zIndex: 0 },
  explorerImage: { width: SW * 0.4, height: SH * 0.22, position: 'absolute', left: -20, bottom: 20, zIndex: 2 },

  nodePreviewsRow: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', paddingLeft: SW * 0.3, zIndex: 3, paddingBottom: 10 },
  nodePreviewItem: { alignItems: 'center', marginHorizontal: -5 },
  nodeLabel: { backgroundColor: '#FFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginTop: 4, borderWidth: 1, borderColor: '#E0E0E0' },
  nodeLabelText: { fontSize: 8, fontWeight: '800', color: '#5D4037' },

  bottomBox: { width: '100%', alignItems: 'center', gap: 15 },
  tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', padding: 12, borderRadius: 16, gap: 10, width: '100%', borderWidth: 1, borderColor: '#FFECB3' },
  tipText: { fontSize: 14, fontWeight: '700', color: '#5D4037' },
  actionsRow: { flexDirection: 'row', gap: 10, width: '100%' },
  btnPractice: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0F2F1', paddingVertical: 14, borderRadius: 25, gap: 8, borderWidth: 1.5, borderColor: '#B2DFDB' },
  btnPracticeText: { fontSize: 16, fontWeight: '700', color: '#00796B' },
  btnStart: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00ACC1', paddingVertical: 14, borderRadius: 25, gap: 8 },
  btnStartText: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  // GAMEPLAY
  playBody: { flex: 1, paddingHorizontal: HP, alignItems: 'center' },
  smallTitleImg: { width: SW * 0.65, height: SH * 0.08, marginBottom: 5 },
  playCard: { backgroundColor: '#FFFDF0', borderRadius: 16, padding: 10, borderWidth: 1.5, borderColor: '#F5E6CA', width: '100%', alignItems: 'center', marginBottom: 15 },
  playMainInstr: { fontSize: 18, fontWeight: '800', color: '#37474F', flexDirection: 'row', alignItems: 'center' },
  playSubInstr: { fontSize: 13, color: '#546E7A', marginTop: 4, fontWeight: '600' },

  roundRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 10, marginBottom: 20 },
  roundPill: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  roundText: { fontSize: 12, fontWeight: '700', color: '#455A64' },
  timerBarWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 6, borderRadius: 15, gap: 8 },
  timerBarBg: { flex: 1, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  timerBarFill: { height: '100%', backgroundColor: '#4CAF50' },

  nodesGameArea: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', width: '100%', height: SH * 0.25, gap: 5 },
  gameNodeWrap: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center' },
  nodeActiveGlowGreen: { shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
  nodeActiveGlowRed: { shadowColor: '#F44336', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
  nodeActiveGlowYellow: { shadowColor: '#FFC107', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
  yellowWaitOverlay: { position: 'absolute', right: -5, bottom: -5, backgroundColor: '#FFF', borderRadius: 12, padding: 2, borderWidth: 1.5, borderColor: '#0288D1' },

  mascotTipRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 15 },
  smallExplorerImage: { width: SW * 0.25, height: SW * 0.25 },
  speechBubble: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 20, borderBottomLeftRadius: 5, marginLeft: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  speechText: { fontSize: 15, fontWeight: '700', color: '#1A237E' },

  statsCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 10, width: '100%', justifyContent: 'space-evenly', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDivider: { width: 1, height: '70%', backgroundColor: '#EEEEEE' },
  statLabelGreen: { fontSize: 10, color: '#4CAF50', fontWeight: '700' },
  statValGreen: { fontSize: 16, fontWeight: '800', color: '#2E7D32' },
  statLabelRed: { fontSize: 10, color: '#EF5350', fontWeight: '700' },
  statValRed: { fontSize: 16, fontWeight: '800', color: '#C62828' },
  statLabelPurple: { fontSize: 10, color: '#7E57C2', fontWeight: '700' },
  statValPurple: { fontSize: 16, fontWeight: '800', color: '#4527A0' },
  wrongIcon: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#7E57C2', justifyContent: 'center', alignItems: 'center' },

  btnPauseLg: { marginTop: 'auto', marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00838F', width: '100%', paddingVertical: 14, borderRadius: 25, gap: 10 },
  pauseBarsRow: { flexDirection: 'row', gap: 4 },
  pauseBar: { width: 4, height: 16, backgroundColor: '#FFF', borderRadius: 2 },
  btnPauseLgText: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  // RESULTS
  resBody: { flex: 1, paddingHorizontal: HP, alignItems: 'center' },
  starPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  starPillText: { fontSize: 14, fontWeight: '800', color: '#FF8F00' },

  resTitle: { fontSize: 32, fontWeight: '900', color: '#00838F', marginTop: 10 },
  resSubtitle: { fontSize: 16, fontWeight: '700', color: '#5C4033', marginBottom: 15 },

  resTopArea: { flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  resExplorerImg: { width: SW * 0.35, height: SH * 0.22 },
  scoreCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 15, alignItems: 'center', marginLeft: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  scoreRibbon: { backgroundColor: '#00ACC1', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10, position: 'absolute', top: -10 },
  scoreRibbonTxt: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  scoreNumTxt: { fontSize: 48, fontWeight: '900', color: '#00838F', marginTop: 10 },
  scoreRatingTxt: { fontSize: 16, fontWeight: '800', color: '#37474F' },
  scoreDescTxt: { fontSize: 10, color: '#78909C', textAlign: 'center', marginTop: 5 },

  resStatsCard: { backgroundColor: '#FFFDF0', borderRadius: 16, padding: 12, width: '100%', marginBottom: 15, borderWidth: 1, borderColor: '#F5E6CA' },
  resStatsHeader: { fontSize: 14, fontWeight: '700', color: '#5D4037', textAlign: 'center', marginBottom: 10 },
  resStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resStatItem: { alignItems: 'center', gap: 4 },
  resStatLabel: { fontSize: 10, fontWeight: '700', color: '#546E7A' },
  resStatValGreen: { fontSize: 16, fontWeight: '800', color: '#2E7D32' },
  resStatValRed: { fontSize: 16, fontWeight: '800', color: '#C62828' },
  resStatValYellow: { fontSize: 16, fontWeight: '800', color: '#F57F17' },
  resStatValPurple: { fontSize: 14, fontWeight: '800', color: '#4527A0' },

  resHighlightHeader: { fontSize: 14, fontWeight: '700', color: '#5D4037', marginBottom: 10 },
  resHighlightRow: { flexDirection: 'row', width: '100%', gap: 8, marginBottom: 15 },
  highlightCard: { flex: 1, backgroundColor: '#F3F8FA', padding: 10, borderRadius: 12, alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#E1F5FE' },
  highlightTxt: { fontSize: 10, fontWeight: '700', color: '#00838F', textAlign: 'center' },

  rewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', width: '100%', padding: 12, borderRadius: 16, gap: 10, marginBottom: 20 },
  rewardTitle: { fontSize: 14, fontWeight: '800', color: '#1A237E' },
  rewardDesc: { fontSize: 12, color: '#5C6BC0' },

  btnNext: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00ACC1', width: '100%', paddingVertical: 14, borderRadius: 25, gap: 10, marginBottom: 10 },
  btnNextTxt: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  btnReplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0F7FA', width: '100%', paddingVertical: 12, borderRadius: 25, gap: 8 },
  btnReplayTxt: { fontSize: 16, fontWeight: '700', color: '#00838F' },
});
