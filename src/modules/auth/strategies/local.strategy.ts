import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '~/modules/users/users.service';
import { user_provider } from '~/models/users.model';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private userService: UsersService) {
        super({
            usernameField: 'email',
        });
    }

    async validate(email: string, password: string): Promise<any> {
        const user = await this.userService.validateUser(
            email,
            password,
            user_provider.LOCAL,
        ); // --> gán vào req.user
        if (!user)
            throw new UnauthorizedException('Dữ liệu gửi lên không hợp lệ!');
        return user;
    }
}
