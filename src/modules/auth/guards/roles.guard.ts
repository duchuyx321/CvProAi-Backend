/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<string[]>(
            'roles',
            context.getHandler(),
        );

        if (!roles || roles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request['user']; // THIS is what is missing
        console.log('roles guard roles =', roles);
        console.log('roles guard user =', user);

        const isPermission = roles.some((role) => {
            return role === user.role;
        });

        if (!isPermission)
            throw new ForbiddenException('Bạn không đủ quyền truy cập.');

        return true;
    }
}
