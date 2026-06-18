import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
const ClockIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#78909C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);
const CheckCircleIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#4CAF50" />
    <Path d="M7 12.5l3 3 7-7" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const InfoIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#00B4D8" />
    <Path d="M12 16v-4M12 8h.01" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
const StarIcon = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="#FFB300">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
  </Svg>
);

// ── Explorer data ──────────────────────────────────────────────────────
const EXPLORERS = [
  { id: 'avatar_1', name: 'Nawat', image: require('../../assets/nawat_character.png') },
  { id: 'avatar_2', name: 'Zahra', image: require('../../assets/zahra_placeholder.png') },
  { id: 'avatar_3', name: 'Sami', image: require('../../assets/sami_placeholder.png') },
  { id: 'avatar_4', name: 'Lulu', image: require('../../assets/lulu_placeholder.png') },
];

// ── Mood data ──────────────────────────────────────────────────────────
const MOOD_MAP: Record<string, { label: string; moodIcon: any }> = {
  CALM: { label: 'calm', moodIcon: require('../../assets/mood_calm.png') },
  HAPPY: { label: 'happy', moodIcon: require('../../assets/mood_happy.png') },
  EXCITED: { label: 'excited', moodIcon: require('../../assets/mood_excited.png') },
  TIRED: { label: 'tired', moodIcon: require('../../assets/mood_tired.png') },
  SAD: { label: 'sad', moodIcon: require('../../assets/mood_sad.png') },
  ANGRY: { label: 'angry', moodIcon: require('../../assets/mood_angry.png') },
};

// ── Mission data ───────────────────────────────────────────────────────
const RECOMMENDED_MISSION = {
  id: 'cloud-valley',
  title: 'Cloud Valley',
  description: 'Trace the calm path and help cross the clouds.',
  image: require('../../assets/cloud_valley_preview.png'),
  duration: '3 min',
  tag: 'Recommended for calm days',
  route: '/cloud-valley' as const,
};

const SECONDARY_MISSIONS = [
  {
    id: 'noise-souk',
    title: 'Noise Souk',
    description: 'Find quiet in a noisy place.',
    image: require('../../assets/noise_souk_preview.png'),
    route: '/noise-souk' as const,
  },
  {
    id: 'gate-patience',
    title: 'Gate of\nPatience',
    description: 'Practice stop and go.',
    image: require('../../assets/gate_patience_preview.png'),
    route: '/gate-of-patience' as const,
  },
];

// ── Responsive sizes ───────────────────────────────────────────────────
const HP = 20;
const AVATAR_H = SH * 0.16;
const TITLE_H = SH * 0.14;
const MAIN_IMG_W = SW * 0.28;
const SEC_CARD_W = (SW - HP * 2 - 10) / 2;
const SEC_IMG = SEC_CARD_W * 0.35;

