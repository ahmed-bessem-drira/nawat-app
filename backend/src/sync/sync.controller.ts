import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncRequestDto, SyncResponseDto } from './dto/sync.dto';

@ApiTags('sync')
@Controller('sync')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Sync offline sessions to server' })
  @ApiResponse({ status: 200, description: 'Sync successful', type: SyncResponseDto })
  async syncSessions(@Body() syncDto: SyncRequestDto): Promise<SyncResponseDto> {
    return this.syncService.syncSessions(syncDto);
  }
}
