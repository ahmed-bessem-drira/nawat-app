import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSessionDto, SessionResponseDto, CreateMetricsDto } from './dto/sessions.dto';

@ApiTags('sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new game session' })
  @ApiResponse({ status: 201, description: 'Session created successfully', type: SessionResponseDto })
  async create(@Body() createSessionDto: CreateSessionDto): Promise<SessionResponseDto> {
    return this.sessionsService.create(createSessionDto);
  }

  @Post('metrics')
  @ApiOperation({ summary: 'Save game metrics for a session' })
  @ApiResponse({ status: 201, description: 'Metrics saved successfully' })
  async createMetrics(@Body() createMetricsDto: CreateMetricsDto): Promise<void> {
    return this.sessionsService.createMetrics(createMetricsDto);
  }

  @Get('child/:childId')
  @ApiOperation({ summary: 'Get all sessions for a child' })
  @ApiResponse({ status: 200, description: 'List of sessions', type: [SessionResponseDto] })
  async findByChild(@Param('childId') childId: string): Promise<SessionResponseDto[]> {
    return this.sessionsService.findByChild(childId);
  }
}
