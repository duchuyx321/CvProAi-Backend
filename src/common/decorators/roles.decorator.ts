import { SetMetadata } from '@nestjs/common';

export const UseRoles = (...roles: string[]) => SetMetadata('roles', roles);
