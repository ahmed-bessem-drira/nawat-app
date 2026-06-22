import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Child, ChildDocument } from '../schemas/child.schema';
import { GameData, GameDataDocument } from '../schemas/game-data.schema';
import { MoodEntry, MoodEntryDocument } from '../schemas/mood-entry.schema';

@Injectable()
export class SyncService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(GameData.name) private gameDataModel: Model<GameDataDocument>,
    @InjectModel(MoodEntry.name) private moodEntryModel: Model<MoodEntryDocument>,
  ) { }

  async syncGameData(uniqueCode: string, gameData: any) {
    // Find child by unique code
    const child = await this.childModel.findOne({ uniqueCode });
    if (!child) {
      throw new Error('Child not found with this unique code');
    }

    // Create game data entry
    const newGameData = new this.gameDataModel({
      childId: child._id,
      uniqueCode: uniqueCode,
      ...gameData,
      synced: true,
    });

    const savedGameData = await newGameData.save();

    child.updatedAt = new Date();
    await child.save();

    return savedGameData;
  }

  async syncMoodEntry(uniqueCode: string, moodData: any) {
    // Find child by unique code
    const child = await this.childModel.findOne({ uniqueCode });
    if (!child) {
      throw new Error('Child not found with this unique code');
    }

    // Create mood entry
    const newMoodEntry = new this.moodEntryModel({
      childId: child._id,
      uniqueCode: uniqueCode,
      ...moodData,
      synced: true,
    });

    const savedMoodEntry = await newMoodEntry.save();

    child.updatedAt = new Date();
    await child.save();

    return savedMoodEntry;
  }

  async getChildGameData(childId: string) {
    const objectId = new Types.ObjectId(childId);

    const gameData = await this.gameDataModel
      .find({ childId: objectId })
      .sort({ createdAt: -1 })
      .limit(50);

    return gameData.map(data => ({
      id: data._id,
      childId: data.childId,
      gameType: data.gameType,
      duration: data.duration,
      accuracy: data.accuracy,
      reactionTime: data.reactionTime,
      omissions: data.omissions,
      commissions: data.commissions,
      reactionTimeVariability: data.reactionTimeVariability,
      smoothness: data.smoothness,
      completionTime: data.completionTime,
      pathDeviation: data.pathDeviation,
      calmScore: data.calmScore,
      impulsiveResponses: data.impulsiveResponses,
      correctInhibition: data.correctInhibition,
      correctSequence: data.correctSequence,
      createdAt: data.createdAt,
    }));
  }

  async getChildMoodEntries(childId: string) {
    const objectId = new Types.ObjectId(childId);
    const moodEntries = await this.moodEntryModel
      .find({ childId: objectId })
      .sort({ createdAt: -1 })
      .limit(50);

    return moodEntries.map(entry => ({
      id: entry._id,
      mood: entry.mood,
      createdAt: entry.createdAt,
    }));
  }

  async getChildRecommendations(childId: string) {
    const objectId = new Types.ObjectId(childId);
    const gameData = await this.gameDataModel.find({ childId: objectId }).sort({ createdAt: -1 }).limit(20);
    const moodEntries = await this.moodEntryModel.find({ childId: objectId }).sort({ createdAt: -1 }).limit(10);

    const totalSessions = gameData.length;
    const avgAccuracy = totalSessions > 0
      ? Math.round(gameData.reduce((sum, d) => sum + (d.accuracy || 0), 0) / totalSessions)
      : 0;

    const recommendations = [];

    if (avgAccuracy < 50 && totalSessions > 2) {
      recommendations.push({
        id: 'rec_low_accuracy',
        content: 'Your child may benefit from more focus-based activities. Try shorter sessions with fewer distractions.',
        encouragement: 'Keep practicing! Every session helps improve focus.',
        suggestedActivity: 'noise_souk',
      });
    }

    if (moodEntries.length > 0) {
      const sadCount = moodEntries.filter(m => m.mood === 'SAD' || m.mood === 'ANGRY').length;
      if (sadCount > moodEntries.length / 2) {
        recommendations.push({
          id: 'rec_mood',
          content: 'Your child has been reporting negative moods. Consider incorporating calming activities.',
          encouragement: 'A calm mind learns better! Try some relaxation exercises.',
          suggestedActivity: 'cloud_valley',
        });
      }
    }

    if (totalSessions === 0) {
      recommendations.push({
        id: 'rec_welcome',
        content: 'Welcome! Start with any game to begin tracking your child\'s progress.',
        encouragement: 'Every great journey begins with a single step!',
        suggestedActivity: null,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: 'rec_keep_going',
        content: 'Great progress! Keep up the consistent practice across different games.',
        encouragement: 'You\'re doing an amazing job supporting your child!',
        suggestedActivity: null,
      });
    }

    return recommendations;
  }

  async getChildAnalytics(childId: string) {
    const objectId = new Types.ObjectId(childId);

    const child = await this.childModel.findById(objectId).lean();
    const legacyGameDataIds = child?.['gameData'] || [];

    const gameData = await this.gameDataModel.find({
      $or: [
        { childId: objectId },
        { _id: { $in: legacyGameDataIds } }
      ]
    });

    if (gameData.length === 0) {
      return {
        avgAccuracy: 0,
        avgReactionTime: 0,
        totalSessions: 0,
        improvement: 0,
        recommendations: [],
      };
    }

    const totalAccuracy = gameData.reduce((sum, data) => sum + (data.accuracy || 0), 0);
    const totalReactionTime = gameData.reduce((sum, data) => sum + (data.reactionTime || 0), 0);

    return {
      avgAccuracy: Math.round(totalAccuracy / gameData.length),
      avgReactionTime: Math.round(totalReactionTime / gameData.length),
      totalSessions: gameData.length,
      improvement: 0, // Calculate based on older vs newer sessions
      recommendations: [],
    };
  }
}
