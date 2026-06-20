import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Parent, ParentSchema } from './schemas/parent.schema';
import { Child, ChildSchema } from './schemas/child.schema';
import { GameData, GameDataSchema } from './schemas/game-data.schema';
import { MoodEntry, MoodEntrySchema } from './schemas/mood-entry.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/nawat-parents',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Parent.name, schema: ParentSchema },
      { name: Child.name, schema: ChildSchema },
      { name: GameData.name, schema: GameDataSchema },
      { name: MoodEntry.name, schema: MoodEntrySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongodbModule {}
