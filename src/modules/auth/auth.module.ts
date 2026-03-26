import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { StringValue } from 'ms';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { UsersModule } from '~/modules/users/users.module';
import { AuthTokenModule } from '~/modules/auth-token/auth-token.module';
import { LocalAuthGuard } from '~/modules/auth/guards';
import { LocalStrategy } from '~/modules/auth/strategies';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailerConfig } from '~/config/mailer.config';
import { AuthJwtService } from './service/auth-jwt.service';
import { AuthMailService } from './service/auth-mail.service';

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
    ],
    imports: [
        UsersModule,
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
    exports: [JwtAuthGuard],
})
export class AuthModule {}
