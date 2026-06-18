import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useChildStore } from '@/stores/childStore';
import { databaseService } from '@/services/database.service';

const AVATARS = ['avatar_1', 'avatar_2', 'avatar_3', 'avatar_4', 'avatar_5', 'avatar_6'];

const LANGUAGES = [
  { code: 'ARABIC', name: 'العربية', flag: '🇸🇦' },
  { code: 'FRENCH', name: 'Français', flag: '🇫🇷' },
  { code: 'ENGLISH', name: 'English', flag: '🇬🇧' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedLanguage?: string; selectedAvatar?: string }>();
  const { setChild } = useChildStore();
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    params.selectedLanguage || 'ENGLISH'
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    params.selectedAvatar || AVATARS[0]
  );
  const [step, setStep] = useState(
    params.selectedAvatar ? 3 : params.selectedLanguage ? 2 : 1
  );
  const [nickname, setNickname] = useState('');

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      // Complete onboarding
      const childId = Date.now().toString();
      const child = {
        id: childId,
        nickname,
        avatar: selectedAvatar,
        language: selectedLanguage,
        createdAt: new Date().toISOString(),
      };

      setChild(child);

      // Save to local database
      await databaseService.insert('child', {
        id: childId,
        nickname,
        avatar: selectedAvatar,
        language: selectedLanguage,
        created_at: Date.now(),
      });

      // Initialize rewards
      await databaseService.insert('reward', {
        id: Date.now().toString(),
        child_id: childId,
        water_drops: 0,
        flowers: 0,
        trees: 0,
        updated_at: Date.now(),
      });

      router.replace('/mood-check-in');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <Text style={styles.title}>
        {step === 1 ? 'Choose Your Language' : step === 2 ? 'Choose Your Avatar' : 'What is Your Name?'}
      </Text>

      {step === 1 && (
        <View style={styles.optionsContainer}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.option,
                selectedLanguage === lang.code && styles.selectedOption,
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={styles.optionText}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === 2 && (
        <View style={styles.avatarsContainer}>
          {AVATARS.map((avatar) => (
            <TouchableOpacity
              key={avatar}
              style={[
                styles.avatar,
                selectedAvatar === avatar && styles.selectedAvatar,
              ]}
              onPress={() => setSelectedAvatar(avatar)}
            >
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === 3 && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Name:</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Type your name..."
            placeholderTextColor="#A5D6A7"
            autoFocus
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.nextButton, (step === 3 && !nickname) && styles.disabledButton]}
        onPress={handleNext}
        disabled={step === 3 && !nickname}
      >
        <Text style={styles.nextButtonText}>{step === 3 ? 'Start Adventure!' : 'Next'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#C8E6C9',
    borderRadius: 2,
    marginBottom: 40,
  },
  progress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#C8E6C9',
  },
  selectedOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#C8E6C9',
  },
  flag: {
    fontSize: 32,
    marginRight: 15,
  },
  optionText: {
    fontSize: 20,
    color: '#2E7D32',
    fontWeight: '600',
  },
  avatarsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedAvatar: {
    borderColor: '#4CAF50',
    backgroundColor: '#C8E6C9',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#A5D6A7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 30,
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    color: '#2E7D32',
    marginBottom: 10,
  },
  input: {
    fontSize: 24,
    color: '#2E7D32',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: '100%',
    textAlign: 'center',
  },
  nextButton: {
    marginTop: 40,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 60,
    paddingVertical: 15,
    borderRadius: 30,
  },
  disabledButton: {
    backgroundColor: '#C8E6C9',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
