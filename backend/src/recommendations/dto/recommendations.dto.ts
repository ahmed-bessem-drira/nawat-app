import { ApiProperty } from '@nestjs/swagger';

export class RecommendationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  childId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  encouragement: string;

  @ApiProperty({ required: false })
  suggestedActivity?: string;

  @ApiProperty()
  createdAt: Date;
}
