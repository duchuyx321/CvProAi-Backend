import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Profile, Strategy } from 'passport-google-oauth20';
import { UsersService } from '~/modules/users/users.service';
import { user_provider } from '~/models/users.model';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UsersService,
    ) {
        super({
            clientID: configService.getOrThrow<string>('CLIENT_ID'),
            clientSecret: configService.getOrThrow<string>('CLIENT_SECRET'),
            callbackURL: configService.getOrThrow<string>('CALLBACK_URL'),
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
    ) {
        const email = profile.emails?.[0]?.value;
        const full_name = profile.displayName;
        const provider = user_provider.GOOGLE;
        const alreadyExist = await this.userService.validateAccountProvide(
            email as string,
            full_name,
            provider,
        );
        return alreadyExist;
    }
}
