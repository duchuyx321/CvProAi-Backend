/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '~/modules/users/users.service';
import { RegisterDto } from './dto/register.dto';

import { AuthTokenService } from '~/modules/auth-token/auth-token.service';
import { Helper } from '~/utils/helpers';
import { AuthJwtService } from '~/modules/auth/service/auth-jwt.service';
import {
    AuthMailService,
    typeTemplateMail,
} from '~/modules/auth/service/auth-mail.service';
import { AuthTokenType } from '~/modules/auth-token/dto/create-authToken.dto';
import { OtpPurpose, VerifyOTPDTO } from './dto/verify_otp.dto';
import { SendOtpDto } from './dto/send_otp.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly authTokenService: AuthTokenService,
        private readonly AuthJwtService: AuthJwtService,
        private readonly AuthMailService: AuthMailService,
    ) {}

    async login({ id, role }) {
        const accessToken = await this.AuthJwtService.generateAccessToken({
            id,
            role,
        });
        const refreshToken = await this.AuthJwtService.generateRefreshToken({
            id,
            role,
        });
        return {
            accessToken,
            refreshToken,
        };
    }

    async register(registerDto: RegisterDto) {
        const newUser = await this.usersService.create(registerDto);
        // gửi mail
        const sendMailOtp = await this.sendOtp(
            newUser.data.id,
            newUser.data.full_name as string,
            newUser.data.email,
        );
        return {
            message: ['Đăng kí tài khoản thành công.', sendMailOtp.message],
        };
    }

    async verifyOTP(verifyOtp: VerifyOTPDTO) {
        const userAlreadyExist = await this.usersService.findByEmail(
            verifyOtp.email,
        );
        if (!userAlreadyExist)
            throw new NotFoundException('Email không tồn tại!');
        await this.authTokenService.verifyToken(
            userAlreadyExist.dataValues.id,
            AuthTokenType.OTP_SendMailer,
            verifyOtp.otp,
        );
        if (verifyOtp.purpose === OtpPurpose.VERIFY_EMAIL) {
            // cấp token
            await this.usersService.markEmailVerified(userAlreadyExist.id);
            const accessToken = await this.AuthJwtService.generateAccessToken({
                id: userAlreadyExist.dataValues.id,
                role: userAlreadyExist.dataValues.role,
            });
            const refreshToken = await this.AuthJwtService.generateRefreshToken(
                {
                    id: userAlreadyExist.dataValues.id,
                    role: userAlreadyExist.dataValues.role,
                },
            );
            return {
                accessToken,
                refreshToken,
            };
        } else if (verifyOtp.purpose === OtpPurpose.RESET_PASSWORD) {
            const resetPass = Helper.generateResetPass();
            // hash pass
            const password_hash = Helper.hashValue(resetPass);
            await this.usersService.updatePassword(
                userAlreadyExist.dataValues.id,
                password_hash,
            );
            await this.AuthMailService.sendMail(
                userAlreadyExist.dataValues.full_name as string,
                userAlreadyExist.dataValues.email,
                resetPass,
                typeTemplateMail.TEMPLATE_resetPass,
            );
            return { message: 'reset password và gửi về mail thành công' };
        }
        return { message: 'mã otp hợp lệ' };
    }
    async sendOtp(user_id: string, full_name: string, email: string) {
        // gửi mail
        const OTP = Helper.generateOTP(6);
        const expires_at = this.AuthJwtService.getExpiresAt('OTP_EXPIRATION');
        const token_hash = Helper.hashValue(OTP);
        await this.authTokenService.update(
            {
                token_hash,
                expires_at,
            },
            user_id,
            AuthTokenType.OTP_SendMailer,
        );
        const sendMail = await this.AuthMailService.sendMail(
            full_name,
            email,
            OTP,
            typeTemplateMail.TEMPLATE_OTP,
        );
        return sendMail;
    }
    async resendMail(sendOtpDto: SendOtpDto) {
        const userAlreadyExist = await this.usersService.findByEmail(
            sendOtpDto.email,
        );
        if (!userAlreadyExist)
            throw new NotFoundException('Email không tồn tại!');
        // gửi mail
        await this.sendOtp(
            userAlreadyExist.dataValues.id,
            userAlreadyExist.dataValues.full_name as string,
            userAlreadyExist.dataValues.email,
        );
        return {
            message: 'Gửi OTP thành công.',
        };
    }
}
