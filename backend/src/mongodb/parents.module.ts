import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ParentController } from './controllers/parent.controller';
import { SyncController } from './controllers/sync.controller';
import { ParentAuthController } from './controllers/auth.controller';
import { ParentService } from './services/parent.service';
import { SyncService } from './services/sync.service';
import { ParentJwtStrategy } from './strategies/parent-jwt.strategy';
import { Parent, ParentSchema } from './schemas/parent.schema';
import { Child, ChildSchema } from './schemas/child.schema';
import { GameData, GameDataSchema } from './schemas/game-data.schema';
import { MoodEntry, MoodEntrySchema } from './schemas/mood-entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Parent.name, schema: ParentSchema },
      { name: Child.name, schema: ChildSchema },
      { name: GameData.name, schema: GameDataSchema },
      { name: MoodEntry.name, schema: MoodEntrySchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '7d' },
    }),
    PassportModule,
  ],
  controllers: [ParentController, SyncController, ParentAuthController],
  providers: [ParentService, SyncService, ParentJwtStrategy],
  exports: [ParentService, SyncService],
})
export class ParentsModule {}
