import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSessionDto, SessionResponseDto, CreateMetricsDto } from './dto/sessions.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(createSessionDto: CreateSessionDto): Promise<SessionResponseDto> {
    const session = await this.prisma.session.create({
      data: createSessionDto,
    });

    return {
      id: session.id,
      childId: session.childId,
      gameType: session.gameType,
      duration: session.duration,
      createdAt: session.createdAt,
    };
  }

  async createMetrics(createMetricsDto: CreateMetricsDto): Promise<void> {
    await this.prisma.gameMetrics.create({
      data: createMetricsDto,
    });
  }

  async findByChild(childId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.prisma.session.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      include: {
        metrics: true,
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      childId: session.childId,
      gameType: session.gameType,
      duration: session.duration,
      createdAt: session.createdAt,
      metrics: session.metrics,
    }));
  }
}
