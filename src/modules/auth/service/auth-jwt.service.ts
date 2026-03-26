import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import ms, { StringValue } from 'ms';

@Injectable()
export class AuthJwtService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}
    async generateAccessToken(payload: { id: string; role: string }) {
        return await this.jwtService.signAsync(payload);
    }
    async generateRefreshToken(payload: { id: string; role: string }) {
        return await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
            expiresIn: this.configService.get<StringValue>(
                'JWT_REFRESH_TOKEN_EXPIRATION',
            ),
        });
    }
    getEnvDurationMs(key: string): number {
        const value = this.configService.get<StringValue>(key);

        if (!value) {
            throw new InternalServerErrorException(`Missing env: ${key}`);
        }

        return ms(value);
    }

    getExpiresAt(key: string): Date {
        return new Date(Date.now() + this.getEnvDurationMs(key));
    }

    cookieOptions() {
        const maxAge = this.getEnvDurationMs('JWT_REFRESH_TOKEN_EXPIRATION');

        return {
            httpOnly: true,
            secure: this.configService.get<string>('NODE_ENV') === 'production',
            sameSite: 'lax' as const,
            path: '/auth/refresh',
            maxAge,
        };
    }
}
