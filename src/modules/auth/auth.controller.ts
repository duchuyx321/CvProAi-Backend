import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import express from 'express';
import { AuthService } from './auth.service';
import { AuthJwtService } from '~/modules/auth/service/auth-jwt.service';
import { RegisterDto } from './dto/register.dto';
import {
    GoogleAuthGuard,
    LocalAuthGuard,
    RefreshJwtAuthGuard,
} from '~/modules/auth/guards';
import { VerifyOTPDTO } from './dto/verify_otp.dto';
import { SendOtpDto } from './dto/send_otp.dto';
import { configHTML } from '~/config/cors.config';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly authJwtService: AuthJwtService,
    ) {}
    // [POST] -- /api/v1/auth/login
    @ApiOperation({ summary: 'đăng nhập' })
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

    // [POST] -- /api/v1/auth/register
    @ApiOperation({ summary: 'Đăng kí tài khoản' })
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return await this.authService.register(registerDto);
    }

    // [POST] -- /api/v1/auth/otp/verify
    @ApiOperation({ summary: 'check token' })
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

    // [POST] -- /api/v1/auth/otp/ressend
    @ApiOperation({ summary: 'Gửi lại mã token' })
    @Post('otp/resend')
    async resendOTP(@Body() sendOtp: SendOtpDto) {
        return await this.authService.resendMail(sendOtp);
    }

    // [POST] -- /api/v1/auth/refresh
    @ApiOperation({ summary: 'refresh access token' })
    @UseGuards(RefreshJwtAuthGuard)
    @Post('refresh')
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const { accessToken, refreshToken } = await this.authService.refesh(
            req['user'],
        );
        res.cookie(
            'refreshToken',
            refreshToken,
            this.authJwtService.cookieOptions(),
        );
        return { data: { meta: { accessToken } } };
    }
    @ApiOperation({ summary: 'đăng nhập bằng gmail' })
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleLogin() {}

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async GoogleCallback(@Req() req: Request, @Res() res: express.Response) {
        const { accessToken, refreshToken } = await this.authService.login(
            req['user'],
        );
        res.cookie(
            'refreshToken',
            refreshToken,
            this.authJwtService.cookieOptions(),
        );
        const html = configHTML(accessToken);
        return res.send(html);
    }
}
