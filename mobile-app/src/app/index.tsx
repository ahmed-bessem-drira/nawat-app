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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, G, LinearGradient, Stop, Defs, Rect } from 'react-native-svg';
import axios from 'axios';
import { API_URL } from '@/config/env';

const { width } = Dimensions.get('window');



// Étoiles scintillantes (Bouton Start)
const SparkleIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 2c0 4.4-3.6 8-8 8 4.4 0 8 3.6 8 8 0-4.4 3.6-8 8-8-4.4 0-8-3.6-8-8z"
      fill="#FFF9C4"
    />
    <Path
      d="M19 13c0 2.2-1.8 4-4 4 2.2 0 4 1.8 4 4 0-2.2 1.8-4 4-4-2.2 0-4-1.8-4-4z"
      fill="#FFF59D"
    />
  </Svg>
);

// Flèche droite épurée
const ArrowRightIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);

// Autres icônes (badge) inchangées
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

// ============= COMPOSANT PRINCIPAL =============

export default function IndexScreen() {
  const router = useRouter();
  const { child, setChild } = useChildStore();
  const [selectedLang, setSelectedLang] = useState<string>('ENGLISH');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const [loading, setLoading] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (child && child.language) {
      setSelectedLang(child.language);
    }
  }, [child]);

  const handleLanguageChange = async (lang: string) => {
    setSelectedLang(lang);
    if (child) {
      const updatedChild = { ...child, language: lang };
      setChild(updatedChild);
      try {
        await databaseService.update('child', { language: lang }, 'id = ?', [child.id]);
      } catch (err) {
        console.error('Failed to update language in database:', err);
      }
    }
  };

  const validateCode = async () => {
    if (!uniqueCode || uniqueCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-character code.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/sync/validate-code`, {
        uniqueCode: uniqueCode.toUpperCase(),
      });

      if (response.data.valid) {
        // Create or update child with the unique code
        const childData = {
          id: child?.id || Date.now().toString(),
          nickname: response.data.nickname,
          avatar: 'default',
          language: response.data.language,
          uniqueCode: uniqueCode.toUpperCase(),
          createdAt: new Date().toISOString(),
        };

        setChild(childData);
        
        // Save to local database
        if (child) {
          await databaseService.update('child', { unique_code: uniqueCode.toUpperCase() }, 'id = ?', [child.id]);
        } else {
          await databaseService.insert('child', { ...childData, unique_code: uniqueCode.toUpperCase() });
        }

        setShowCodeModal(false);
        setUniqueCode('');
        router.push('/mood-check-in');
      } else {
        Alert.alert('Code invalide', 'Ce code n\'est pas reconnu. Vérifie auprès de tes parents.');
      }
    } catch (error: any) {
      if (error.message?.includes('Network') || error.code === 'ERR_NETWORK') {
        Alert.alert('Erreur réseau', 'Impossible de se connecter au serveur. Vérifie ta connexion WiFi.');
      } else {
        Alert.alert('Code invalide', 'Ce code n\'est pas reconnu. Vérifie auprès de tes parents.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartJourney = () => {
    if (child) {
      router.push('/mood-check-in');
    } else {
      setShowCodeModal(true);
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
          <View style={styles.contentContainer}>
            {/* En‑tête avec logo plus grand */}
            <View style={styles.headerContainer}>
              <Image
                source={require('../../assets/nawat_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.subtitle}>Help Nawat on today's journey</Text>
            </View>

            {/* Personnage */}
            <View style={styles.centerContainer}>
              <View style={styles.characterWrapper}>
                <Image
                  source={require('../../assets/nawat_character.png')}
                  style={styles.characterImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Badge central */}
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

            {/* Boutons d'action */}
            <View style={styles.actionsBlock}>
              {/* Start Journey */}
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

              {/* Sélecteur de langue */}
              <View style={styles.languagesRow}>
                {/* Arabe */}
                <TouchableOpacity
                  style={[
                    styles.langButton,
                    selectedLang === 'ARABIC' && styles.langButtonActive,
                  ]}
                  onPress={() => handleLanguageChange('ARABIC')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.langButtonText}>Arabic</Text>
                </TouchableOpacity>

                {/* Français */}
                <TouchableOpacity
                  style={[
                    styles.langButton,
                    selectedLang === 'FRENCH' && styles.langButtonActive,
                  ]}
                  onPress={() => handleLanguageChange('FRENCH')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.langButtonText}>Français</Text>
                </TouchableOpacity>

                {/* Anglais */}
                <TouchableOpacity
                  style={[
                    styles.langButton,
                    selectedLang === 'ENGLISH' && styles.langButtonActive,
                  ]}
                  onPress={() => handleLanguageChange('ENGLISH')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.langButtonText}>English</Text>
                </TouchableOpacity>
              </View>

              {/* Accès parent */}
              <TouchableOpacity 
                style={styles.parentAccessBtn} 
                activeOpacity={0.7}
                onPress={() => {
                  // Open the web dashboard in a browser
                  if (typeof window !== 'undefined' && window.open) {
                    window.open('http://localhost:3000', '_blank');
                  }
                }}
              >
                <View style={styles.parentUserContainer}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00796B" strokeWidth="2.5">
                    <Circle cx="12" cy="8" r="4" />
                    <Path d="M18 21a6 6 0 0 0-12 0" />
                  </Svg>
                </View>
                <Text style={styles.parentAccessText}>Parent / Teacher Access</Text>
                <Text style={styles.parentChevron}>❯</Text>
              </TouchableOpacity>

              {/* Change Child */}
              {child && (
                <TouchableOpacity 
                  style={styles.parentAccessBtn} 
                  activeOpacity={0.7}
                  onPress={() => {
                    setChild(null as any);
                    setUniqueCode('');
                    setShowCodeModal(true);
                  }}
                >
                  <View style={styles.parentUserContainer}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2.5">
                      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <Path d="M16 17l5-5-5-5" />
                      <Path d="M21 12H9" />
                    </Svg>
                  </View>
                  <Text style={[styles.parentAccessText, { color: '#D32F2F' }]}>Switch Child Code</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Code Input Modal */}
      <Modal
        visible={showCodeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Code</Text>
            <Text style={styles.modalSubtitle}>
              Please enter the 6-character code provided by your parent
            </Text>
            
            <TextInput
              style={styles.codeInput}
              placeholder="ABC123"
              value={uniqueCode}
              onChangeText={setUniqueCode}
              maxLength={6}
              autoCapitalize="characters"
              textAlign="center"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCodeModal(false);
                  setUniqueCode('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={validateCode}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Validating...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  logoImage: {
    width: '80%',    // un peu plus étroit pour garder les proportions
    height: 140,      // augmenté de 95 → 140
    marginTop: 5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37474F',
    marginTop: 8,
    fontFamily: 'System',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  characterWrapper: {
    zIndex: 2,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterImage: {
    width: 190,
    height: '100%',
    maxHeight: 205,
  },
  infoBadge: {
    backgroundColor: '#FFFDE7',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F0E6D2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 8,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#5C4033',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'System',
  },
  actionsBlock: {
    gap: 10,
    marginTop: 5,
  },
  startJourneyBtn: {
    backgroundColor: '#00B4D8',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#0077B6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  sparkleContainer: {
    width: 30,
    alignItems: 'center',
  },
  startJourneyText: {
    color: '#FFF',
    fontSize: 21,
    fontWeight: '900',
    fontFamily: 'System',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  arrowContainer: {
    width: 30,
    alignItems: 'center',
  },
  languagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  langButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#ECEFF1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  langButtonActive: {
    borderColor: '#FFD54F',
    backgroundColor: '#FFFDE7',
    shadowOpacity: 0.15,
  },
  langButtonText: {
    color: '#37474F',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#37474F',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#546E7A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  codeInput: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#00B4D8',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#37474F',
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ECEFF1',
  },
  cancelButtonText: {
    color: '#546E7A',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#00B4D8',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});