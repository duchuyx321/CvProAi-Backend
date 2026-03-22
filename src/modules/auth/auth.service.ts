/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { UsersService } from '~/modules/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
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
    cookieOptions() {
        return {
            httpOnly: true,
            secure: this.configService.get<string>('NODE_ENV') === 'production',
            sameSite: 'lax' as const,
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        };
    }
    async login({ id, role }) {
        const accessToken = await this.generateAccessToken({ id, role });
        const refreshToken = await this.generateRefreshToken({ id, role });

        return {
            accessToken,
            refreshToken,
        };
    }
    async register(registerDto: RegisterDto) {
        return await this.usersService.create(registerDto);
    }
}
