import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type GameDataDocument = GameData & Document;

@Schema()
export class GameData {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Child' })
  childId: Types.ObjectId;

  @Prop({ required: true })
  uniqueCode: string;

  @Prop({ required: true, enum: ['NOISE_SOUK', 'GATE_OF_PATIENCE', 'CLOUD_VALLEY', 'BACKPACK_OASIS'] })
  gameType: string;

  @Prop({ required: true })
  duration: number;

  @Prop()
  omissions?: number;

  @Prop()
  commissions?: number;

  @Prop()
  reactionTime?: number;

  @Prop()
  reactionTimeVariability?: number;

  @Prop()
  accuracy?: number;

  @Prop()
  smoothness?: number;

  @Prop()
  completionTime?: number;

  @Prop()
  pathDeviation?: number;

  @Prop()
  calmScore?: number;

  @Prop()
  impulsiveResponses?: number;

  @Prop()
  correctInhibition?: number;

  @Prop()
  correctSequence?: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: false })
  synced: boolean;
}

export const GameDataSchema = SchemaFactory.createForClass(GameData);
