import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { AuthJwtService } from '~/modules/auth/service/auth-jwt.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from '~/modules/auth/guards';
import { VerifyOTPDTO } from './dto/verify_otp.dto';
import { SendOtpDto } from './dto/send_otp.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly authJwtService: AuthJwtService,
    ) {}

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
            this.authJwtService.cookieOptions(),
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
    @Post('otp/verify')
    async verifyOTP(
        @Body() verifyOtp: VerifyOTPDTO,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const { accessToken, refreshToken } =
            await this.authService.verifyOTP(verifyOtp);
        res.cookie(
            'refreshToken',
            refreshToken,
            this.authJwtService.cookieOptions(),
        );
        return {
            message: 'xác thực token thành công.',
            data: { meta: { accessToken } },
        };
    }
    @Post('otp/resend')
    async resendOTP(@Body() sendOtp: SendOtpDto) {
        return await this.authService.resendMail(sendOtp);
    }
}
