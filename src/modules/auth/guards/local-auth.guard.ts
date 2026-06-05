/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
    BadRequestException,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { loginDto } from '~/modules/auth/dto/login.dto';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
    // check dữ liệu và gán user vào req.user
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const dto = plainToInstance(loginDto, request.body);
        const errors = await validate(dto, {
            whitelist: true,
            forbidNonWhitelisted: true,
        });
        if (errors.length > 0) {
            throw new BadRequestException('Dữ liệu gửi lên không hợp lệ');
        }
        return (await super.canActivate(context)) as boolean;
    }
}
