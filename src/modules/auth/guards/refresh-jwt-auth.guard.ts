/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshJwtAuthGuard extends AuthGuard('refresh-jwt') {
    handleRequest(err: any, user: any, info: any) {
        console.log('refresh guard err =', err);
        console.log('refresh guard info =', info);
        console.log('refresh guard user =', user);

        if (err || !user) {
            throw (
                err ||
                info ||
                new UnauthorizedException('Phiên đăng nhập hết hạn')
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return user;
    }
}
