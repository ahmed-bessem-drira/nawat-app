import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';

const { width: SW, height: SH } = Dimensions.get('window');

// ── EXPLORER DATA ──────────────────────────────────────────────────────
const EXPLORERS = [
  { id: 'avatar_1', name: 'Nawat', image: require('../../assets/nawat_character.png') },
  { id: 'avatar_2', name: 'Zahra', image: require('../../assets/zahra_placeholder.png') },
  { id: 'avatar_3', name: 'Sami', image: require('../../assets/sami_placeholder.png') },
  { id: 'avatar_4', name: 'Lulu', image: require('../../assets/lulu_placeholder.png') },
];

// ── LANTERN COLOR CONFIG ───────────────────────────────────────────────
const LANTERN_COLORS = {
  BLUE: '#00E5FF',     // Target
  RED: '#FF3D00',      // Distractor
  PURPLE: '#E040FB',   // Distractor
  GREEN: '#00E676',    // Distractor
  YELLOW: '#FFD700',   // Distractor
};

type LanternColor = keyof typeof LANTERN_COLORS;

// ── SVG LANTERN COMPONENT ──────────────────────────────────────────────
const LanternSvg = ({
  color,
  width = 60,
  height = 84,
  glow = false,
}: {
  color: string;
  width?: number;
  height?: number;
  glow?: boolean;
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 140">
      {glow && (
        <Circle cx="50" cy="70" r="42" fill={color} opacity="0.35" />
      )}
      
      {/* Hanging chain */}
      <Path d="M 50 0 L 50 20" stroke="#8D6E63" strokeWidth="3" />
      
      {/* Top cap */}
      <Path d="M 35 20 Q 50 5 65 20 Z" fill="#FFB300" stroke="#D84315" strokeWidth="1" />
      <Rect x="40" y="20" width="20" height="8" rx="2" fill="#D84315" />
      
      {/* Lantern body frame */}
      <Path d="M 25 28 L 75 28 L 85 90 L 70 120 L 30 120 L 15 90 Z" fill={color} stroke="#FFB300" strokeWidth="4" />
      
      {/* Glass partitions */}
      <Path d="M 50 28 L 50 120" stroke="#FFB300" strokeWidth="2" opacity="0.7" />
      <Path d="M 37 28 L 30 120" stroke="#FFB300" strokeWidth="1.5" opacity="0.5" />
      <Path d="M 63 28 L 70 120" stroke="#FFB300" strokeWidth="1.5" opacity="0.5" />
      
      {/* Horizontal bands */}
      <Path d="M 20 60 L 80 60" stroke="#FFB300" strokeWidth="2" opacity="0.8" />
      <Path d="M 17 90 L 83 90" stroke="#FFB300" strokeWidth="2" opacity="0.8" />
      
      {/* Bottom base cap */}
      <Path d="M 30 120 L 70 120 L 60 135 L 40 135 Z" fill="#D84315" stroke="#FFB300" strokeWidth="2" />
      <Circle cx="50" cy="135" r="4" fill="none" stroke="#FFB300" strokeWidth="2" />
    </Svg>
  );
};

// ── SVG ICONS ──────────────────────────────────────────────────────────
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
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
const WandIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00838F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 2a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L18 2z" />
  </Svg>
);
const ArrowRightIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
    <Circle cx="12" cy="12" r="10" fill="#EF5350" />
    <Path d="M8 8l8 8M16 8l-8 8" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const WateringCanIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#673AB7" strokeWidth="2">
    <Path d="M7 10h10a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z" />
    <Path d="M17 10V6a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3v4" />
    <Path d="M21 14l2-1" />
  </Svg>
);
const SmileMoonIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" fill="#80DEEA" stroke="#00ACC1" strokeWidth="1" />
    <Circle cx="9" cy="10" r="1.5" fill="#006064" />
    <Circle cx="15" cy="10" r="1.5" fill="#006064" />
    <Path d="M9 14q3 3 6 0" fill="none" stroke="#006064" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);
const SparkleIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700">
    <Path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" />
  </Svg>
);

