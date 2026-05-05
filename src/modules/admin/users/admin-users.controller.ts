import { Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UseRoles } from '~/common/decorators';
import { user_role } from '~/models';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';
import { AdminUsersService } from './admin-users.service';
import { QueryUserDto } from './dto/query-users.dto';

@ApiTags('Admin - Quản lý người dùng')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseRoles(user_role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
    constructor(private readonly adminUsersService: AdminUsersService) {}

    @Get()
    async findAllUser(@Query() queryUserDto: QueryUserDto) {
        return await this.adminUsersService.getUsers(queryUserDto);
    }

    @Get('/:id')
    async findUserById(@Query('id') id: string) {
        return await this.adminUsersService.getUserById(id);
    }

    @Patch('/banned/:id')
    async bannedUser(@Query('id') id: string) {
        return await this.adminUsersService.bannedUser(id);
    }

    @Patch('/disbanned/:id')
    async disBannedUser(@Query('id') id: string) {
        return await this.adminUsersService.disBannedUser(id);
    }

    @Patch('/delete/:id')
    async deleteUser(@Query('id') id: string) {
        return await this.adminUsersService.deleteUser(id);
    }
}
