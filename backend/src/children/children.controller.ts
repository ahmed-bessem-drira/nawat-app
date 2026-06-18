import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChildrenService } from './children.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateChildDto, ChildResponseDto } from './dto/children.dto';

@ApiTags('children')
@Controller('children')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChildrenController {
  constructor(private childrenService: ChildrenService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new child profile' })
  @ApiResponse({ status: 201, description: 'Child created successfully', type: ChildResponseDto })
  async create(@Body() createChildDto: CreateChildDto): Promise<ChildResponseDto> {
    return this.childrenService.create(createChildDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all children for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of children', type: [ChildResponseDto] })
  async findAll(@Body('userId') userId: string): Promise<ChildResponseDto[]> {
    return this.childrenService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a child by ID' })
  @ApiResponse({ status: 200, description: 'Child details', type: ChildResponseDto })
  async findOne(@Param('id') id: string): Promise<ChildResponseDto> {
    return this.childrenService.findOne(id);
  }
}
