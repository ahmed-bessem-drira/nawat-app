import { Controller, Post, Get, Body, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ParentService } from '../services/parent.service';
import { JwtService } from '@nestjs/jwt';
import { SyncService } from '../services/sync.service';
import { ParentJwtAuthGuard } from '../guards/parent-jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameData, GameDataDocument } from '../schemas/game-data.schema';
import { Child, ChildDocument } from '../schemas/child.schema';

@Controller('api/parents')
export class ParentController {
  constructor(
    private readonly parentService: ParentService,
    private readonly syncService: SyncService,
    private readonly jwtService: JwtService,
    @InjectModel(GameData.name) private gameDataModel: Model<GameDataDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
  ) { }

  @Post('register')
  async register(@Body() registerDto: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
  }) {
    const parent = await this.parentService.register(registerDto);

    const payload = {
      email: parent.email,
      sub: parent.id,
      userId: parent.id,
    };

    const token = this.jwtService.sign(payload);

    return {
      token: token,
      user: parent,
    };
  }

  @UseGuards(ParentJwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req) {
    const parent = await this.parentService.findById(req.user.userId);
    if (!parent) {
      return null;
    }
    return {
      id: parent._id,
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
      address: parent.address,
    };
  }

  @UseGuards(ParentJwtAuthGuard)
  @Get('children')
  async getChildren(@Request() req) {
    const parent = await this.parentService.findById(req.user.userId);
    if (!parent) {
      return [];
    }
    return this.parentService.getChildren(parent._id.toString());
  }

  @UseGuards(ParentJwtAuthGuard)
  @Post('children')
  async addChild(@Request() req, @Body() childDto: {
    name: string;
    nickname: string;
    language: string;
  }) {
    const parent = await this.parentService.findById(req.user.userId);
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }
    return this.parentService.addChild(parent._id.toString(), childDto);
  }

  @UseGuards(ParentJwtAuthGuard)
  @Post('children/:id/generate-code')
  async generateChildCode(@Param('id') id: string) {
    return this.parentService.generateChildCode(id);
  }

  @UseGuards(ParentJwtAuthGuard)
  @Get('children/:id/sessions')
  async getChildSessions(@Param('id') id: string) {
    try {
      const data = await this.syncService.getChildGameData(id);
      return data;
    } catch (e: any) {
      throw e;
    }
  }

  @UseGuards(ParentJwtAuthGuard)
  @Get('children/:id/moods')
  async getChildMoods(@Param('id') id: string) {
    try {
      const data = await this.syncService.getChildMoodEntries(id);
      return data;
    } catch (e: any) {
      throw e;
    }
  }

  @UseGuards(ParentJwtAuthGuard)
  @Get('children/:id/analytics')
  async getChildAnalytics(@Param('id') id: string) {
    return this.syncService.getChildAnalytics(id);
  }

  @UseGuards(ParentJwtAuthGuard)
  @Get('children/:id/recommendations')
  async getChildRecommendations(@Param('id') id: string) {
    return this.syncService.getChildRecommendations(id);
  }

  @Get('debug/all-game-data')
  async debugAllGameData() {
    const gameData = await this.gameDataModel.find({}).limit(5).lean();
    const children = await this.childModel.find({}).limit(5).select('name nickname uniqueCode _id').lean();
    return { gameDataCount: gameData.length, gameData, children, childrenCount: children.length };
  }

  @Get('debug/cleanup')
  async debugCleanup() {
    const children = await this.childModel.find({}).select('_id').lean();
    const childIds = children.map(c => c._id);
    const orphaned = await this.gameDataModel.countDocuments({ childId: { $nin: childIds } });
    if (orphaned > 0) {
      await this.gameDataModel.deleteMany({ childId: { $nin: childIds } });
    }
    const remaining = await this.gameDataModel.countDocuments();
    return { deleted: orphaned, remaining };
  }
}
