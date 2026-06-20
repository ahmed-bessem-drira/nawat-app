import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ParentDocument = Parent & Document;

@Schema()
export class Parent {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: [Types.ObjectId], ref: 'Child' })
  children: Types.ObjectId[];
}

export const ParentSchema = SchemaFactory.createForClass(Parent);
