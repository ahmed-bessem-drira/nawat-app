import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Emojis and simple SVG representations for icons
const EiffelTowerIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C4DFF" strokeWidth="2.5">
    <Path d="M12 2v20M8 22c2-4 6-4 8 0M10 6h4M9 12h6M5 22l7-20 7 20" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GoldGlobeIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5A02B" strokeWidth="2.5">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zM2 12h20" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PurpleGlobeIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zM2 12h20" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SparkleIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" fill="#FFF" />
  </Svg>
);

const ArrowRightIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);

const WateringCanSvg = () => (
  <Svg width="36" height="36" viewBox="0 0 24 24" fill="none">
    <Path d="M4 11h11a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6a1 1 0 011-1z" fill="#9C27B0" />
    <Path d="M15 13.5l4.5-2v4.5z" fill="#9C27B0" />
    <Path d="M19.5 11.5v4.5" stroke="#9C27B0" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M4 12c-2.5 0-3 1.5-3 3s.5 3 3 3" stroke="#9C27B0" strokeWidth="2.5" strokeLinecap="round" />
    <Circle cx="9.5" cy="15.5" r="3" fill="#FFF" opacity="0.3" />
    <Path d="M9.5 14.5c-.2-.2-.5-.1-.5.1v.4c0 .2.2.4.5.6.3-.2.5-.4.5-.6v-.4c0-.2-.3-.3-.5-.1z" fill="#FFF" />
  </Svg>
);

const GreenSproutSvg = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <Path d="M12 22V9M12 9c0-3.5 3-5 7-5 0 3.5-1.5 7-7 7zm0 3.5c0-2.5-2.5-4.5-5.5-4.5 0 2.5 1 5.5 5.5 5.5z" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#81C784" />
  </Svg>
);

