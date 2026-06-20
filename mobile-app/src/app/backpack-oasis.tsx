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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
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

// ── TASK DATA ──────────────────────────────────────────────────────────
interface Task {
  id: string;
  label: string;
  emoji: string;
  order: number;
}

const TASKS: Task[] = [
  { id: 't1', label: 'Pack backpack', emoji: '🎒', order: 1 },
  { id: 't2', label: 'Fill water bottle', emoji: '💧', order: 2 },
  { id: 't3', label: 'Get notebook ready', emoji: '📓', order: 3 },
  { id: 't4', label: 'Check pencil case', emoji: '✏️', order: 4 },
  { id: 't5', label: 'Ring the bell', emoji: '🔔', order: 5 },
];

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
const StarIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="#FFC107">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
  </Svg>
);
const SmallLeafIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="#66BB6A" stroke="#388E3C" strokeWidth="1.5" />
    <Path d="M2 22l8-8" stroke="#388E3C" strokeWidth="1.5" strokeLinecap="round" />
    {/* Smiley face on leaf */}
    <Circle cx="14" cy="11" r="0.8" fill="#1B5E20" />
    <Circle cx="17" cy="11" r="0.8" fill="#1B5E20" />
    <Path d="M14 13.5q1.5 1.5 3 0" fill="none" stroke="#1B5E20" strokeWidth="0.8" strokeLinecap="round" />
  </Svg>
);
const SparkleSmallIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="#FFC107">
    <Path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
  </Svg>
);

type ScreenState = 'INTRO' | 'GAMEPLAY' | 'RESULTS';

