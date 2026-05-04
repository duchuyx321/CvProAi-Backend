import { Injectable } from '@nestjs/common';
import { UsersService } from '~/modules/users/users.service';

@Injectable()
export class AdminUsersService {
    constructor(private readonly usersService: UsersService) {}
    async getUsers(
        limit: number = 8,
        page: number = 1,
        search?: string,
        sort_by: 'createdAt' | 'updatedAt' = 'updatedAt',
        sort_order: 'ASC' | 'DESC' = 'DESC',
    ) {
        limit = Math.min(Math.max(Number(limit) || 8, 1), 20);
        page = Math.max(Number(page) || 1, 1);
        return await this.usersService.findAllUser(
            limit,
            page,
            search,
            sort_by,
            sort_order,
        );
    }
    async getUserById(user_id: string) {
        return await this.usersService.AdminFindById(user_id);
    }
    async bannedUser(user_id: string) {
        return await this.usersService.bannedUser(user_id);
    }
    async disBannedUser(user_id: string) {
        return await this.usersService.disBannedUser(user_id);
    }
    async deleteUser(user_id: string) {
        return await this.usersService.deleteUser(user_id);
    }
}
