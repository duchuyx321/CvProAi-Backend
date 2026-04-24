import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { StringValue } from 'ms';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { MailerConfig } from '~/config/mailer.config';
import { UsersModule } from '~/modules/users/users.module';
import { AuthTokenModule } from '~/modules/auth-token/auth-token.module';
import {
    LocalAuthGuard,
    RefreshJwtAuthGuard,
    JwtAuthGuard,
    RolesGuard,
    GoogleAuthGuard,
} from '~/modules/auth/guards';
import {
    RefreshJwtStrategy,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
} from '~/modules/auth/strategies';

import { AuthJwtService, AuthMailService } from '~/modules/auth/service';

@Module({
    controllers: [AuthController],
    providers: [
        AuthService,
        AuthJwtService,
        AuthMailService,
        LocalStrategy,
        LocalAuthGuard,
        JwtAuthGuard,
        JwtStrategy,
        GoogleAuthGuard,
        GoogleStrategy,
        RolesGuard,
        RefreshJwtAuthGuard,
        RefreshJwtStrategy,
    ],
    imports: [
        forwardRef(() => UsersModule),
        AuthTokenModule,
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
        MailerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) =>
                MailerConfig(configService),
        }),
    ],
    exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
