class LocalAIService {
  generateRecommendation(
    mood: string,
    omissions: number,
    commissions: number,
    reactionTime: number,
    calmScore: number,
  ): { reduceDistractors: boolean; slowGameplay: boolean; suggestCloudValley: boolean } {
    const adjustment = {
      reduceDistractors: false,
      slowGameplay: false,
      suggestCloudValley: false,
    };

    // Rule-based local recommendations
    if (omissions > 5) {
      adjustment.reduceDistractors = true;
    }

    if (commissions > 5) {
      adjustment.slowGameplay = true;
    }

    if (calmScore < 50) {
      adjustment.suggestCloudValley = true;
    }

    return adjustment;
  }

  suggestNextActivity(
    mood: string,
    lastGameType: string,
    calmScore: number,
  ): string {
    // Suggest activities based on mood and previous performance
    if (calmScore < 50) {
      return 'CLOUD_VALLEY';
    }

    if (mood === 'ANGRY' || mood === 'SAD') {
      return 'CLOUD_VALLEY';
    }

    if (mood === 'EXCITED') {
      return 'GATE_OF_PATIENCE';
    }

    // Rotate through games
    const games = ['NOISE_SOUK', 'GATE_OF_PATIENCE', 'CLOUD_VALLEY', 'BACKPACK_OASIS'];
    const currentIndex = games.indexOf(lastGameType);
    const nextIndex = (currentIndex + 1) % games.length;
    return games[nextIndex];
  }

  getEncouragementMessage(mood: string, performance: 'good' | 'improving' | 'needs-practice'): string {
    const messages: Record<string, Record<string, string[]>> = {
      'CALM': {
        good: ['You are doing amazing!', 'Great focus today!', 'Wonderful work!'],
        improving: ['You are getting better!', 'Keep up the good work!', 'Nice progress!'],
        'needs-practice': ['Every expert was once a beginner!', 'Practice makes perfect!', 'You can do it!'],
      },
      'HAPPY': {
        good: ['Your happiness shows in your work!', 'Fantastic job!', 'You are shining!'],
        improving: ['Great energy today!', 'Keep that positive attitude!', 'Wonderful progress!'],
        'needs-practice': ['Stay positive and keep trying!', 'Your smile is your superpower!', 'You got this!'],
      },
      'TIRED': {
        good: ['Great job even when tired!', 'You are strong!', 'Amazing effort!'],
        improving: ['Taking breaks is okay!', 'You are doing your best!', 'Rest and try again!'],
        'needs-practice': ['Rest is important too!', 'Tomorrow is a new day!', 'Be kind to yourself!'],
      },
      'ANGRY': {
        good: ['You handled that well!', 'Great self-control!', 'Amazing patience!'],
        improving: ['Taking deep breaths helps!', 'You are learning to manage feelings!', 'Great progress!'],
        'needs-practice': ['It is okay to feel angry!', 'Take a moment to breathe!', 'You can handle this!'],
      },
      'SAD': {
        good: ['You are brave!', 'Great effort today!', 'You are strong!'],
        improving: ['Every small step counts!', 'You are making progress!', 'Keep going!'],
        'needs-practice': ['It is okay to have hard days!', 'Tomorrow will be better!', 'You are not alone!'],
      },
      'EXCITED': {
        good: ['Channel that excitement!', 'Fantastic energy!', 'Amazing focus!'],
        improving: ['Great enthusiasm!', 'Keep that energy focused!', 'Wonderful work!'],
        'needs-practice': ['Let is channel that excitement!', 'Focus that energy!', 'You can do it!'],
      },
    };

    const moodMessages = messages[mood][performance];
    return moodMessages[Math.floor(Math.random() * moodMessages.length)];
  }
}

export const localAIService = new LocalAIService();
