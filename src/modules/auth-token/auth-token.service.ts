import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Auth_tokens } from '~/models';
import { AuthTokenType, CreateAuthTokenDto } from './dto/create-authToken.dto';
import { UpdateAuthToken } from './dto/update-authToken.dto';

@Injectable()
export class AuthTokenService {
    constructor(
        @InjectModel(Auth_tokens)
        private readonly authTokenModule: typeof Auth_tokens,
    ) {}
    async create(createAuthToken: CreateAuthTokenDto) {
        return await this.authTokenModule.create(createAuthToken as any);
    }
    async update(
        updateAuthToken: UpdateAuthToken,
        user_id: string,
        type: AuthTokenType,
        jti?: string,
    ) {
        const where = {
            user_id,
            type,
        };
        if (jti) {
            where['id'] = jti;
        }
        const alreadyExist = await this.authTokenModule.findOne({
            where,
        });

        if (!alreadyExist)
            return await this.create({
                ...updateAuthToken,
                user_id,
                type,
            } as CreateAuthTokenDto);

        if (alreadyExist && type === AuthTokenType.OTP_SendMailer) {
            const expiresAt = new Date(alreadyExist.expires_at).getTime();
            if (expiresAt > Date.now())
                throw new BadRequestException('OTP chưa hết hạn');
        }

        await this.authTokenModule.update(updateAuthToken, {
            where: { user_id, type },
        });
        return;
    }
    build(
        updateAuthToken: UpdateAuthToken,
        user_id: string,
        type: AuthTokenType,
    ) {
        return this.authTokenModule.build({
            ...updateAuthToken,
            user_id,
            type,
        } as any);
    }
    async verifyToken(
        user_id: string,
        type: AuthTokenType,
        code: string,
        jti?: string,
    ) {
        const where = {
            user_id,
            type,
        };
        if (jti) {
            where['id'] = jti;
        }
        const alreadyExist = await this.authTokenModule.findOne({
            where,
        });
        if (!alreadyExist) throw new NotFoundException('Token Không tồn tại!');

        const isMatchToken = alreadyExist.compareToken(code);
        if (!isMatchToken)
            throw new BadRequestException(
                'Token không chính xác hoặc đã hết hạn.',
            );
        const expiresAt = new Date(alreadyExist.expires_at).getTime();
        if (expiresAt < Date.now()) {
            throw new BadRequestException(
                'Token không chính xác hoặc đã hết hạn.',
            );
        }
        return { message: 'Token hợp lệ.' };
    }
}
