import {
    DateRequired,
    EnumRequired,
    StringRequired,
} from '~/common/decorators';

export enum AuthTokenType {
    OTP_SendMailer = 'otp_sendMailer',
    REFRESH_TOKEN = 'refresh_token',
}

export class CreateAuthTokenDto {
    @StringRequired('user_id')
    user_id!: string;
    @EnumRequired('type', AuthTokenType)
    type!: string;
    @StringRequired('token')
    token_hash!: string;
    @DateRequired('expires_at')
    expires_at!: Date;
}
