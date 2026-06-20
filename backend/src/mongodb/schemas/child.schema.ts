import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChildDocument = Child & Document;

@Schema()
export class Child {
  @Prop({ required: false })
  name: string;

  @Prop({ required: false })
  nickname: string;

  @Prop({ required: false, enum: ['ENGLISH', 'FRENCH', 'ARABIC'], default: 'ENGLISH' })
  language: string;

  @Prop({ required: true, unique: true })
  uniqueCode: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Parent' })
  parentId: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

}

export const ChildSchema = SchemaFactory.createForClass(Child);
