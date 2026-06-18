import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

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

// ── Explorer data ──────────────────────────────────────────────────────
const EXPLORERS = [
  {
    id: 'avatar_1',
    name: 'Nawat',
    image: require('../../assets/nawat_character.png'),
    color: '#009688',
    bgColor: '#E0F2F1',
  },
  {
    id: 'avatar_2',
    name: 'Zahra',
    image: require('../../assets/zahra_placeholder.png'),
    color: '#9C27B0',
    bgColor: '#F3E5F5',
  },
  {
    id: 'avatar_3',
    name: 'Sami',
    image: require('../../assets/sami_placeholder.png'),
    color: '#1E88E5',
    bgColor: '#E3F2FD',
  },
  {
    id: 'avatar_4',
    name: 'Lulu',
    image: require('../../assets/lulu_placeholder.png'),
    color: '#4CAF50',
    bgColor: '#E8F5E9',
  },
];

// ── Responsive helpers ─────────────────────────────────────────────────
const PREVIEW_SIZE = Math.min(SCREEN_W * 0.42, SCREEN_H * 0.22);
const CARD_WIDTH = (SCREEN_W - 20 * 2 - 12) / 2; // 2 columns with gap
const CARD_IMG_SIZE = CARD_WIDTH * 0.48;

export default function ChooseExplorerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedLanguage?: string }>();
  const [selectedId, setSelectedId] = useState<string>(EXPLORERS[0].id);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const selectedExplorer = EXPLORERS.find((e) => e.id === selectedId) || EXPLORERS[0];

  // Gentle floating animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim, selectedId]);

  const handleContinue = () => {
    router.push({
      pathname: '/mood-check-in',
      params: {
        selectedLanguage: params.selectedLanguage || 'ENGLISH',
        selectedAvatar: selectedId,
      },
    });
  };

  return (
    <ImageBackground
      source={require('../../assets/choose_explorer_bg.png')}
      style={styles.root}
      resizeMode="cover"
    >
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* ── Top navigation ─────────────────────────────────────── */}
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Main content area (fills available space) ───────── */}
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleArea}>
            <Image
              source={require('../../assets/choose_explorer_title.png')}
              style={styles.titleImg}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Pick a buddy for today's journey</Text>
          </View>

          {/* Main avatar preview */}
          <View style={styles.previewArea}>
            <Animated.View
              style={[
                styles.previewWrap,
                { transform: [{ translateY: bounceAnim }] },
              ]}
            >
              <Image
                source={selectedExplorer.image}
                style={styles.previewImg}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* 2×2 Grid */}
          <View style={styles.grid}>
            {EXPLORERS.map((explorer) => {
              const isSelected = explorer.id === selectedId;
              return (
                <TouchableOpacity
                  key={explorer.id}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => setSelectedId(explorer.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.cardImgWrap, { backgroundColor: explorer.bgColor }]}>
                    <Image
                      source={explorer.image}
                      style={styles.cardImg}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={[styles.cardName, { color: explorer.color }]}>
                    {explorer.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Continue button (pinned at bottom of safe area) ── */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <SparkleIcon />
            <Text style={styles.continueTxt}>Continue</Text>
            <ArrowRightIcon />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  /* ── Root & safe area ─────────────────────────────────────── */
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F8FA',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  /* ── Top navigation ───────────────────────────────────────── */
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E6E4DD',
  },
  dotActive: {
    backgroundColor: '#009688',
  },

  /* ── Main scrollable content ──────────────────────────────── */
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },

  /* Title */
  titleArea: {
    alignItems: 'center',
    width: '100%',
  },
  titleImg: {
    width: SCREEN_W * 0.93,
    height: SCREEN_H * 0.135,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5C6BC0',
    textAlign: 'center',
  },

  /* Main avatar preview */
  previewArea: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },

  /* 2×2 grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    width: '100%',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ECEFF1',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#00B4D8',
    borderWidth: 3,
    shadowColor: '#00B4D8',
    shadowOpacity: 0.18,
    elevation: 4,
  },
  cardImgWrap: {
    width: '100%',
    height: CARD_IMG_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardImg: {
    // Scale up 1.9× and shift up so the face/head fills the card area
    width: CARD_IMG_SIZE * 1.9,
    height: CARD_IMG_SIZE * 1.9,
    marginTop: -CARD_IMG_SIZE * 0.06,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '800',
  },

  /* ── Bottom button area ───────────────────────────────────── */
  bottomArea: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 20 : 14,
    marginBottom: 8,
  },
  continueBtn: {
    backgroundColor: '#00B4D8',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#0077B6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
    width: '100%',
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  continueTxt: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
