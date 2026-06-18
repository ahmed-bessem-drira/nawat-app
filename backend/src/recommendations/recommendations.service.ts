import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RecommendationResponseDto } from './dto/recommendations.dto';

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  async findByChild(childId: string): Promise<RecommendationResponseDto[]> {
    const recommendations = await this.prisma.recommendation.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return recommendations.map((rec) => ({
      id: rec.id,
      childId: rec.childId,
      content: rec.content,
      encouragement: rec.encouragement,
      suggestedActivity: rec.suggestedActivity,
      createdAt: rec.createdAt,
    }));
  }

  async create(data: {
    childId: string;
    content: string;
    encouragement: string;
    suggestedActivity?: string;
  }): Promise<RecommendationResponseDto> {
    const recommendation = await this.prisma.recommendation.create({
      data,
    });

    return {
      id: recommendation.id,
      childId: recommendation.childId,
      content: recommendation.content,
      encouragement: recommendation.encouragement,
      suggestedActivity: recommendation.suggestedActivity,
      createdAt: recommendation.createdAt,
    };
  }
}
