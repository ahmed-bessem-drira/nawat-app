import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateChildDto, ChildResponseDto } from './dto/children.dto';

@Injectable()
export class ChildrenService {
  constructor(private prisma: PrismaService) {}

  async create(createChildDto: CreateChildDto): Promise<ChildResponseDto> {
    const child = await this.prisma.child.create({
      data: createChildDto,
    });

    return {
      id: child.id,
      nickname: child.nickname,
      avatar: child.avatar,
      language: child.language,
      createdAt: child.createdAt,
    };
  }

  async findAllByUser(userId: string): Promise<ChildResponseDto[]> {
    const children = await this.prisma.child.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return children.map((child) => ({
      id: child.id,
      nickname: child.nickname,
      avatar: child.avatar,
      language: child.language,
      createdAt: child.createdAt,
    }));
  }

  async findOne(id: string): Promise<ChildResponseDto> {
    const child = await this.prisma.child.findUnique({
      where: { id },
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    return {
      id: child.id,
      nickname: child.nickname,
      avatar: child.avatar,
      language: child.language,
      createdAt: child.createdAt,
    };
  }
}