export default function IndexScreen() {
  const router = useRouter();
  const { child, setChild } = useChildStore();
  const [selectedLang, setSelectedLang] = useState<string>('ENGLISH');
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Initialize selected language if child profile exists
  useEffect(() => {
    if (child && child.language) {
      setSelectedLang(child.language);
    }
  }, [child]);

  // Breathing animation for Nawat character
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim]);

  const handleLanguageChange = async (lang: string) => {
    setSelectedLang(lang);
    if (child) {
      // Update child profile language in store and SQLite
      const updatedChild = { ...child, language: lang };
      setChild(updatedChild);
      try {
        await databaseService.update('child', { language: lang }, 'id = ?', [child.id]);
      } catch (err) {
        console.error('Failed to update language in database:', err);
      }
    }
  };

  const handleStartJourney = () => {
    if (child) {
      router.push('/mood-check-in');
    } else {
      router.push({
        pathname: '/onboarding',
        params: { selectedLanguage: selectedLang },
      });
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require('../../assets/nawat_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header / Logo Section */}
            <View style={styles.headerContainer}>
              <Image
                source={require('../../assets/nawat_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.subtitle}>Help Nawat on today's journey</Text>
            </View>

            {/* Character & Floating Signposts Section */}
            <View style={styles.centerContainer}>
              {/* Nawat Character with Breathing Animation */}
              <Animated.View
                style={[
                  styles.characterWrapper,
                  { transform: [{ translateY: bounceAnim }] },
                ]}
              >
                <Image
                  source={require('../../assets/nawat_character.png')}
                  style={styles.characterImage}
                  resizeMode="contain"
                />
              </Animated.View>            </View>

            {/* Middle Badge: Play, focus, and grow your garden */}
            <View style={styles.infoBadge}>
              <View style={styles.infoBadgeIconLeft}>
                <WateringCanSvg />
              </View>
              <Text style={styles.infoBadgeText}>
                Play, focus,{"\n"}and grow your garden.
              </Text>
              <View style={styles.infoBadgeIconRight}>
                <GreenSproutSvg />
              </View>
            </View>

            {/* Actions Block */}
            <View style={styles.actionsBlock}>
              {/* Start Journey Button */}
              <TouchableOpacity
                style={styles.startJourneyBtn}
                onPress={handleStartJourney}
                activeOpacity={0.9}
              >
                <View style={styles.sparkleContainer}>
                  <SparkleIcon />
                </View>
                <Text style={styles.startJourneyText}>Start Journey</Text>
                <View style={styles.arrowContainer}>
                  <ArrowRightIcon />
                </View>
              </TouchableOpacity>

              {/* Horizontal Languages row */}
              <View style={styles.languagesRow}>
                {/* Arabic */}
                <TouchableOpacity
                  style={[
                    styles.langButton,
                    selectedLang === 'ARABIC' && styles.langButtonActive,
                  ]}
                  onPress={() => handleLanguageChange('ARABIC')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.arabicSymbol}>ئ</Text>
                  <Text style={styles.langButtonText}>Arabic</Text>
                </TouchableOpacity>

                {/* French */}
                <TouchableOpacity
                  style={[
                    styles.langButton,
                    selectedLang === 'FRENCH' && styles.langButtonActive,
                  ]}
                  onPress={() => handleLanguageChange('FRENCH')}
                  activeOpacity={0.8}
                >
                  <EiffelTowerIcon />
                  <Text style={styles.langButtonText}>Français</Text>
                </TouchableOpacity>

                {/* English */}
                <TouchableOpacity
                  style={[
                    styles.langButton,
                    selectedLang === 'ENGLISH' && styles.langButtonActive,
                  ]}
                  onPress={() => handleLanguageChange('ENGLISH')}
                  activeOpacity={0.8}
                >
                  <GoldGlobeIcon />
                  <Text style={styles.langButtonText}>English</Text>
                </TouchableOpacity>
              </View>

              {/* Parent / Teacher Access Link */}
              <TouchableOpacity style={styles.parentAccessBtn} activeOpacity={0.7}>
                <View style={styles.parentUserContainer}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00796B" strokeWidth="2.5">
                    <Circle cx="12" cy="8" r="4" />
                    <Path d="M18 21a6 6 0 0 0-12 0" />
                  </Svg>
                </View>
                <Text style={styles.parentAccessText}>Parent / Teacher Access</Text>
                <Text style={styles.parentChevron}>❯</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F7F4EB',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  logoImage: {
    width: 370,
    height: 155,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37474F',
    marginTop: 12,
    fontFamily: 'System',
  },
  centerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
    position: 'relative',
    marginVertical: 10,
  },
  characterWrapper: {
    zIndex: 2,
  },
  characterImage: {
    width: 220,
    height: 250,
  },
  signpostContainer: {
    position: 'absolute',
    right: 0,
    height: 220,
    width: 65,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  signpostPole: {
    position: 'absolute',
    width: 12,
    height: '100%',
    backgroundColor: '#8d6e63',
    borderRadius: 6,
    right: 20,
  },
  signpostItem: {
    width: 55,
    height: 40,
    borderRadius: 8,
    borderWidth: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  signpostCyan: {
    backgroundColor: '#4DD0E1',
    borderColor: '#00838F',
  },
  signpostPurple: {
    backgroundColor: '#BA68C8',
    borderColor: '#6A1B9A',
  },
  signpostGreen: {
    backgroundColor: '#81C784',
    borderColor: '#2E7D32',
  },
  signpostEmoji: {
    fontSize: 20,
  },
  infoBadge: {
    backgroundColor: '#FFFDE7', // Warm soft yellow/ivory
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F0E6D2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  infoBadgeIconLeft: {
    marginRight: 10,
  },
  infoBadgeIconRight: {
    marginLeft: 10,
  },
  infoBadgeText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#5C4033', // Warm brown
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'System',
  },
  actionsBlock: {
    gap: 12,
    marginTop: 5,
  },
  startJourneyBtn: {
    backgroundColor: '#00B4D8', // Gradient cyan
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#0077B6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  sparkleContainer: {
    width: 24,
    alignItems: 'center',
  },
  startJourneyText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'System',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  arrowContainer: {
    width: 24,
    alignItems: 'center',
  },
  chooseLanguageBtn: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: '#B39DDB', // Light purple border
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  globeIconContainer: {
    width: 24,
    alignItems: 'center',
  },
  chooseLanguageText: {
    color: '#6A1B9A',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'System',
  },
  chevronIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6A1B9A',
  },
  languagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  langButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#ECEFF1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  langButtonActive: {
    borderColor: '#FFD54F', // Golden border when active
    backgroundColor: '#FFFDE7',
    shadowOpacity: 0.15,
  },
  arabicSymbol: {
    color: '#00796B',
    fontWeight: '900',
    fontSize: 18,
    marginRight: 6,
  },
  langButtonText: {
    color: '#37474F',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 6,
    fontFamily: 'System',
  },
  parentAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  parentUserContainer: {
    marginRight: 8,
  },
  parentAccessText: {
    color: '#00796B',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  parentChevron: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00796B',
    marginLeft: 6,
  },
});

