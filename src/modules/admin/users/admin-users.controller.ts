import { Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UseRoles } from '~/common/decorators';
import { user_role } from '~/models';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';
import { AdminUsersService } from './admin-users.service';

@ApiTags('Admin - Quản lý người dùng')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseRoles(user_role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
    constructor(private readonly adminUsersService: AdminUsersService) {}

    @Get()
    async findAllUser(
        @Query('limit') limit?: number,
        @Query('page') page?: number,
        @Query('search') search?: string,
        @Query('sort_by') sort_by?: 'created_at' | 'updated_at',
        @Query('sort_order') sort_order?: 'ASC' | 'DESC',
    ) {
        const allowedSortBy = ['created_at', 'updated_at'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const finalSortBy = allowedSortBy.includes(sort_by ?? 'updated_at')
            ? sort_by
            : 'updated_at';
        const finalSortOrder = allowedSortOrder.includes(sort_order ?? 'DESC')
            ? sort_order
            : 'DESC';
        return await this.adminUsersService.getUsers(
            Number(limit) || 8,
            Number(page) || 1,
            search,
            finalSortBy || 'updated_at',
            finalSortOrder || 'DESC',
        );
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
