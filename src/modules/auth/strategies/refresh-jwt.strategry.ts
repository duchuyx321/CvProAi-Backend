/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthTokenService } from '~/modules/auth-token/auth-token.service';
import { AuthTokenType } from '~/modules/auth-token/dto/create-authToken.dto';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
    Strategy,
    'refresh-jwt',
) {
    constructor(
        private readonly configService: ConfigService,
        private readonly authTokenService: AuthTokenService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    return request['cookies'].refreshToken as string | null;
                },
            ]),
            ignoreExpiration: false,
            passReqToCallback: true,
            secretOrKey: configService.get<string>(
                'JWT_REFRESH_TOKEN_SECRET',
            ) as string,
        });
    }

    async validate(request: Request, payload: any) {
        const refreshToken = request['cookies'].refreshToken as string | null;
        if (!refreshToken) {
            throw new NotFoundException('Cookied không tồn tại.');
        }
        // check token
        await this.authTokenService.verifyToken(
            payload.uid,
            AuthTokenType.REFRESH_TOKEN,
            refreshToken,
            payload.jti,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return payload;
    }
}
