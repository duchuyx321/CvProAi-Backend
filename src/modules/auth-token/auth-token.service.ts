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
        await this.authTokenModule.create(createAuthToken as any);
        return { message: 'Tạo auth token thành công!' };
    }
    async update(
        updateAuthToken: UpdateAuthToken,
        user_id: string,
        type: AuthTokenType,
    ) {
        const alreadyExist = await this.authTokenModule.findOne({
            where: { user_id, type },
        });

        if (!alreadyExist)
            return await this.create({
                ...updateAuthToken,
                user_id,
                type,
            } as CreateAuthTokenDto);

        if (type === AuthTokenType.OTP_SendMailer) {
            const expiresAt = new Date(alreadyExist.expires_at).getTime();
            if (expiresAt > Date.now())
                throw new BadRequestException('OTP chưa hết hạn');
        }

        await this.authTokenModule.update(updateAuthToken, {
            where: { user_id, type },
        });
        return;
    }
    async verifyToken(user_id: string, type: AuthTokenType, code: string) {
        const alreadyExist = await this.authTokenModule.findOne({
            where: {
                user_id,
                type,
            },
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
