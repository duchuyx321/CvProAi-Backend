import { Controller } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';

@Controller('auth-token')
export class AuthTokenController {
  constructor(private readonly authTokenService: AuthTokenService) {}
}
