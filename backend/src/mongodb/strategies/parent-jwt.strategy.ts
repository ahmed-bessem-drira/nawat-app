import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ParentService } from '../services/parent.service';

@Injectable()
export class ParentJwtStrategy extends PassportStrategy(Strategy, 'parent-jwt') {
  constructor(
    private configService: ConfigService,
    private parentService: ParentService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production',
    });
  }

  async validate(payload: any) {
    const parent = await this.parentService.findById(payload.userId);
    if (!parent) {
      return null;
    }
    return {
      userId: parent._id.toString(),
      email: parent.email,
      name: parent.name,
    };
  }
}
