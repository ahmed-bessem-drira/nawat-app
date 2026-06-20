import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';
import { syncService } from '@/services/sync.service';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');

// ── SVG Icons ──────────────────────────────────────────────────────────
const BackArrowIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);
const SparkleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" fill="#FFF" />
  </Svg>
);
const ArrowRightIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);
const CheckIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="12" fill="#00B4D8" />
    <Path d="M7 12.5l3 3 7-7" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Explorer data ──────────────────────────────────────────────────────
const EXPLORERS = [
  { id: 'avatar_1', name: 'Nawat', image: require('../../assets/nawat_character.png'), color: '#009688', bgColor: '#E0F2F1' },
  { id: 'avatar_2', name: 'Zahra', image: require('../../assets/zahra_placeholder.png'), color: '#9C27B0', bgColor: '#F3E5F5' },
  { id: 'avatar_3', name: 'Sami', image: require('../../assets/sami_placeholder.png'), color: '#1E88E5', bgColor: '#E3F2FD' },
  { id: 'avatar_4', name: 'Lulu', image: require('../../assets/lulu_placeholder.png'), color: '#4CAF50', bgColor: '#E8F5E9' },
];

// ── Mood data ──────────────────────────────────────────────────────────
const MOODS = [
  { id: 'CALM', label: 'Calm', image: require('../../assets/mood_calm.png') },
  { id: 'HAPPY', label: 'Happy', image: require('../../assets/mood_happy.png') },
  { id: 'EXCITED', label: 'Excited', image: require('../../assets/mood_excited.png') },
  { id: 'TIRED', label: 'Tired', image: require('../../assets/mood_tired.png') },
  { id: 'SAD', label: 'Sad', image: require('../../assets/mood_sad.png') },
  { id: 'ANGRY', label: 'Angry', image: require('../../assets/mood_angry.png') },
];

// ── Responsive sizes (all derived from screen dimensions) ──────────────
const HP = 20; // horizontal padding
const GRID_GAP = 10;
const CARD_W = (SW - HP * 2 - GRID_GAP) / 2;
const CARD_IMG = CARD_W * 0.42;
const AVATAR_H = SH * 0.16;
const TITLE_H = SH * 0.09;

export default function MoodCheckInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedLanguage?: string; selectedAvatar?: string }>();
  const { child, setMood } = useChildStore();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const selectedAvatarId = params.selectedAvatar || 'avatar_1';
  const selectedExplorer = EXPLORERS.find((e) => e.id === selectedAvatarId) || EXPLORERS[0];

  const handleMoodSelect = (moodId: string) => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
    }
    setSelectedMood(moodId);
  };

  const handleContinue = async () => {
    if (!selectedMood) return;
    setMood(selectedMood);
    if (child) {
      try {
        const existing = await databaseService.query('child', 'id = ?', [child.id]);
        if (existing.length === 0) {
          await databaseService.insert('child', {
            id: child.id, nickname: child.nickname, avatar: child.avatar,
            language: child.language, created_at: new Date(child.createdAt).getTime(),
          });
        }
        await databaseService.insert('mood_entry', {
          id: Date.now().toString(), child_id: child.id, mood: selectedMood,
          synced: 0, created_at: Date.now(),
        });
        syncService.syncData().catch(() => {});
      } catch (error) { console.error('Error saving mood:', error); }
    }
    router.push({
      pathname: '/todays-journey',
      params: { selectedLanguage: params.selectedLanguage || 'ENGLISH', selectedAvatar: selectedAvatarId, selectedMood },
    });
  };

  const handleSkip = () => {
    router.push({
      pathname: '/todays-journey',
      params: { selectedLanguage: params.selectedLanguage || 'ENGLISH', selectedAvatar: selectedAvatarId, selectedMood: 'CALM' },
    });
  };

  return (
    <View style={s.screen}>
      <Image source={require('../../assets/choose_explorer_bg.png')} style={s.bgImg} resizeMode="cover" />
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Top nav */}
        <View style={s.topNav}>
          <TouchableOpacity style={s.backBtn} onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }} activeOpacity={0.8}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={s.dots}>
            <View style={s.dot} />
            <View style={[s.dot, s.dotActive]} />
            <View style={s.dot} />
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <View style={s.body}>
          {/* Title */}
          <View style={s.titleArea}>
            <Image source={require('../../assets/how_do_you_feel_title.png')} style={s.titleImg} resizeMode="contain" />
            <Text style={s.subtitle}>Tell {selectedExplorer.name} how your brain feels today.</Text>
          </View>

          {/* Character */}
          <View style={s.avatarWrap}>
            <Image source={selectedExplorer.image} style={s.avatar} resizeMode="contain" />
          </View>

          {/* 2×3 Grid */}
          <View style={s.grid}>
            {MOODS.map((mood) => {
              const sel = mood.id === selectedMood;
              return (
                <TouchableOpacity key={mood.id} style={[s.card, sel && s.cardSel]} onPress={() => handleMoodSelect(mood.id)} activeOpacity={0.85}>
                  {sel && <View style={s.check}><CheckIcon /></View>}
                  <Image source={mood.image} style={s.cardImg} resizeMode="contain" />
                  <Text style={s.cardLbl}>{mood.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom */}
        <View style={s.bottom}>
          <TouchableOpacity style={[s.cta, !selectedMood && s.ctaOff]} onPress={handleContinue} activeOpacity={selectedMood ? 0.9 : 1} disabled={!selectedMood}>
            <SparkleIcon /><Text style={s.ctaTxt}>Continue</Text><ArrowRightIcon />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={s.skip}>
            <Text style={s.skipTxt}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, width: SW, height: SH, backgroundColor: '#F3F8FA' },
  bgImg: { ...StyleSheet.absoluteFillObject, width: SW, height: SH },
  safe: { flex: 1 },

  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: HP, paddingVertical: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#8D6E63', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E6E4DD' },
  dotActive: { backgroundColor: '#009688' },

  body: { flex: 1, paddingHorizontal: HP, justifyContent: 'space-evenly', alignItems: 'center' },

  titleArea: { alignItems: 'center', width: '100%' },
  titleImg: { width: SW * 0.85, height: TITLE_H },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#5C6BC0', textAlign: 'center', marginTop: 2 },

  avatarWrap: { width: AVATAR_H, height: AVATAR_H, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: '100%', height: '100%' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, width: '100%' },
  card: { width: CARD_W, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, borderWidth: 2, borderColor: '#ECEFF1', paddingVertical: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardSel: { borderColor: '#00B4D8', borderWidth: 2.5, shadowColor: '#00B4D8', shadowOpacity: 0.15, elevation: 4 },
  check: { position: 'absolute', top: 4, right: 4, zIndex: 1 },
  cardImg: { width: CARD_IMG, height: CARD_IMG, marginBottom: 2 },
  cardLbl: { fontSize: 12, fontWeight: '800', color: '#455A64' },

  bottom: { paddingHorizontal: HP, paddingBottom: Platform.OS === 'android' ? 16 : 10, alignItems: 'center' },
  cta: { backgroundColor: '#00B4D8', borderRadius: 30, borderWidth: 1.5, borderColor: '#0077B6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 12, width: '100%', shadowColor: '#0077B6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  ctaOff: { opacity: 0.5 },
  ctaTxt: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 0.3 },
  skip: { marginTop: 10, paddingVertical: 6 },
  skipTxt: { fontSize: 14, fontWeight: '700', color: '#78909C', textDecorationLine: 'underline' },
});
