import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from '~/modules/auth/guards';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(
        @Req() req: Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const { accessToken, refreshToken } = await this.authService.login(
            req['user'],
        );
        res.cookie(
            'refreshToken',
            refreshToken,
            this.authService.cookieOptions(),
        );
        return {
            message: 'Đăng nhập thành công',
            data: { meta: { accessToken } },
        };
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return await this.authService.register(registerDto);
    }
}
