import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SyncRequestDto {
  @ApiProperty({ type: [Object] })
  @IsArray()
  sessions: any[];

  @ApiProperty({ type: [Object] })
  @IsArray()
  metrics: any[];

  @ApiProperty({ type: [Object] })
  @IsArray()
  moods: any[];
}

export class SyncResponseDto {
  @ApiProperty()
  synced: number;

  @ApiProperty({ type: [Object] })
  recommendations: any[];
}
