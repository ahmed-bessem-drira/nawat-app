import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SyncService } from '../services/sync.service';

@Controller('api/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}



  @Get('test/:id')
  async test(@Param('id') id: string) {
    try {
      const data = await this.syncService.getChildGameData(id);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Post('game-data')
  async syncGameData(@Body() syncDto: {
    uniqueCode: string;
    gameType: string;
    duration: number;
    metrics: any;
  }) {
    return this.syncService.syncGameData(syncDto.uniqueCode, {
      gameType: syncDto.gameType,
      duration: syncDto.duration,
      ...syncDto.metrics,
    });
  }

  @Post('mood-entry')
  async syncMoodEntry(@Body() syncDto: {
    uniqueCode: string;
    mood: string;
  }) {
    return this.syncService.syncMoodEntry(syncDto.uniqueCode, {
      mood: syncDto.mood,
    });
  }

  @Post('validate-code')
  async validateCode(@Body() validateDto: { uniqueCode: string }) {
    const child = await this.syncService['childModel'].findOne({ 
      uniqueCode: validateDto.uniqueCode 
    });
    
    if (!child) {
      return { valid: false, message: 'Invalid code' };
    }

    return { 
      valid: true, 
      childId: child._id,
      nickname: child.nickname,
      language: child.language 
    };
  }

  @Post('recommendations')
  async getRecommendations(@Body() dto: { uniqueCode: string }) {
    const child = await this.syncService['childModel'].findOne({ uniqueCode: dto.uniqueCode });
    if (!child) return [];
    return this.syncService.getChildRecommendations(child._id.toString());
  }
}
