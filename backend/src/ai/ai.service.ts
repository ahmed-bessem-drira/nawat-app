import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AIRecommendationRequestDto, AIRecommendationResponseDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ollamaUrl: string;
  private readonly ollamaModel: string;

  constructor(private configService: ConfigService) {
    this.ollamaUrl = this.configService.get<string>('OLLAMA_URL') || 'http://localhost:11434';
    this.ollamaModel = this.configService.get<string>('OLLAMA_MODEL') || 'qwen2.5:1.5b';
  }

  async generateRecommendation(
    requestDto: AIRecommendationRequestDto,
  ): Promise<AIRecommendationResponseDto> {
    const prompt = this.buildPrompt(requestDto);

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.ollamaModel,
        prompt,
        stream: false,
        format: 'json',
      });

      const result = JSON.parse(response.data.response);

      return {
        encouragement: result.encouragement || 'You are doing great! Keep trying!',
        teacherRecommendation: result.teacherRecommendation || 'Continue monitoring progress.',
        suggestedActivity: this.mapToGameType(result.suggestedActivity),
        difficultyAdjustment: {
          reduceDistractors: result.reduceDistractors || false,
          slowGameplay: result.slowGameplay || false,
          suggestCloudValley: result.suggestCloudValley || false,
        },
      };
    } catch (error) {
      this.logger.error('Error calling Ollama:', error.message);
      // Fallback to rule-based recommendation
      return this.getFallbackRecommendation(requestDto);
    }
  }

  private buildPrompt(requestDto: AIRecommendationRequestDto): string {
    return `You are an ADHD support assistant for children. Do NOT diagnose ADHD.

Given the following data:
- Mood: ${requestDto.mood}
- Omissions: ${requestDto.omissions}
- Commissions: ${requestDto.commissions}
- Reaction Time: ${requestDto.reactionTime}ms
- Calm Score: ${requestDto.calmScore}

Generate a JSON response with:
1. encouragement: A child-friendly, encouraging message (simple language)
2. teacherRecommendation: A brief recommendation for the teacher
3. suggestedActivity: One of: "noise_souk", "gate_of_patience", "cloud_valley", "backpack_oasis"
4. reduceDistractors: boolean (true if omissions > 5)
5. slowGameplay: boolean (true if commissions > 5)
6. suggestCloudValley: boolean (true if calmScore < 50)

Return ONLY valid JSON, no other text.`;
  }

  private mapToGameType(activity: string): string {
    const mapping: Record<string, string> = {
      noise_souk: 'NOISE_SOUK',
      gate_of_patience: 'GATE_OF_PATIENCE',
      cloud_valley: 'CLOUD_VALLEY',
      backpack_oasis: 'BACKPACK_OASIS',
    };
    return mapping[activity] || 'NOISE_SOUK';
  }

  private getFallbackRecommendation(
    requestDto: AIRecommendationRequestDto,
  ): AIRecommendationResponseDto {
    const reduceDistractors = requestDto.omissions > 5;
    const slowGameplay = requestDto.commissions > 5;
    const suggestCloudValley = requestDto.calmScore < 50;

    let suggestedActivity = 'NOISE_SOUK';
    if (suggestCloudValley) {
      suggestedActivity = 'CLOUD_VALLEY';
    } else if (slowGameplay) {
      suggestedActivity = 'GATE_OF_PATIENCE';
    }

    return {
      encouragement: 'You are doing great! Keep trying your best!',
      teacherRecommendation: 'Continue monitoring progress and adjust difficulty as needed.',
      suggestedActivity,
      difficultyAdjustment: {
        reduceDistractors,
        slowGameplay,
        suggestCloudValley,
      },
    };
  }
}
