import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray } from 'class-validator';

export class AIRecommendationRequestDto {
  @ApiProperty()
  @IsString()
  mood: string;

  @ApiProperty()
  @IsNumber()
  omissions: number;

  @ApiProperty()
  @IsNumber()
  commissions: number;

  @ApiProperty()
  @IsNumber()
  reactionTime: number;

  @ApiProperty()
  @IsNumber()
  calmScore: number;

  @ApiProperty({ type: [Object] })
  @IsArray()
  sessionHistory: any[];
}

export class AIRecommendationResponseDto {
  @ApiProperty()
  encouragement: string;

  @ApiProperty()
  teacherRecommendation: string;

  @ApiProperty()
  suggestedActivity: string;

  @ApiProperty()
  difficultyAdjustment: {
    reduceDistractors: boolean;
    slowGameplay: boolean;
    suggestCloudValley: boolean;
  };
}