export default function BackpackOasisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedAvatar?: string; selectedMood?: string; selectedLanguage?: string }>();
  const { startSession, endSession, clearSession, rewards } = useGameStore();
  const { child } = useChildStore();

  const selectedAvatarId = params.selectedAvatar || 'avatar_1';
  const selectedExplorer = EXPLORERS.find((e) => e.id === selectedAvatarId) || EXPLORERS[0];

  const [screen, setScreen] = useState<ScreenState>('INTRO');

  // ── GAME STATE ─────────────────────────────────────────────────────────
  const [shuffledTasks, setShuffledTasks] = useState<Task[]>([]);
  const [slots, setSlots] = useState<(Task | null)[]>([null, null, null, null, null]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [wrongPicks, setWrongPicks] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);
  const [message, setMessage] = useState("Drag each task into the right order.");
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Animations
  const feedbackScale = useRef(new Animated.Value(0)).current;
  const slotFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    shuffleTasks();
  }, []);

  const shuffleTasks = () => {
    const shuffled = [...TASKS].sort(() => Math.random() - 0.5);
    setShuffledTasks(shuffled);
    setSlots([null, null, null, null, null]);
    setCurrentSlotIndex(0);
    setAttempts(0);
    setWrongPicks(0);
  };

  const runHaptic = (type: 'success' | 'error' | 'light') => {
    if (Platform.OS !== 'web') {
      if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStartGame = () => {
    shuffleTasks();
    setStartTime(Date.now());
    setMessage("Drag each task into the right order.");
    setScreen('GAMEPLAY');
    startSession('BACKPACK_OASIS');
  };

  const handleTaskTap = (task: Task) => {
    if (currentSlotIndex >= 5) return;

    runHaptic('light');
    setAttempts(prev => prev + 1);

    // Check if the task is the correct one for current slot
    const expectedOrder = currentSlotIndex + 1;
    if (task.order === expectedOrder) {
      // Correct pick
      const newSlots = [...slots];
      newSlots[currentSlotIndex] = task;
      setSlots(newSlots);
      setCurrentSlotIndex(prev => prev + 1);
      setShuffledTasks(prev => prev.filter(t => t.id !== task.id));

      runHaptic('success');
      showFeedbackBubble('correct');
      setMessage(`Great job!\nYou're doing awesome!`);

      // Check if game is complete
      if (currentSlotIndex + 1 >= 5) {
        setTimeout(() => finishGame(), 800);
      }
    } else {
      // Wrong pick
      setWrongPicks(prev => prev + 1);
      runHaptic('error');
      showFeedbackBubble('wrong');
      setMessage("Not quite right.\nTry again!");
    }
  };

  const showFeedbackBubble = (type: 'correct' | 'wrong') => {
    setShowFeedback(type);
    feedbackScale.setValue(0);
    Animated.spring(feedbackScale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();

    setTimeout(() => setShowFeedback(null), 1500);
  };

  const handleRestart = () => {
    shuffleTasks();
    setStartTime(Date.now());
    setMessage("Drag each task into the right order.");
  };

  const handleCheckOrder = () => {
    // Check if all slots are filled correctly
    const allCorrect = slots.every((slot, idx) => slot?.order === idx + 1);
    if (allCorrect) {
      finishGame();
    } else {
      runHaptic('error');
      setMessage("Some tasks are out of order.\nKeep trying!");
    }
  };

  const finishGame = async () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    setCompletionTime(duration);
    setScreen('RESULTS');

    const correctCount = slots.filter((slot, idx) => slot?.order === idx + 1).length;
    const metrics = {
      correctSequence: correctCount,
      completionTime: duration,
      attempts,
      wrongPicks,
    };

    endSession(metrics);

    if (child) {
      const sessionId = Date.now().toString();
      try {
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
          correct_sequence: correctCount,
          completion_time: duration,
          attempts,
          wrong_picks: wrongPicks,
          synced: 0,
          created_at: Date.now(),
        });

        if (wrongPicks === 0) {
          rewards.addWaterDrop();
          rewards.addFlower();
        } else if (correctCount === 5) {
          rewards.addWaterDrop();
        }
      } catch (e) {
        console.error('Error saving metrics', e);
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
    shuffleTasks();
  };

  // ── SCORE CALCULATION ──────────────────────────────────────────────────
  const getScore = () => {
    const baseScore = 100;
    const penalty = wrongPicks * 8;
    const timePenalty = Math.max(0, Math.floor(completionTime / 1000 / 10) * 2); // 2 pts per 10 seconds
    return Math.max(0, Math.min(100, baseScore - penalty - timePenalty));
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Amazing!';
    if (score >= 70) return 'Great!';
    if (score >= 50) return 'Good!';
    return 'Keep Practicing!';
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  INTRO SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  if (screen === 'INTRO') {
    return (
      <View style={st.screen}>
        <Image source={require('../../assets/backpack_background.png')} style={st.bg} resizeMode="cover" />
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
            {/* Top Container */}
            <View style={st.introTopGroup}>
              {/* Title Section */}
              <View style={st.introTitleWrap}>
                <Image
                  source={require('../../assets/backpack_oasis_title.png')}
                  style={st.introTitleImg}
                  resizeMode="contain"
                />
                <Text style={st.introSubtitle}>Help {selectedExplorer.name} prepare for school</Text>
              </View>

              {/* Instruction Card */}
              <View style={st.introCard}>
                <View style={st.introCardRow}>
                  <LeafIcon />
                  <Text style={st.introCardText}>Put the tasks in the right order.</Text>
                </View>
              </View>

              {/* Pills */}
              <View style={st.pillsRow}>
                <View style={st.pill}><ClockIcon /><Text style={st.pillText}>Time: 2 min</Text></View>
                <View style={st.pill}><GamepadIcon /><Text style={st.pillText}>Planning game</Text></View>
              </View>
            </View>

            {/* Character Preview (Middle) */}
            <View style={st.introCharacterArea}>
              <Image source={selectedExplorer.image} style={st.introCharacter} resizeMode="contain" />
            </View>

            {/* Bottom Container */}
            <View style={st.introBottomGroup}>
              {/* Task Preview Steps */}
              <View style={st.previewStepsCard}>
                <Text style={st.previewStepsLabel}>Get ready step by step.</Text>
                <View style={st.timelineContainer}>
                  {/* Background dashed line */}
                  <View style={st.timelineLine} />
                  <View style={st.timelineRow}>
                    {TASKS.map((task, idx) => (
                      <View key={task.id} style={st.timelineStep}>
                        <Text style={st.timelineStepNumber}>{idx + 1}</Text>
                        <View style={st.timelineStepCircle}>
                          <Text style={st.timelineStepEmoji}>{task.emoji}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
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
    const progressPercent = (currentSlotIndex / 5) * 100;

    return (
      <View style={st.screen}>
        <Image source={require('../../assets/backpack_background.png')} style={st.bg} resizeMode="cover" />
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
            contentContainerStyle={st.playScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Title */}
            <Text style={st.playTitle}>Backpack Oasis</Text>
            <Text style={st.playSubtitle}>Put the tasks in order</Text>

            {/* Instruction Card */}
            <View style={st.playInstructionCard}>
              <LeafIcon />
              <Text style={st.playInstructionText}>Drag each task into the right order.</Text>
            </View>

            {/* Progress Bar */}
            <View style={st.progressRow}>
              <Text style={st.progressLabel}>Task {currentSlotIndex} of 5</Text>
              <View style={st.progressBarBg}>
                <View style={[st.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <StarIcon />
            </View>

            {/* Slots Area + Character */}
            <View style={st.slotsCharacterRow}>
              {/* Slots Column */}
              <View style={st.slotsColumn}>
                {[1, 2, 3, 4, 5].map((num, idx) => {
                  const slotTask = slots[idx];
                  const isActive = idx === currentSlotIndex;
                  return (
                    <View key={num} style={[st.slotRow, isActive && st.slotRowActive]}>
                      <View style={[st.slotNumber, slotTask ? st.slotNumberFilled : (isActive ? st.slotNumberActive : {})]}>
                        <Text style={[st.slotNumberText, slotTask ? st.slotNumberTextFilled : {}]}>{num}</Text>
                      </View>
                      <View style={[st.slotBox, slotTask ? st.slotBoxFilled : (isActive ? st.slotBoxActive : {})]}>
                        {slotTask ? (
                          <View style={st.slotContent}>
                            <Text style={st.slotEmoji}>{slotTask.emoji}</Text>
                            <Text style={st.slotLabel}>{slotTask.label}</Text>
                          </View>
                        ) : (
                          isActive && <View style={st.slotDashedInner} />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Character + Speech Bubble */}
              <View style={st.characterSpeechArea}>
                <View style={st.speechBubble}>
                  <Text style={st.speechText}>{message}</Text>
                </View>
                <Image source={selectedExplorer.image} style={st.playCharacter} resizeMode="contain" />
              </View>
            </View>

            {/* Available Tasks (Draggable Cards) */}
            <View style={st.availableCardsRow}>
              {shuffledTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={st.availableCard}
                  activeOpacity={0.7}
                  onPress={() => handleTaskTap(task)}
                >
                  <Text style={st.availableEmoji}>{task.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Motivational Tip */}
            <View style={st.tipCard}>
              <LeafIcon />
              <Text style={st.tipText}>One step at a time helps {selectedExplorer.name} get ready.</Text>
              <SmallLeafIcon />
            </View>

            {/* Bottom Buttons */}
            <View style={st.playActions}>
              <TouchableOpacity style={st.btnRestart} activeOpacity={0.8} onPress={handleRestart}>
                <RefreshIcon />
                <Text style={st.btnRestartText}>Restart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.btnCheckOrder, currentSlotIndex < 5 && st.btnCheckOrderDisabled]}
                activeOpacity={0.8}
                onPress={handleCheckOrder}
                disabled={currentSlotIndex < 5}
              >
                <Text style={st.btnCheckOrderText}>Check Order</Text>
                <ArrowRightIcon />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Feedback Overlay */}
          {showFeedback && (
            <Animated.View style={[
              st.feedbackOverlay,
              { transform: [{ scale: feedbackScale }] },
            ]}>
              <View style={[st.feedbackBubble, showFeedback === 'correct' ? st.feedbackCorrect : st.feedbackWrong]}>
                <Text style={st.feedbackEmoji}>{showFeedback === 'correct' ? '✅' : '❌'}</Text>
                <Text style={st.feedbackText}>
                  {showFeedback === 'correct' ? 'Correct!' : 'Try again!'}
                </Text>
              </View>
            </Animated.View>
          )}
        </SafeAreaView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  RESULTS SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  const score = getScore();
  const scoreLabel = getScoreLabel(score);

  return (
    <View style={st.screen}>
      <Image source={require('../../assets/backpack_background.png')} style={st.bg} resizeMode="cover" />
      <View style={st.bgOverlay} />
      <StatusBar style="dark" />
      <SafeAreaView style={st.safe}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={st.resScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Title */}
          <Text style={st.resTitle}>Great job!</Text>
          <Text style={st.resSubtitle}>{selectedExplorer.name} is ready for school!</Text>

          {/* Character + Score Card */}
          <View style={st.resTopArea}>
            <Image source={selectedExplorer.image} style={st.resCharacter} resizeMode="contain" />
            <View style={st.scoreCard}>
              <View style={st.scoreInner}>
                <View style={st.scoreLeafRow}>
                  <SmallLeafIcon />
                  <Text style={st.scoreTitleLabel}>Your Score</Text>
                  <SmallLeafIcon />
                </View>
                <View style={st.scoreNumberRow}>
                  <SparkleSmallIcon />
                  <Text style={st.scoreNumber}>{score}</Text>
                  <SparkleSmallIcon />
                </View>
                <View style={st.scoreBadge}>
                  <Text style={st.scoreBadgeText}>{scoreLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Reward Card */}
          <View style={st.rewardCard}>
            <View style={st.rewardLeafWrap}>
              <SmallLeafIcon />
            </View>
            <View style={st.rewardTextWrap}>
              <Text style={st.rewardTitle}>You earned a leaf!</Text>
              <View style={st.rewardDescRow}>
                <Text style={st.rewardDesc}>Your Focus Garden{'\n'}is growing!</Text>
                <SmallLeafIcon />
              </View>
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

// ═══════════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════════
const HP = 20;

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E8F5E9' },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.35)' },
  safe: { flex: 1 },

  // ── Shared Nav ────────────────────────────────────────────────────────
  topNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: HP, paddingTop: 10, alignItems: 'center' },
  iconBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  rightNav: { flexDirection: 'row', gap: 10 },

  // ═══════════════════════════════════════════════════════════════════════
  //  INTRO STYLES
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
    gap: 16,
  },

  introTitleWrap: { alignItems: 'center', marginTop: 5, marginBottom: 5 },
  introTitleImg: {
    width: SW * 0.90,
    height: SH * 0.16,
    marginVertical: 4,
    transform: [{ scale: 1.25 }],
  },
  introSubtitle: { fontSize: 15, fontWeight: '700', color: '#37474F', textAlign: 'center', marginTop: 2 },

  introCard: {
    backgroundColor: 'rgba(255,253,240,0.95)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#F5E6CA',
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  introCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  introCardText: { fontSize: 15, fontWeight: '700', color: '#37474F', flex: 1 },

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

  introCharacterArea: { width: '100%', alignItems: 'center', marginVertical: 8 },
  introCharacter: { width: SW * 0.52, height: SH * 0.26 },

  previewStepsCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  previewStepsLabel: { fontSize: 14, fontWeight: '700', color: '#5D4037', marginBottom: 12 },
  timelineContainer: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  timelineLine: {
    position: 'absolute',
    top: 36, // vertically aligned with 40px circle (16px label + 4px margin + 20px center)
    left: '8%',
    right: '8%',
    height: 0,
    borderWidth: 1.2,
    borderColor: '#EF9A9A',
    borderStyle: 'dashed',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  timelineStep: {
    alignItems: 'center',
    width: (SW - 64) / 5,
  },
  timelineStepNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF5350',
    marginBottom: 4,
  },
  timelineStepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#EF9A9A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 1,
  },
  timelineStepEmoji: {
    fontSize: 20,
  },

  introActions: { flexDirection: 'row', gap: 10, width: '100%' },
  btnPractice: {
    flex: 0.45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(224,242,241,0.95)',
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
  },
  btnPracticeText: { fontSize: 16, fontWeight: '700', color: '#00796B' },
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
  //  GAMEPLAY STYLES
  // ═══════════════════════════════════════════════════════════════════════
  playScrollContent: { paddingHorizontal: HP, paddingBottom: 30, alignItems: 'center' },

  playTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A5D2A',
    textAlign: 'center',
    marginTop: 5,
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  playSubtitle: { fontSize: 14, fontWeight: '700', color: '#37474F', marginBottom: 8 },

  playInstructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,253,240,0.95)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#F5E6CA',
    width: '100%',
    gap: 8,
    marginBottom: 8,
  },
  playInstructionText: { fontSize: 14, fontWeight: '700', color: '#37474F', flex: 1 },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  progressLabel: { fontSize: 12, fontWeight: '700', color: '#455A64' },
  progressBarBg: { flex: 1, height: 8, backgroundColor: 'rgba(224,224,224,0.8)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00ACC1', borderRadius: 4 },

  slotsCharacterRow: { flexDirection: 'row', width: '100%', gap: 8, marginBottom: 10 },

  slotsColumn: { flex: 1, gap: 6 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotRowActive: {},

  slotNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(176,190,197,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotNumberActive: { backgroundColor: '#00ACC1' },
  slotNumberFilled: { backgroundColor: '#4CAF50' },
  slotNumberText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  slotNumberTextFilled: { color: '#FFF' },

  slotBox: {
    flex: 1,
    minHeight: 44,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  slotBoxActive: {
    borderColor: '#00ACC1',
    backgroundColor: 'rgba(224,247,250,0.7)',
    borderStyle: 'dashed',
  },
  slotBoxFilled: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#C8E6C9',
    borderStyle: 'solid',
  },
  slotDashedInner: {},
  slotContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotEmoji: { fontSize: 22 },
  slotLabel: { fontSize: 12, fontWeight: '700', color: '#37474F', flex: 1 },

  characterSpeechArea: { width: SW * 0.32, alignItems: 'center', justifyContent: 'center' },
  speechBubble: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 10,
    borderRadius: 14,
    borderBottomRightRadius: 4,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    width: '100%',
  },
  speechText: { fontSize: 11, fontWeight: '700', color: '#1A237E', textAlign: 'center' },
  playCharacter: { width: SW * 0.28, height: SH * 0.16 },

  availableCardsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  availableCard: {
    width: (SW - HP * 2 - 40) / 5,
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  availableEmoji: { fontSize: 28 },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,248,225,0.95)',
    padding: 12,
    borderRadius: 16,
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFECB3',
    marginBottom: 12,
  },
  tipText: { fontSize: 13, fontWeight: '700', color: '#5D4037', flex: 1 },

  playActions: { flexDirection: 'row', gap: 10, width: '100%' },
  btnRestart: {
    flex: 0.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(224,247,250,0.95)',
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#B2EBF2',
  },
  btnRestartText: { fontSize: 16, fontWeight: '700', color: '#00838F' },
  btnCheckOrder: {
    flex: 0.6,
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
  btnCheckOrderDisabled: { opacity: 0.5 },
  btnCheckOrderText: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  feedbackOverlay: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    zIndex: 100,
  },
  feedbackBubble: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  feedbackCorrect: { backgroundColor: '#E8F5E9', borderWidth: 2, borderColor: '#4CAF50' },
  feedbackWrong: { backgroundColor: '#FFEBEE', borderWidth: 2, borderColor: '#EF5350' },
  feedbackEmoji: { fontSize: 24 },
  feedbackText: { fontSize: 18, fontWeight: '800', color: '#37474F' },

  // ═══════════════════════════════════════════════════════════════════════
  //  RESULTS STYLES
  // ═══════════════════════════════════════════════════════════════════════
  resScrollContent: { paddingHorizontal: HP, paddingBottom: 30, alignItems: 'center' },

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
  scoreInner: { alignItems: 'center' },
  scoreLeafRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  scoreTitleLabel: { fontSize: 14, fontWeight: '700', color: '#5D4037' },
  scoreNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreNumber: { fontSize: 52, fontWeight: '900', color: '#00838F' },
  scoreBadge: {
    backgroundColor: '#673AB7',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 6,
  },
  scoreBadgeText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

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
  rewardLeafWrap: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  rewardTextWrap: { flex: 1 },
  rewardTitle: { fontSize: 16, fontWeight: '800', color: '#1A237E', marginBottom: 4 },
  rewardDescRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
