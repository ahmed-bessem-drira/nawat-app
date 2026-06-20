import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class ParentJwtAuthGuard extends AuthGuard('parent-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
