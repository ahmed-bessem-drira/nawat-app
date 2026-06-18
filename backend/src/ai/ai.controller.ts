import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIRecommendationRequestDto, AIRecommendationResponseDto } from './dto/ai.dto';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('recommendation')
  @ApiOperation({ summary: 'Generate AI recommendation using Ollama' })
  @ApiResponse({ status: 200, description: 'Recommendation generated', type: AIRecommendationResponseDto })
  async generateRecommendation(
    @Body() requestDto: AIRecommendationRequestDto,
  ): Promise<AIRecommendationResponseDto> {
    return this.aiService.generateRecommendation(requestDto);
  }
}
