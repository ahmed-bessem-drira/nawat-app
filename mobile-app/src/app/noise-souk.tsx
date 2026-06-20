import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';
import { syncService } from '@/services/sync.service';
import { getTranslation } from '@/i18n/translations';
import { Language } from '../../../shared/types';
import * as Haptics from 'expo-haptics';

const { width: SW, height: SH } = Dimensions.get('window');

const GAME_DURATION = 60;
const BASE_SPAWN_INTERVAL = 1200;
const MIN_SPAWN_INTERVAL = 500;
const ITEM_LIFETIME = 2000;
const OBJ_SIZE = 64;

const SOUK_COLORS = {
  bg: '#FDF6E3',
  awning: '#D32F2F',
  awningStripe: '#B71C1C',
  stall: '#8D6E63',
  gold: '#FFB300',
  text: '#3E2723',
  textLight: '#5D4037',
  target: '#4CAF50',
  distractor: '#FF5722',
  targetLabel: '🍏',
  distractorLabel: '🧡',
};

const DISTRACTOR_EMOJIS = ['🧡', '🍊', '🧶', '📿', '🔶'];
const TARGET_EMOJI = '🍏';

interface GameObject {
  id: string;
  x: number;
  y: number;
  isTarget: boolean;
  spawnTime: number;
  anim: Animated.Value;
  emoji: string;
}