export default function TodaysJourneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    selectedLanguage?: string;
    selectedAvatar?: string;
    selectedMood?: string;
  }>();

  const selectedAvatarId = params.selectedAvatar || 'avatar_1';
  const selectedMoodId = params.selectedMood || 'CALM';
  const selectedExplorer = EXPLORERS.find((e) => e.id === selectedAvatarId) || EXPLORERS[0];
  const moodInfo = MOOD_MAP[selectedMoodId] || MOOD_MAP.CALM;

  const handleStartMission = () => {
    router.push({
      pathname: RECOMMENDED_MISSION.route,
      params: { selectedLanguage: params.selectedLanguage || 'ENGLISH', selectedAvatar: selectedAvatarId, selectedMood: selectedMoodId },
    });
  };

  const handleChooseAnother = () => {
    router.back();
  };

  return (
    <View style={s.screen}>
      <Image source={require('../../assets/choose_explorer_bg.png')} style={s.bgImg} resizeMode="cover" />
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Top nav */}
        <View style={s.topNav}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={s.dots}>
            <View style={s.dot} />
            <View style={s.dot} />
            <View style={[s.dot, s.dotActive]} />
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <View style={s.body}>
          {/* Title */}
          <View style={s.titleArea}>
            <Image source={require('../../assets/today_journey_title.png')} style={s.titleImg} resizeMode="contain" />
            <Text style={s.subtitle}>{selectedExplorer.name} picked a {moodInfo.label} adventure for you.</Text>
          </View>

          {/* Character */}
          <View style={s.avatarWrap}>
            <Image source={selectedExplorer.image} style={s.avatar} resizeMode="contain" />
          </View>

          {/* Recommended mission card */}
          <View style={s.mainCard}>
            <View style={s.mainRow}>
              <View style={s.mainImgWrap}>
                <Image source={RECOMMENDED_MISSION.image} style={s.mainImg} resizeMode="cover" />
              </View>
              <View style={s.mainInfo}>
                <View style={s.mainTitleRow}>
                  <Image source={moodInfo.moodIcon} style={s.moodIcon} resizeMode="contain" />
                  <Text style={s.mainTitle}>{RECOMMENDED_MISSION.title}</Text>
                </View>
                <Text style={s.mainDesc}>{RECOMMENDED_MISSION.description}</Text>
                <View style={s.tagPill}>
                  <CheckCircleIcon />
                  <Text style={s.tagTxt}>{RECOMMENDED_MISSION.tag}</Text>
                </View>
                <View style={s.durRow}>
                  <ClockIcon />
                  <Text style={s.durTxt}>{RECOMMENDED_MISSION.duration}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Also ready later */}
          <View style={s.alsoSection}>
            <Text style={s.alsoLabel}>— Also ready later —</Text>
            <View style={s.secRow}>
              {SECONDARY_MISSIONS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={s.secCard}
                  activeOpacity={0.85}
                  onPress={() => router.push({
                    pathname: m.route,
                    params: { selectedLanguage: params.selectedLanguage || 'ENGLISH', selectedAvatar: selectedAvatarId, selectedMood: selectedMoodId },
                  })}
                >
                  <Image source={m.image} style={s.secImg} resizeMode="cover" />
                  <View style={s.secInfo}>
                    <View style={s.secTitleRow}>
                      <Text style={s.secTitle}>{m.title}</Text>
                      <StarIcon />
                    </View>
                    <Text style={s.secDesc}>{m.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info pill */}
          <View style={s.pill}>
            <InfoIcon />
            <Text style={s.pillTxt}>You can change your mission anytime.</Text>
          </View>
        </View>

        {/* Bottom */}
        <View style={s.bottom}>
          <TouchableOpacity style={s.cta} onPress={handleStartMission} activeOpacity={0.9}>
            <SparkleIcon /><Text style={s.ctaTxt}>Start Mission</Text><ArrowRightIcon />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChooseAnother} activeOpacity={0.7} style={s.choose}>
            <Text style={s.chooseTxt}>Choose another journey</Text>
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
  titleImg: { width: SW * 0.90, height: TITLE_H },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#5C6BC0', textAlign: 'center', marginTop: 2 },

  avatarWrap: { width: AVATAR_H, height: AVATAR_H, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: '100%', height: '100%' },

  // Recommended card
  mainCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 18, borderWidth: 2.5, borderColor: '#00B4D8', padding: 10, shadowColor: '#00B4D8', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 5, elevation: 4 },
  mainRow: { flexDirection: 'row', alignItems: 'flex-start' },
  mainImgWrap: { width: MAIN_IMG_W, height: MAIN_IMG_W * 0.9, borderRadius: 12, overflow: 'hidden', marginRight: 10 },
  mainImg: { width: '100%', height: '100%' },
  mainInfo: { flex: 1 },
  mainTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  moodIcon: { width: 20, height: 20 },
  mainTitle: { fontSize: 16, fontWeight: '900', color: '#1A3A4A' },
  mainDesc: { fontSize: 11, fontWeight: '500', color: '#546E7A', lineHeight: 16, marginBottom: 5 },
  tagPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(232,245,233,0.7)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 3 },
  tagTxt: { fontSize: 9, fontWeight: '700', color: '#388E3C' },
  durRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durTxt: { fontSize: 10, fontWeight: '600', color: '#78909C' },

  // Secondary missions
  alsoSection: { width: '100%', alignItems: 'center' },
  alsoLabel: { fontSize: 12, fontWeight: '700', color: '#90A4AE', marginBottom: 6 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 8 },
  secCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.90)', borderRadius: 14, borderWidth: 1.5, borderColor: '#ECEFF1', flexDirection: 'row', alignItems: 'center', padding: 7, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  secImg: { width: SEC_IMG, height: SEC_IMG, borderRadius: 8, marginRight: 6 },
  secInfo: { flex: 1 },
  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 1 },
  secTitle: { fontSize: 10, fontWeight: '800', color: '#1A3A4A', flexShrink: 1 },
  secDesc: { fontSize: 9, fontWeight: '500', color: '#78909C', lineHeight: 12 },

  // Info pill
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, gap: 5 },
  pillTxt: { fontSize: 11, fontWeight: '600', color: '#546E7A' },

  // Bottom
  bottom: { paddingHorizontal: HP, paddingBottom: Platform.OS === 'android' ? 16 : 10, alignItems: 'center' },
  cta: { backgroundColor: '#00B4D8', borderRadius: 30, borderWidth: 1.5, borderColor: '#0077B6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 12, width: '100%', shadowColor: '#0077B6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  ctaTxt: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 0.3 },
  choose: { marginTop: 10, paddingVertical: 6 },
  chooseTxt: { fontSize: 14, fontWeight: '700', color: '#78909C', textDecorationLine: 'underline' },
});
