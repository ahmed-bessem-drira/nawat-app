import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateChildDto {
  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({ example: 'avatar_1' })
  @IsString()
  @IsNotEmpty()
  avatar: string;

  @ApiProperty({ example: 'ARABIC' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({ example: 'user-id' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class ChildResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  language: string;

  @ApiProperty()
  createdAt: Date;
}
