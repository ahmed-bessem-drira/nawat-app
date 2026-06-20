import { Controller, Post, Get, Body, HttpException, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ParentJwtAuthGuard } from '../guards/parent-jwt-auth.guard';
import { ParentService } from '../services/parent.service';
import { JwtService } from '@nestjs/jwt';

@Controller('api/auth')
export class ParentAuthController {
  constructor(
    private readonly parentService: ParentService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    const parent = await this.parentService.findByEmail(loginDto.email);
    
    if (!parent) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await this.parentService.validatePassword(
      loginDto.password,
      parent.password,
    );

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const payload = { 
      email: parent.email, 
      sub: parent._id.toString(),
      userId: parent._id.toString(),
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        address: parent.address,
      },
    };
  }

  @UseGuards(ParentJwtAuthGuard)
  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
