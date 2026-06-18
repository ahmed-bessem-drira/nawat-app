import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty()
  @IsString()
  childId: string;

  @ApiProperty()
  @IsString()
  gameType: string;

  @ApiProperty()
  @IsNumber()
  duration: number;
}

export class CreateMetricsDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsString()
  childId: string;

  @ApiProperty()
  @IsString()
  gameType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  omissions?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  commissions?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  reactionTime?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  reactionTimeVariability?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  accuracy?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  smoothness?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  completionTime?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  pathDeviation?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  calmScore?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  impulsiveResponses?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  correctInhibition?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  correctSequence?: number;
}

export class SessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  childId: string;

  @ApiProperty()
  gameType: string;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  metrics?: any[];
}