export default function NoiseSoukScreen() {
  const router = useRouter();
  const { startSession, endSession, clearSession, rewards } = useGameStore();
  const { child } = useChildStore();
  const lang = child?.language;

  const [state, setState] = useState<'intro' | 'playing' | 'gameover'>('intro');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [correctHits, setCorrectHits] = useState(0);
  const [omissions, setOmissions] = useState(0);
  const [commissions, setCommissions] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [combo, setCombo] = useState(0);

  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const elapsedRef = useRef(0);
  const isActiveRef = useRef(false);
  const gameAreaRef = useRef<View>(null);
  const gameAreaBounds = useRef({ width: SW - 40, height: SH * 0.55 });
  const scoreRef = useRef(score);
  const omissionsRef = useRef(omissions);
  const commissionsRef = useRef(commissions);
  const reactionTimesRef = useRef(reactionTimes);
  const comboRef = useRef(combo);
  const correctHitsRef = useRef(correctHits);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    omissionsRef.current = omissions;
  }, [omissions]);
  useEffect(() => {
    commissionsRef.current = commissions;
  }, [commissions]);
  useEffect(() => {
    reactionTimesRef.current = reactionTimes;
  }, [reactionTimes]);
  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);
  useEffect(() => {
    correctHitsRef.current = correctHits;
  }, [correctHits]);

  const t = useCallback((key: string) => getTranslation(lang as Language, key), [lang]);

  const cleanup = useCallback(() => {
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    spawnIntervalRef.current = null;
    timerIntervalRef.current = null;
  }, []);

  const startGame = useCallback(() => {
    isActiveRef.current = true;
    elapsedRef.current = 0;

    const tick = () => {
      elapsedRef.current += 1;
      const progress = elapsedRef.current / GAME_DURATION;
      const interval = BASE_SPAWN_INTERVAL - progress * (BASE_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);

      spawnObject(progress);

      if (isActiveRef.current) {
        spawnIntervalRef.current = setTimeout(tick, interval);
      }
    };

    spawnIntervalRef.current = setTimeout(tick, 500);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGameRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const getSpawnPosition = (existing: GameObject[], progress: number) => {
    const pad = OBJ_SIZE;
    const w = gameAreaBounds.current.width - pad * 2;
    const h = gameAreaBounds.current.height - pad * 2;
    let attempts = 0;
    let x: number, y: number, overlap: boolean;

    do {
      x = pad + Math.random() * w;
      y = pad + Math.random() * h;
      overlap = existing.some((o) => {
        const dx = o.x - x;
        const dy = o.y - y;
        return Math.sqrt(dx * dx + dy * dy) < OBJ_SIZE + 8;
      });
      attempts++;
    } while (overlap && attempts < 20);

    return { x, y };
  };

  const spawnObject = useCallback((progress: number) => {
    const targetRatio = Math.max(0.35, 0.6 - progress * 0.25);
    const isTarget = Math.random() < targetRatio;
    const objId = Date.now().toString() + Math.random();

    setObjects((prev) => {
      const { x, y } = getSpawnPosition(prev, progress);
      const obj: GameObject = {
        id: objId,
        x,
        y,
        isTarget,
        spawnTime: Date.now(),
        anim: new Animated.Value(0),
        emoji: isTarget ? TARGET_EMOJI : DISTRACTOR_EMOJIS[Math.floor(Math.random() * DISTRACTOR_EMOJIS.length)],
      };

      Animated.spring(obj.anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      return [...prev, obj];
    });

    const timer = setTimeout(() => {
      cleanupTimersRef.current.delete(timer);
      setObjects((prev) => {
        if (!isActiveRef.current) return prev;
        const match = prev.find((o) => o.id === objId);
        if (match && isTarget) {
          setOmissions((n) => n + 1);
        }
        return prev.filter((o) => o.id !== objId);
      });
    }, ITEM_LIFETIME);
    cleanupTimersRef.current.add(timer);
  }, []);

  useEffect(() => {
    if (state !== 'playing') return;
    startSession('NOISE_SOUK');
    startGame();
    return () => {
      isActiveRef.current = false;
      cleanup();
      cleanupTimersRef.current.forEach(clearTimeout);
      cleanupTimersRef.current.clear();
    };
  }, [state]);

  const handleObjectTap = (obj: GameObject) => {
    if (!isActiveRef.current) return;

    const reactionTime = Date.now() - obj.spawnTime;

    setObjects((prev) => {
      const match = prev.find((o) => o.id === obj.id);
      if (!match) return prev;

      Animated.timing(match.anim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      return prev.filter((o) => o.id !== obj.id);
    });

    if (obj.isTarget) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScore((prev) => prev + 10 + comboRef.current * 2);
      setCorrectHits((prev) => prev + 1);
      setReactionTimes((prev) => [...prev, reactionTime]);
      setCombo((prev) => prev + 1);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setScore((prev) => Math.max(0, prev - 5));
      setCommissions((prev) => prev + 1);
      setCombo(0);
    }
  };

  const endGameRef = useRef<() => void>(() => {});
  const endGame = useCallback(async () => {
    isActiveRef.current = false;
    cleanup();
    cleanupTimersRef.current.forEach(clearTimeout);
    cleanupTimersRef.current.clear();
    setState('gameover');

    const rt = reactionTimesRef.current;
    const avgReactionTime = rt.length > 0
      ? rt.reduce((a, b) => a + b, 0) / rt.length
      : 0;

    const reactionTimeVariability = rt.length > 1
      ? Math.sqrt(rt.reduce((sum, v) => sum + Math.pow(v - avgReactionTime, 2), 0) / rt.length)
      : 0;

    const finalOmissions = omissionsRef.current;
    const finalCommissions = commissionsRef.current;
    const finalScore = scoreRef.current;
    const finalCorrectHits = correctHitsRef.current;
    const accuracy = Math.max(0, Math.min(100, Math.round((finalCorrectHits / Math.max(1, finalCorrectHits + finalOmissions + finalCommissions)) * 100)));

    const metrics = {
      omissions: finalOmissions,
      commissions: finalCommissions,
      reactionTime: avgReactionTime,
      reactionTimeVariability,
      accuracy,
    };

    endSession(metrics);

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
        omissions: finalOmissions,
        commissions: finalCommissions,
        reaction_time: avgReactionTime,
        reaction_time_variability: reactionTimeVariability,
        accuracy: accuracy,
        synced: 0,
        created_at: Date.now(),
      });

      if (finalScore > 50) rewards.addWaterDrop();
      if (finalScore > 100) rewards.addFlower();
    }

    syncService.syncData().catch(() => {});
  }, [child]);

  useEffect(() => {
    endGameRef.current = endGame;
  }, [endGame]);

  const handleBack = () => {
    isActiveRef.current = false;
    cleanup();
    clearSession();
    router.back();
  };

  const handlePlayAgain = () => {
    setState('intro');
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setObjects([]);
    setCorrectHits(0);
    setOmissions(0);
    setCommissions(0);
    setReactionTimes([]);
    setCombo(0);
  };

  if (state === 'intro') {
    return (
      <View style={s.container}>
        <View style={s.awning}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[s.awningStripe, { backgroundColor: i % 2 === 0 ? SOUK_COLORS.awning : SOUK_COLORS.awningStripe }]} />
          ))}
        </View>
        <View style={s.introContent}>
          <Text style={s.soukTitle}>🛍️ {t('noiseSouk.title')}</Text>
          <Text style={s.soukDesc}>{t('noiseSouk.description')}</Text>

          <View style={s.rulesCard}>
            <View style={s.ruleRow}>
              <Text style={s.ruleEmoji}>{TARGET_EMOJI}</Text>
              <Text style={s.ruleText}>{t('noiseSouk.instruction')}</Text>
            </View>
            <View style={s.ruleRow}>
              <Text style={s.ruleEmoji}>{DISTRACTOR_EMOJIS[0]}</Text>
              <Text style={s.ruleText}>{t('noiseSouk.ignore')}</Text>
            </View>
          </View>

          <TouchableOpacity style={s.startBtn} onPress={() => setState('playing')} activeOpacity={0.8}>
            <Text style={s.startBtnText}>🛒 {t('noiseSouk.playAgain')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={handleBack} activeOpacity={0.7}>
            <Text style={s.secondaryBtnText}>{t('noiseSouk.backToMap')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (state === 'gameover') {
    return (
      <View style={s.container}>
        <View style={s.awning}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[s.awningStripe, { backgroundColor: i % 2 === 0 ? SOUK_COLORS.awning : SOUK_COLORS.awningStripe }]} />
          ))}
        </View>
        <View style={s.gameoverContent}>
          <Text style={s.gameoverTitle}>🎉 {t('noiseSouk.gameOver')}</Text>
          <Text style={s.finalScore}>{t('noiseSouk.score')}: {score}</Text>

          <View style={s.statsCard}>
            <View style={s.statRow}>
              <Text style={s.statLabel}>✅ {t('noiseSouk.correctHits')}</Text>
              <Text style={s.statValue}>{correctHits}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.statRow}>
              <Text style={s.statLabel}>⭕ {t('noiseSouk.omissions')}</Text>
              <Text style={s.statValue}>{omissions}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.statRow}>
              <Text style={s.statLabel}>❌ {t('noiseSouk.commissions')}</Text>
              <Text style={s.statValue}>{commissions}</Text>
            </View>
          </View>

          {score > 50 && (
            <Text style={s.rewardEarned}>
              {score > 100 ? '💧🌸 ' : '💧 '}
              {t('cloudValley.earnedWaterDrop')}
            </Text>
          )}

          <TouchableOpacity style={s.startBtn} onPress={handlePlayAgain} activeOpacity={0.8}>
            <Text style={s.startBtnText}>🔄 {t('noiseSouk.playAgain')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={handleBack} activeOpacity={0.7}>
            <Text style={s.secondaryBtnText}>{t('noiseSouk.backToMap')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.awning}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[s.awningStripe, { backgroundColor: i % 2 === 0 ? SOUK_COLORS.awning : SOUK_COLORS.awningStripe }]} />
        ))}
      </View>

      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.headerBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.timer}>⏱️ {timeLeft}s</Text>
          {combo > 1 && <Text style={s.combo}>🔥 x{combo}</Text>}
        </View>
        <Text style={s.headerScore}>🏆 {score}</Text>
      </View>

      <View style={s.instructionsBar}>
        <Text style={s.instructionText}>
          {t('noiseSouk.instruction')} {TARGET_EMOJI} &nbsp;|&nbsp; {t('noiseSouk.ignore')} {DISTRACTOR_EMOJIS[0]}
        </Text>
      </View>

      <View
        ref={gameAreaRef}
        style={s.gameArea}
        onLayout={(e) => {
          gameAreaBounds.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
        }}
      >
        <View style={s.stallTop} />
        {objects.map((obj) => (
          <Animated.View
            key={obj.id}
            style={[
              s.gameObject,
              {
                left: obj.x,
                top: obj.y,
                opacity: obj.anim,
                transform: [{ scale: obj.anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
              },
            ]}
          >
            <TouchableOpacity
              style={[s.objTouch, { backgroundColor: obj.isTarget ? SOUK_COLORS.target : SOUK_COLORS.distractor }]}
              onPress={() => handleObjectTap(obj)}
              activeOpacity={0.7}
            >
              <Text style={s.objEmoji}>{obj.emoji}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
        <View style={s.stallBottom} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SOUK_COLORS.bg,
  },
  awning: {
    flexDirection: 'row',
    height: 28,
    backgroundColor: SOUK_COLORS.awning,
    borderBottomWidth: 3,
    borderBottomColor: SOUK_COLORS.gold,
  },
  awningStripe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(253,246,227,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C1',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3E2723',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backArrow: {
    fontSize: 22,
    color: SOUK_COLORS.text,
    fontWeight: 'bold',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timer: {
    fontSize: 20,
    fontWeight: 'bold',
    color: SOUK_COLORS.text,
  },
  combo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  headerScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: SOUK_COLORS.gold,
  },
  instructionsBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF8E1',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE082',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: SOUK_COLORS.textLight,
    textAlign: 'center',
  },
  gameArea: {
    flex: 1,
    margin: 8,
    backgroundColor: '#F5E6CC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D7B98E',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  stallTop: {
    height: 6,
    backgroundColor: SOUK_COLORS.stall,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  stallBottom: {
    height: 6,
    backgroundColor: SOUK_COLORS.stall,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  gameObject: {
    position: 'absolute',
    width: OBJ_SIZE,
    height: OBJ_SIZE,
  },
  objTouch: {
    width: OBJ_SIZE,
    height: OBJ_SIZE,
    borderRadius: OBJ_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  objEmoji: {
    fontSize: 32,
  },
  introContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  soukTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: SOUK_COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  soukDesc: {
    fontSize: 18,
    color: SOUK_COLORS.textLight,
    marginBottom: 32,
    textAlign: 'center',
  },
  rulesCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 32,
    gap: 16,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ruleEmoji: {
    fontSize: 28,
  },
  ruleText: {
    fontSize: 16,
    fontWeight: '600',
    color: SOUK_COLORS.textLight,
    flex: 1,
  },
  startBtn: {
    backgroundColor: SOUK_COLORS.awning,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  startBtnText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: SOUK_COLORS.textLight,
    textDecorationLine: 'underline',
  },
  gameoverContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  gameoverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: SOUK_COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  finalScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SOUK_COLORS.gold,
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: SOUK_COLORS.textLight,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SOUK_COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EBE1',
  },
  rewardEarned: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
});
