import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type MoodEntryDocument = MoodEntry & Document;

@Schema()
export class MoodEntry {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Child' })
  childId: Types.ObjectId;

  @Prop({ required: true })
  uniqueCode: string;

  @Prop({ required: true, enum: ['CALM', 'HAPPY', 'TIRED', 'ANGRY', 'SAD', 'EXCITED'] })
  mood: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: false })
  synced: boolean;
}

export const MoodEntrySchema = SchemaFactory.createForClass(MoodEntry);
