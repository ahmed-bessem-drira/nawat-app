import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { SyncRequestDto, SyncResponseDto } from './dto/sync.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SyncService {
  constructor(
    @InjectQueue('sync') private syncQueue: Queue,
    private prisma: PrismaService,
    private recommendationsService: RecommendationsService,
    private aiService: AiService,
  ) {}

  async syncSessions(syncDto: SyncRequestDto): Promise<SyncResponseDto> {
    let syncedCount = 0;
    const recommendations: any[] = [];

    // Sync sessions
    for (const session of syncDto.sessions) {
      try {
        await this.prisma.session.create({
          data: {
            id: session.id,
            childId: session.childId,
            gameType: session.gameType as any,
            duration: session.duration,
            createdAt: new Date(session.createdAt),
          },
        });
        syncedCount++;
      } catch (error) {
        // Session might already exist, skip
      }
    }

    // Sync metrics
    for (const metric of syncDto.metrics) {
      try {
        await this.prisma.gameMetrics.create({
          data: {
            id: metric.id,
            sessionId: metric.sessionId,
            childId: metric.childId,
            gameType: metric.gameType as any,
            omissions: metric.omissions,
            commissions: metric.commissions,
            reactionTime: metric.reactionTime,
            reactionTimeVariability: metric.reactionTimeVariability,
            accuracy: metric.accuracy,
            smoothness: metric.smoothness,
            completionTime: metric.completionTime,
            pathDeviation: metric.pathDeviation,
            calmScore: metric.calmScore,
            impulsiveResponses: metric.impulsiveResponses,
            correctInhibition: metric.correctInhibition,
            correctSequence: metric.correctSequence,
            createdAt: new Date(metric.createdAt),
          },
        });
        syncedCount++;
      } catch (error) {
        // Metric might already exist, skip
      }
    }

    // Sync moods
    for (const mood of syncDto.moods) {
      try {
        await this.prisma.moodEntry.create({
          data: {
            id: mood.id,
            childId: mood.childId,
            mood: mood.mood as any,
            createdAt: new Date(mood.createdAt),
          },
        });
        syncedCount++;
      } catch (error) {
        // Mood might already exist, skip
      }
    }

    // Generate AI recommendations for each child
    const childIds = [...new Set(syncDto.sessions.map((s) => s.childId))];
    for (const childId of childIds) {
      const recentMetrics = await this.prisma.gameMetrics.findMany({
        where: { childId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (recentMetrics.length > 0) {
        const latestMetric = recentMetrics[0];
        const aiRequest = {
          mood: syncDto.moods.find((m) => m.childId === childId)?.mood || 'CALM',
          omissions: latestMetric.omissions || 0,
          commissions: latestMetric.commissions || 0,
          reactionTime: latestMetric.reactionTime || 0,
          calmScore: latestMetric.calmScore || 50,
          sessionHistory: recentMetrics,
        };

        const aiResponse = await this.aiService.generateRecommendation(aiRequest);

        const recommendation = await this.recommendationsService.create({
          childId,
          content: aiResponse.teacherRecommendation,
          encouragement: aiResponse.encouragement,
          suggestedActivity: aiResponse.suggestedActivity,
        });

        recommendations.push(recommendation);
      }
    }

    return {
      synced: syncedCount,
      recommendations,
    };
  }
}