// ── FIXED HANGING LANTERN ANCHOR POSITIONS ──────────────────────────────
const LANTERN_ANCHORS = [
  { left: '6%', top: 20 },
  { left: '29%', top: 45 },
  { left: '52%', top: 15 },
  { left: '75%', top: 40 },
  { left: '9%', top: 160 },
  { left: '32%', top: 185 },
  { left: '55%', top: 155 },
  { left: '78%', top: 180 },
];

interface LanternState {
  id: string;
  anchorIndex: number;
  color: LanternColor;
  spawnTime: number;
  scaleAnim: Animated.Value;
  offsetX: number;
  offsetY: number;
}

type ScreenState = 'INTRO' | 'GAMEPLAY' | 'RESULTS';

export default function NoiseSoukScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedAvatar?: string }>();
  const { startSession, endSession, clearSession, rewards } = useGameStore();
  const { child } = useChildStore();

  const selectedAvatarId = params.selectedAvatar || 'avatar_1';
  const selectedExplorer = EXPLORERS.find((e) => e.id === selectedAvatarId) || EXPLORERS[0];

  const [screen, setScreen] = useState<ScreenState>('INTRO');
  const [isPaused, setIsPaused] = useState(false);

  // ── GAME STATE ─────────────────────────────────────────────────────────
  const [activeLanterns, setActiveLanterns] = useState<LanternState[]>([]);
  const [score, setScore] = useState(120);
  const [round, setRound] = useState(1);
  const TOTAL_ROUNDS = 8;
  const BLUE_TAPS_PER_ROUND = 3;
  
  const [hits, setHits] = useState(0);
  const [missed, setMissed] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds game timer
  const [message, setMessage] = useState("Tap the blue lanterns!");
  const [blueTappedThisRound, setBlueTappedThisRound] = useState(0);

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeLanternsRef = useRef<LanternState[]>([]);
  activeLanternsRef.current = activeLanterns;

  const runHaptic = (type: 'success' | 'error' | 'light') => {
    if (Platform.OS !== 'web') {
      if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getRoundDifficulty = useCallback(() => {
    // Rounds 1–2: easy
    // Rounds 3–4: medium
    // Rounds 5–6: harder
    // Rounds 7–8: hardest
    if (round <= 2) {
      return {
        spawnChance: 0.55,
        spawnInterval: 1200,
        blueLifetime: 2800,
        distractorLifetime: 3200,
        targetChance: 0.45,
        maxOffset: 0,
      };
    } else if (round <= 4) {
      return {
        spawnChance: 0.70,
        spawnInterval: 950,
        blueLifetime: 2200,
        distractorLifetime: 2600,
        targetChance: 0.35,
        maxOffset: 4,
      };
    } else if (round <= 6) {
      return {
        spawnChance: 0.82,
        spawnInterval: 750,
        blueLifetime: 1700,
        distractorLifetime: 2100,
        targetChance: 0.25,
        maxOffset: 10,
      };
    } else {
      return {
        spawnChance: 0.92,
        spawnInterval: 550,
        blueLifetime: 1300,
        distractorLifetime: 1600,
        targetChance: 0.18,
        maxOffset: 16,
      };
    }
  }, [round]);

  // ── LANTERN SPAWNING LOGIC ─────────────────────────────────────────────
  const spawnLantern = useCallback(() => {
    if (isPaused || screen !== 'GAMEPLAY') return;

    const busyAnchors = activeLanternsRef.current.map((l) => l.anchorIndex);
    const freeAnchors = LANTERN_ANCHORS.map((_, idx) => idx).filter(
      (idx) => !busyAnchors.includes(idx)
    );

    if (freeAnchors.length === 0) return;

    const randomAnchorIndex = freeAnchors[Math.floor(Math.random() * freeAnchors.length)];
    const colors: LanternColor[] = ['BLUE', 'RED', 'PURPLE', 'GREEN', 'YELLOW'];
    
    // Get difficulty config by round
    const config = getRoundDifficulty();
    const isTarget = Math.random() < config.targetChance;
    
    const color = isTarget
      ? 'BLUE'
      : colors[Math.floor(Math.random() * (colors.length - 1)) + 1];

    // Spacing offset jitter (less predictable positions at higher difficulties)
    const offsetX = (Math.random() - 0.5) * config.maxOffset;
    const offsetY = (Math.random() - 0.5) * config.maxOffset;

    const newLantern: LanternState = {
      id: Math.random().toString(),
      anchorIndex: randomAnchorIndex,
      color,
      spawnTime: Date.now(),
      scaleAnim: new Animated.Value(0),
      offsetX,
      offsetY,
    };

    setActiveLanterns((prev) => [...prev, newLantern]);

    Animated.spring(newLantern.scaleAnim, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Lifetime by round difficulty
    const lifetime = color === 'BLUE' ? config.blueLifetime : config.distractorLifetime;
    setTimeout(() => {
      expireLantern(newLantern.id, color === 'BLUE');
    }, lifetime);
  }, [isPaused, screen, getRoundDifficulty]);

  const expireLantern = (id: string, wasBlue: boolean) => {
    setActiveLanterns((prev) => {
      const match = prev.find((l) => l.id === id);
      if (!match) return prev;

      if (wasBlue) {
        setMissed((m) => m + 1);
        setScore((s) => Math.max(0, s - 5));
        setMessage("Oops! A blue lantern slipped away!");
      }

      Animated.timing(match.scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setActiveLanterns((current) => current.filter((l) => l.id !== id));
      });

      return prev;
    });
  };

  const handleLanternTap = (lantern: LanternState) => {
    if (isPaused) return;

    runHaptic('light');

    Animated.timing(lantern.scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setActiveLanterns((prev) => prev.filter((l) => l.id !== lantern.id));
    });

    if (lantern.color === 'BLUE') {
      runHaptic('success');
      setHits((h) => h + 1);
      setScore((s) => s + 15);
      setBlueTappedThisRound((prev) => {
        const next = prev + 1;
        if (next >= BLUE_TAPS_PER_ROUND) {
          advanceRound();
          return 0;
        }
        return next;
      });
      setMessage("Great! Find the blue one!");
    } else {
      runHaptic('error');
      setWrongTaps((w) => w + 1);
      setScore((s) => Math.max(0, s - 5));
      setMessage("Wait! Tap only the blue ones!");
    }
  };

  const advanceRound = () => {
    setRound((r) => {
      const next = r + 1;
      if (next > TOTAL_ROUNDS) {
        finishGame();
        return r;
      }
      setMessage(`Round ${next}! Focus on the blue lanterns!`);
      return next;
    });
  };

  // ── GAME START & CYCLE ────────────────────────────────────────────────
  const handleStartGame = () => {
    setScore(120);
    setRound(1);
    setHits(0);
    setMissed(0);
    setWrongTaps(0);
    setTimeLeft(60);
    setBlueTappedThisRound(0);
    setActiveLanterns([]);
    setIsPaused(false);
    setScreen('GAMEPLAY');
    startSession('NOISE_SOUK');
  };
  useEffect(() => {
    if (screen !== 'GAMEPLAY' || isPaused) {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      return;
    }

    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const config = getRoundDifficulty();

    // Spawn rates and timers configured strictly by round difficulty
    spawnTimerRef.current = setInterval(() => {
      if (Math.random() < config.spawnChance) {
        spawnLantern();
      }
    }, config.spawnInterval);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [screen, isPaused, spawnLantern, round]);
  const finishGame = async () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);

    setScreen('RESULTS');

    const duration = 60 - timeLeft;
    const metrics = {
      correctSequence: hits,
      wrongPicks: wrongTaps,
      omissions: missed,
      completionTime: duration * 1000,
    };

    endSession(metrics);

    if (child) {
      const sessionId = Date.now().toString();
      try {
        await databaseService.insert('session', {
          id: sessionId,
          child_id: child.id,
          game_type: 'NOISE_SOUK',
          duration,
          synced: 0,
          created_at: Date.now(),
        });

        await databaseService.insert('game_metrics', {
          id: Date.now().toString() + '_metrics',
          session_id: sessionId,
          child_id: child.id,
          game_type: 'NOISE_SOUK',
          correct_sequence: hits,
          wrong_picks: wrongTaps,
          attempts: hits + wrongTaps,
          completion_time: duration * 1000,
          synced: 0,
          created_at: Date.now(),
        });

        if (wrongTaps <= 2) {
          rewards.addFlower();
          rewards.addWaterDrop();
        } else if (hits > 5) {
          rewards.addWaterDrop();
        }
      } catch (e) {
        console.error('Error saving Noise Souk metrics', e);
      }
    }
  };

  const handleBack = () => {
    clearSession();
    if (router.canGoBack()) router.back();
    else router.replace('/village-map');
  };

  const handlePlayAgain = () => {
    setScreen('INTRO');
  };

  const getFocusScore = () => {
    const totalTaps = hits + wrongTaps + missed;
    if (totalTaps === 0) return 100;
    const accuracy = hits / (hits + wrongTaps + missed * 0.5);
    return Math.max(10, Math.min(100, Math.round(accuracy * 100)));
  };

  const getScoreBadgeLabel = (s: number) => {
    if (s >= 90) return 'Amazing!';
    if (s >= 75) return 'Great!';
    if (s >= 55) return 'Good!';
    return 'Keep Practicing!';
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  INTRO SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  if (screen === 'INTRO') {
    return (
      <View style={st.screen}>
        <Image source={require('../../assets/souk_background.png')} style={st.bg} resizeMode="cover" />
        <View style={st.bgOverlay} />
        <StatusBar style="dark" />
        <SafeAreaView style={st.safe}>
          {/* Top Nav */}
          <View style={st.topNav}>
            <TouchableOpacity style={st.iconBtn} onPress={handleBack}><BackArrowIcon /></TouchableOpacity>
            <View style={st.rightNav}>
              <TouchableOpacity style={st.iconBtn}><PauseIcon /></TouchableOpacity>
              <TouchableOpacity style={st.iconBtn}><SoundIcon /></TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={st.introScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Top Area */}
            <View style={st.introTopGroup}>
              {/* Title Section */}
              <View style={st.introTitleWrap}>
                <Image
                  source={require('../../assets/noise_souk_title.png')}
                  style={st.introTitleImg}
                  resizeMode="contain"
                />
                <Text style={st.introSubtitle}>Find the right lanterns</Text>
              </View>

              {/* Evidence Card */}
              <View style={st.evidenceCard}>
                <LeafIcon />
                <Text style={st.evidenceText}>An evidence-based attention game</Text>
              </View>

              {/* Instruction Card */}
              <View style={st.introCard}>
                <View style={st.introCardRow}>
                  <LeafIcon />
                  <Text style={st.introCardText}>
                    Tap only the <Text style={{ color: '#00ACC1', fontWeight: 'bold' }}>blue lanterns</Text>. Ignore the distractors.
                  </Text>
                </View>
              </View>

              {/* Pills */}
              <View style={st.pillsRow}>
                <View style={st.pill}><ClockIcon /><Text style={st.pillText}>Time: 2 min</Text></View>
                <View style={st.pill}><GamepadIcon /><Text style={st.pillText}>Focus game</Text></View>
              </View>
            </View>

            {/* Character Preview */}
            <View style={st.introCharacterArea}>
              <Image source={selectedExplorer.image} style={st.introCharacter} resizeMode="contain" />
            </View>

            {/* Bottom Group */}
            <View style={st.introBottomGroup}>
              {/* Lantern Preview Card */}
              <View style={st.previewStepsCard}>
                <View style={st.previewLanternsRow}>
                  <View style={st.previewLanternCol}>
                    <LanternSvg color={LANTERN_COLORS.BLUE} width={50} height={70} />
                    <View style={st.checkIcon}><CheckCircleIcon /></View>
                  </View>
                  <View style={st.previewLanternCol}>
                    <LanternSvg color={LANTERN_COLORS.BLUE} width={50} height={70} />
                    <View style={st.checkIcon}><CheckCircleIcon /></View>
                  </View>
                  <View style={st.previewLanternCol}>
                    <LanternSvg color={LANTERN_COLORS.RED} width={50} height={70} />
                    <View style={st.crossIcon}><CrossCircleIcon /></View>
                  </View>
                </View>
              </View>

              {/* Tip Bar */}
              <View style={st.tipCard}>
                <WateringCanIcon />
                <Text style={st.tipText}>Look carefully before you tap.</Text>
              </View>

              {/* Bottom Buttons */}
              <View style={st.introActions}>
                <TouchableOpacity style={st.btnStart} activeOpacity={0.8} onPress={handleStartGame}>
                  <Text style={st.btnStartText}>Start Game</Text>
                  <ArrowRightIcon />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  GAMEPLAY SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  if (screen === 'GAMEPLAY') {
    const roundProgressPercent = (blueTappedThisRound / BLUE_TAPS_PER_ROUND) * 100;
    const timeFormatted = `0:${timeLeft < 10 ? '0' : ''}${timeLeft}`;

    return (
      <View style={st.screen}>
        <Image source={require('../../assets/souk_background.png')} style={st.bg} resizeMode="cover" />
        <View style={st.bgOverlay} />
        <StatusBar style="dark" />
        <SafeAreaView style={st.safe}>
          {/* Top Nav */}
          <View style={st.topNav}>
            <TouchableOpacity style={st.iconBtn} onPress={handleBack}><BackArrowIcon /></TouchableOpacity>
            <View style={st.topCenterTitle}>
              <SmileMoonIcon />
              <View>
                <Text style={st.headerTextTitle}>Noise Souk</Text>
                <Text style={st.headerTextSub}>Tap the blue lanterns</Text>
              </View>
            </View>
            <View style={st.scoreBadgePill}>
              <SparkleIcon />
              <Text style={st.scoreBadgeText}>{score}</Text>
            </View>
          </View>

          <View style={st.playContainer}>
            {/* Instructions Banner */}
            <View style={st.playInstructionsCard}>
              <LeafIcon />
              <Text style={st.playInstructionsText}>
                Tap only <Text style={{ color: '#00838F', fontWeight: 'bold' }}>blue</Text> lanterns. Ignore other lanterns.
              </Text>
            </View>

            {/* Round / Timer Bar */}
            <View style={st.roundTimerBar}>
              <View style={st.roundPillBg}>
                <Text style={st.roundPillText}>Round {round} of {TOTAL_ROUNDS}</Text>
              </View>
              <View style={st.roundProgressBarBg}>
                <View style={[st.roundProgressBarFill, { width: `${roundProgressPercent}%` }]} />
              </View>
              <View style={st.timerIndicator}>
                <ClockIcon />
                <Text style={st.timerIndicatorText}>{timeFormatted}</Text>
              </View>
            </View>

            {/* Hanging Game Area */}
            <View style={st.gameAreaFrame}>
              {activeLanterns.map((lantern) => {
                const anchor = LANTERN_ANCHORS[lantern.anchorIndex];
                const isTargetColor = lantern.color === 'BLUE';

                return (
                  <Animated.View
                    key={lantern.id}
                    style={[
                      st.lanternAnchorWrap,
                      {
                        left: anchor.left,
                        top: anchor.top,
                        transform: [
                          { scale: lantern.scaleAnim },
                          { translateX: lantern.offsetX },
                          { translateY: lantern.offsetY },
                        ],
                        opacity: lantern.scaleAnim,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleLanternTap(lantern)}
                      style={st.lanternTouchBox}
                    >
                      <LanternSvg
                        color={LANTERN_COLORS[lantern.color]}
                        glow={isTargetColor}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}

              {/* Character + Speech bubble */}
              <View style={st.mascotFeedbackArea}>
                <View style={st.mascotSpeechBubble}>
                  <Text style={st.mascotSpeechText}>{message}</Text>
                </View>
                <Image source={selectedExplorer.image} style={st.playMascot} resizeMode="contain" />
              </View>
            </View>

            {/* Bottom Live Metrics */}
            <View style={st.liveMetricsBar}>
              <View style={st.liveMetricCol}>
                <CheckCircleIcon />
                <View style={st.liveMetricTextWrap}>
                  <Text style={st.liveMetricLabel}>Hits</Text>
                  <Text style={st.liveMetricValHits}>{hits}</Text>
                </View>
              </View>
              <View style={st.liveMetricDivider} />
              <View style={st.liveMetricCol}>
                <CrossCircleIcon />
                <View style={st.liveMetricTextWrap}>
                  <Text style={st.liveMetricLabel}>Missed</Text>
                  <Text style={st.liveMetricValMissed}>{missed}</Text>
                </View>
              </View>
              <View style={st.liveMetricDivider} />
              <View style={st.liveMetricCol}>
                <View style={st.wrongIconCircle}><Text style={st.wrongIconText}>X</Text></View>
                <View style={st.liveMetricTextWrap}>
                  <Text style={st.liveMetricLabel}>Wrong</Text>
                  <Text style={st.liveMetricValWrong}>{wrongTaps}</Text>
                </View>
              </View>
            </View>

            {/* Tip Bar */}
            <View style={st.tipBannerPlay}>
              <WateringCanIcon />
              <Text style={st.tipBannerPlayText}>Stay focused in the noisy market.</Text>
              <SparkleIcon />
            </View>

            {/* Action Footer */}
            <View style={st.playFooter}>
              <TouchableOpacity
                style={st.btnFooterPause}
                onPress={() => setIsPaused(true)}
                activeOpacity={0.8}
              >
                <PauseIcon />
                <Text style={st.btnFooterPauseText}>Pause</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── PAUSE OVERLAY MODAL ────────────────────────────────────────── */}
          <Modal visible={isPaused} transparent animationType="fade">
            <View style={st.pauseOverlay}>
              <View style={st.pauseModalBox}>
                <SmileMoonIcon />
                <Text style={st.pauseTitle}>Game Paused</Text>
                <Text style={st.pauseSubtitle}>Take a deep breath and stay focused!</Text>

                <TouchableOpacity
                  style={st.btnResume}
                  onPress={() => setIsPaused(false)}
                  activeOpacity={0.8}
                >
                  <Text style={st.btnResumeText}>Resume Game</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={st.btnExit}
                  onPress={handleBack}
                  activeOpacity={0.8}
                >
                  <Text style={st.btnExitText}>Quit Game</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  RESULTS SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  const finalFocusScore = getFocusScore();
  const badgeLabel = getScoreBadgeLabel(finalFocusScore);
  const totalBluePossible = hits + missed;

  return (
    <View style={st.screen}>
      <Image source={require('../../assets/souk_background.png')} style={st.bg} resizeMode="cover" />
      <View style={st.bgOverlay} />
      <StatusBar style="dark" />
      <SafeAreaView style={st.safe}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={st.resScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header moon symbol */}
          <SmileMoonIcon />
          
          {/* Title */}
          <Text style={st.resTitle}>Great job!</Text>
          <Text style={st.resSubtitle}>You explored the Noise Souk!</Text>

          {/* Character + Score Card Row */}
          <View style={st.resTopArea}>
            <Image source={selectedExplorer.image} style={st.resCharacter} resizeMode="contain" />
            <View style={st.scoreCard}>
              <Text style={st.scoreTitleLabel}>Focus Score</Text>
              <Text style={st.scoreNumber}>{finalFocusScore}</Text>
              <View style={st.scoreBadge}>
                <Text style={st.scoreBadgeText}>{badgeLabel}</Text>
              </View>
            </View>
          </View>

          {/* Detailed metrics card */}
          <View style={st.metricsCard}>
            <View style={st.metricRow}>
              <View style={st.metricLabelGroup}>
                <CheckCircleIcon />
                <Text style={st.metricLabelName}>Hits</Text>
              </View>
              <Text style={st.metricValText}>
                {hits}/{totalBluePossible > 0 ? totalBluePossible : 6}
              </Text>
            </View>
            <View style={st.metricDividerLine} />
            <View style={st.metricRow}>
              <View style={st.metricLabelGroup}>
                <CrossCircleIcon />
                <Text style={st.metricLabelName}>Wrong taps</Text>
              </View>
              <Text style={st.metricValTextRed}>{wrongTaps}</Text>
            </View>
          </View>

          {/* Reward Card */}
          <View style={st.rewardCard}>
            <View style={st.rewardLanternWrap}>
              <LanternSvg color={LANTERN_COLORS.BLUE} width={45} height={65} glow />
            </View>
            <View style={st.rewardTextWrap}>
              <Text style={st.rewardTitle}>You earned a lantern!</Text>
              <Text style={st.rewardDesc}>Your Focus Garden is growing!</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity style={st.btnNext} onPress={handleBack} activeOpacity={0.8}>
            <Text style={st.btnNextText}>Next Adventure</Text>
            <ArrowRightIcon />
          </TouchableOpacity>

          <TouchableOpacity style={st.btnReplay} onPress={handlePlayAgain} activeOpacity={0.7}>
            <RefreshIcon />
            <Text style={st.btnReplayText}>Play Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── STYLESHEET ────────────────────────────────────────────────────────
const HP = 20;

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E8F5E9' },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.3)' },
  safe: { flex: 1 },

  // Shared Header & Nav
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: HP,
    paddingTop: 10,
    alignItems: 'center',
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  rightNav: { flexDirection: 'row', gap: 10 },
  topCenterTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0F7FA',
  },
  headerTextTitle: { fontSize: 13, fontWeight: '800', color: '#006064' },
  headerTextSub: { fontSize: 9, fontWeight: '600', color: '#00838F', marginTop: -2 },
  scoreBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  scoreBadgeText: { fontSize: 12, fontWeight: '800', color: '#FF8F00' },

  // ═══════════════════════════════════════════════════════════════════════
  //  INTRO SCREEN STYLES
  // ═══════════════════════════════════════════════════════════════════════
  introScrollContent: {
    flexGrow: 1,
    paddingHorizontal: HP,
    paddingTop: 10,
    paddingBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  introTopGroup: {
    width: '100%',
    alignItems: 'center',
  },
  introBottomGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  introTitleWrap: { alignItems: 'center', marginTop: 5, marginBottom: 5 },
  introTitleImg: {
    width: SW * 0.95,
    height: SH * 0.17,
    marginVertical: 4,
    transform: [{ scale: 1.25 }],
  },
  introSubtitle: { fontSize: 16, fontWeight: '800', color: '#1565C0', textAlign: 'center' },
  evidenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginTop: 6,
    borderWidth: 1.2,
    borderColor: '#B2DFDB',
  },
  evidenceText: { fontSize: 11, fontWeight: '700', color: '#00796B' },
  introCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  introCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  introCardText: { fontSize: 14, fontWeight: '600', color: '#455A64', flex: 1, textAlign: 'center' },
  pillsRow: { flexDirection: 'row', gap: 10, marginVertical: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillText: { fontSize: 12, fontWeight: '700', color: '#455A64' },

  introCharacterArea: { width: '100%', alignItems: 'center', marginVertical: 4 },
  introCharacter: { width: SW * 0.52, height: SH * 0.24 },

  previewStepsCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  previewLanternsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  previewLanternCol: {
    alignItems: 'center',
    position: 'relative',
    width: (SW - 64) / 3,
  },
  checkIcon: {
    position: 'absolute',
    bottom: -6,
    right: '20%',
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  crossIcon: {
    position: 'absolute',
    bottom: -6,
    right: '20%',
    backgroundColor: '#FFF',
    borderRadius: 10,
  },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,253,240,0.95)',
    padding: 12,
    borderRadius: 16,
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  tipText: { fontSize: 13, fontWeight: '700', color: '#5D4037', flex: 1 },

  introActions: { flexDirection: 'row', gap: 10, width: '100%' },
  btnPractice: {
    flex: 0.45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F7FA',
    paddingVertical: 14,
    borderRadius: 25,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#B2EBF2',
  },
  btnPracticeText: { fontSize: 16, fontWeight: '700', color: '#00838F' },
  btnStart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ACC1',
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  btnStartText: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  // ═══════════════════════════════════════════════════════════════════════
  //  GAMEPLAY SCREEN STYLES
  // ═══════════════════════════════════════════════════════════════════════
  playContainer: {
    flex: 1,
    paddingHorizontal: HP,
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  playInstructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#B2EBF2',
    marginTop: 6,
  },
  playInstructionsText: { fontSize: 13, color: '#006064', fontWeight: '700', flex: 1, textAlign: 'center' },
  
  roundTimerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginVertical: 4,
  },
  roundPillBg: {
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roundPillText: { fontSize: 11, fontWeight: '800', color: '#455A64' },
  roundProgressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(224,224,224,0.6)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  roundProgressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  timerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerIndicatorText: { fontSize: 12, fontWeight: '800', color: '#0077B6' },

  gameAreaFrame: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    marginVertical: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  lanternAnchorWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lanternTouchBox: {
    padding: 5,
  },
  mascotFeedbackArea: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  playMascot: {
    width: SW * 0.24,
    height: SH * 0.14,
  },
  mascotSpeechBubble: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderBottomLeftRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    marginLeft: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    maxWidth: SW * 0.55,
  },
  mascotSpeechText: { fontSize: 12, fontWeight: '700', color: '#004D40' },

  liveMetricsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: HP,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  liveMetricCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  liveMetricTextWrap: {
    alignItems: 'flex-start',
  },
  liveMetricLabel: { fontSize: 11, fontWeight: '700', color: '#78909C' },
  liveMetricValHits: { fontSize: 16, fontWeight: '800', color: '#4CAF50' },
  liveMetricValMissed: { fontSize: 16, fontWeight: '800', color: '#EF5350' },
  liveMetricValWrong: { fontSize: 16, fontWeight: '800', color: '#FF8F00' },
  liveMetricDivider: { width: 1, height: 24, backgroundColor: '#ECEFF1' },
  wrongIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF8F00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrongIconText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  tipBannerPlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE7F6',
    borderWidth: 1,
    borderColor: '#D1C4E9',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    marginVertical: 4,
  },
  tipBannerPlayText: { fontSize: 12, fontWeight: '700', color: '#512DA8' },

  playFooter: {
    alignItems: 'center',
  },
  btnFooterPause: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ACC1',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 36,
    gap: 8,
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  btnFooterPauseText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  // Pause overlay
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseModalBox: {
    backgroundColor: '#FFF',
    width: '85%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 15,
  },
  pauseTitle: { fontSize: 24, fontWeight: '800', color: '#006064' },
  pauseSubtitle: { fontSize: 14, color: '#546E7A', textAlign: 'center' },
  btnResume: {
    backgroundColor: '#00ACC1',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  btnResumeText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  btnExit: {
    backgroundColor: '#ECEFF1',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CFD8DC',
  },
  btnExitText: { color: '#455A64', fontSize: 14, fontWeight: '700' },

  // ═══════════════════════════════════════════════════════════════════════
  //  RESULTS SCREEN STYLES
  // ═══════════════════════════════════════════════════════════════════════
  resScrollContent: {
    paddingHorizontal: HP,
    paddingBottom: 30,
    alignItems: 'center',
    paddingTop: 20,
  },
  resTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#00838F',
    marginTop: 15,
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  resSubtitle: { fontSize: 16, fontWeight: '700', color: '#5C4033', marginBottom: 15, textAlign: 'center' },

  resTopArea: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resCharacter: { width: SW * 0.38, height: SH * 0.24 },
  scoreCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 15,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreTitleLabel: { fontSize: 14, fontWeight: '700', color: '#5D4037' },
  scoreNumber: { fontSize: 52, fontWeight: '900', color: '#00838F' },
  scoreBadge: {
    backgroundColor: '#00838F',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 6,
  },
  scoreBadgeText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  metricsCard: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  metricLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabelName: { fontSize: 14, fontWeight: '700', color: '#37474F' },
  metricValText: { fontSize: 15, fontWeight: '800', color: '#4CAF50' },
  metricValTextRed: { fontSize: 15, fontWeight: '800', color: '#EF5350' },
  metricDividerLine: { height: 1, backgroundColor: '#ECEFF1' },

  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    width: '100%',
    padding: 16,
    borderRadius: 18,
    gap: 14,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  rewardLanternWrap: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  rewardTextWrap: { flex: 1 },
  rewardTitle: { fontSize: 16, fontWeight: '800', color: '#1A237E', marginBottom: 4 },
  rewardDesc: { fontSize: 13, fontWeight: '600', color: '#546E7A' },

  btnNext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ACC1',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 10,
    marginBottom: 12,
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  btnNextText: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  btnReplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(224,247,250,0.95)',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#B2EBF2',
  },
  btnReplayText: { fontSize: 16, fontWeight: '700', color: '#00838F' },
});
