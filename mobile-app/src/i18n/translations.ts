import { Language } from '../../../shared/types';

export const translations = {
  [Language.ENGLISH]: {
    onboarding: {
      chooseLanguage: 'Choose Your Language',
      chooseAvatar: 'Choose Your Avatar',
      enterName: 'What is Your Name?',
      next: 'Next',
      startAdventure: 'Start Adventure!',
      yourName: 'Your Name:',
    },
    mood: {
      title: 'How do you feel today?',
      subtitle: 'Select how you are feeling right now',
    },
    villages: {
      title: 'Choose Your Adventure',
      subtitle: 'Help Nawat travel through the villages!',
      focusGarden: 'Focus Garden',
    },
    noiseSouk: {
      title: 'Noise Souk',
      description: 'Attention Training',
      instruction: 'Tap the GREEN circles!',
      ignore: 'Ignore the ORANGE circles!',
      gameOver: 'Game Over!',
      score: 'Score',
      correctHits: 'Correct Hits',
      omissions: 'Omissions',
      commissions: 'Commissions',
      playAgain: 'Play Again',
      backToMap: 'Back to Map',
    },
    gateOfPatience: {
      title: 'Gate of Patience',
      description: 'Impulse Control',
      green: 'Green: Tap immediately',
      red: 'Red: Do NOT tap',
      yellow: 'Yellow: Wait, then tap',
      gameOver: 'Game Over!',
      correctInhibition: 'Correct Inhibition',
      impulsiveResponses: 'Impulsive Responses',
      playAgain: 'Play Again',
      backToMap: 'Back to Map',
    },
    cloudValley: {
      title: 'Cloud Valley',
      description: 'Calm & Relaxation',
      instruction: 'Trace the dashed path with your finger',
      startTracing: 'Start Tracing',
      cameraPermission: 'Camera Permission Required',
      cameraMessage: 'We need camera access for the tracing activity.',
      grantPermission: 'Grant Permission',
      greatJob: 'Great Job!',
      accuracy: 'Accuracy',
      smoothness: 'Smoothness',
      calmScore: 'Calm Score',
      time: 'Time',
      playAgain: 'Play Again',
      backToMap: 'Back to Map',
    },
    backpackOasis: {
      title: 'Backpack Oasis',
      description: 'Organization',
      organizeTasks: 'Organize Your Tasks',
      instruction: 'Arrange the tasks in the correct order:',
      yourOrder: 'Your Order:',
      availableTasks: 'Available Tasks:',
      tapTasks: 'Tap tasks below in order',
      startGame: 'Start Game',
      gameOver: 'Game Over!',
      correctSequence: 'Correct Sequence',
      attempts: 'Attempts',
      playAgain: 'Play Again',
      backToMap: 'Back to Map',
    },
    focusGarden: {
      title: 'Focus Garden',
      sync: 'Sync',
      level: 'Garden Level',
      keepGrowing: 'Keep growing your garden!',
      yourRewards: 'Your Rewards',
      waterDrops: 'Water Drops',
      flowers: 'Flowers',
      trees: 'Trees',
      recommendations: 'Recommendations',
      yourGarden: 'Your Garden',
      resetGarden: 'Reset Garden (Dev Only)',
    },
  },
  [Language.FRENCH]: {
    onboarding: {
      chooseLanguage: 'Choisis ta langue',
      chooseAvatar: 'Choisis ton avatar',
      enterName: 'Quel est ton nom?',
      next: 'Suivant',
      startAdventure: 'Commencer l\'aventure!',
      yourName: 'Ton nom:',
    },
    mood: {
      title: 'Comment te sens-tu aujourd\'hui?',
      subtitle: 'Sélectionne ce que tu ressens maintenant',
    },
    villages: {
      title: 'Choisis ton aventure',
      subtitle: 'Aide Nawat à traverser les villages!',
      focusGarden: 'Jardin de Concentration',
    },
    // Add more French translations...
  },
  [Language.ARABIC]: {
    onboarding: {
      chooseLanguage: 'اختر لغتك',
      chooseAvatar: 'اختر صورتك الرمزية',
      enterName: 'ما هو اسمك؟',
      next: 'التالي',
      startAdventure: 'ابدأ المغامرة!',
      yourName: 'اسمك:',
    },
    mood: {
      title: 'كيف تشعر اليوم؟',
      subtitle: 'اختر ما تشعر به الآن',
    },
    villages: {
      title: 'اختر مغامرتك',
      subtitle: 'ساعد نوات في عبور القرى!',
      focusGarden: 'حديقة التركيز',
    },
    // Add more Arabic translations...
  },
};

export const getTranslation = (language: Language, key: string): string => {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
};
