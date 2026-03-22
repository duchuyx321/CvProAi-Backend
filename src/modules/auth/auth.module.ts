import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { UsersModule } from '~/modules/users/users.module';
import { LocalAuthGuard } from '~/modules/auth/guards';
import { LocalStrategy } from '~/modules/auth/strategies';

@Module({
    controllers: [AuthController],
    providers: [AuthService, LocalStrategy, LocalAuthGuard],
    imports: [
        UsersModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
                signOptions: {
                    expiresIn: configService.get<StringValue>(
                        'JWT_ACCESS_TOKEN_EXPIRATION',
                    ),
                },
            }),
        }),
    ],
})
export class AuthModule {}
