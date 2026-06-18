import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecommendationResponseDto } from './dto/recommendations.dto';

@ApiTags('recommendations')
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Get('child/:childId')
  @ApiOperation({ summary: 'Get recommendations for a child' })
  @ApiResponse({ status: 200, description: 'List of recommendations', type: [RecommendationResponseDto] })
  async findByChild(@Param('childId') childId: string): Promise<RecommendationResponseDto[]> {
    return this.recommendationsService.findByChild(childId);
  }
}
