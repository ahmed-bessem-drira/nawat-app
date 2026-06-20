import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Parent, ParentDocument } from '../schemas/parent.schema';
import { Child, ChildDocument } from '../schemas/child.schema';
import { GameData, GameDataDocument } from '../schemas/game-data.schema';
import { MoodEntry, MoodEntryDocument } from '../schemas/mood-entry.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ParentService {
  constructor(
    @InjectModel(Parent.name) private parentModel: Model<ParentDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(GameData.name) private gameDataModel: Model<GameDataDocument>,
    @InjectModel(MoodEntry.name) private moodEntryModel: Model<MoodEntryDocument>,
  ) { }

  async register(parentData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
  }) {
    const existingParent = await this.parentModel.findOne({ email: parentData.email });
    if (existingParent) {
      throw new ConflictException('Parent with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(parentData.password, 10);

    const parent = new this.parentModel({
      name: parentData.name,
      email: parentData.email,
      password: hashedPassword,
      phone: parentData.phone,
      address: parentData.address,
    });

    const savedParent = await parent.save();

    return {
      id: savedParent._id,
      name: savedParent.name,
      email: savedParent.email,
      phone: savedParent.phone,
      address: savedParent.address,
    };
  }

  async findByEmail(email: string): Promise<ParentDocument | null> {
    return this.parentModel.findOne({ email }).populate('children');
  }

  async findById(id: string): Promise<ParentDocument | null> {
    return this.parentModel.findById(id).populate('children');
  }

  async getChildren(parentId: string) {
    const children = await this.childModel.find({ parentId }).sort({ createdAt: -1 });

    return Promise.all(children.map(async child => {
      const legacyGameDataIds = child?.['gameData'] || [];
      const gameDataQuery = {
        $or: [
          { childId: child._id },
          { _id: { $in: legacyGameDataIds } }
        ]
      };

      const sessionsCount = await this.gameDataModel.countDocuments(gameDataQuery);
      const moodsCount = await this.moodEntryModel.countDocuments({ childId: child._id });
      const gameData = await this.gameDataModel.find(gameDataQuery).sort({ createdAt: -1 }).limit(50);
      const avgAccuracy = gameData.length > 0
        ? Math.round(gameData.reduce((sum, d) => sum + (d.accuracy || 0), 0) / gameData.length)
        : 0;

      return {
        id: child._id,
        name: child.name,
        nickname: child.nickname,
        language: child.language,
        uniqueCode: child.uniqueCode,
        sessionsCount,
        moodsCount,
        avgAccuracy,
        createdAt: child.createdAt,
      };
    }));
  }

  async addChild(parentId: string, childData: { name: string; nickname: string; language: string }) {
    const uniqueCode = this.generateUniqueCode();

    const child = new this.childModel({
      name: childData.name,
      nickname: childData.nickname,
      language: childData.language,
      uniqueCode,
      parentId,
    });

    const savedChild = await child.save();

    const parent = await this.parentModel.findById(parentId);
    if (parent) {
      parent.children.push(savedChild._id);
      await parent.save();
    }

    return {
      id: savedChild._id,
      name: savedChild.name,
      nickname: savedChild.nickname,
      language: savedChild.language,
      uniqueCode: savedChild.uniqueCode,
      createdAt: savedChild.createdAt,
    };
  }

  async generateChildCode(childId: string) {
    const child = await this.childModel.findById(childId);
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    // Return existing code if already set, otherwise generate once
    if (!child.uniqueCode) {
      child.uniqueCode = this.generateUniqueCode();
      child.updatedAt = new Date();
      await child.save();
    }

    return { code: child.uniqueCode };
  }

  async getChildByUniqueCode(uniqueCode: string) {
    return this.childModel.findOne({ uniqueCode }).populate('parentId');
  }

  private generateUniqueCode(): string {
    // Generate a 6-character alphanumeric code
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
