import { Injectable } from '@nestjs/common';
import { UsersService } from '~/modules/users/users.service';
import { QueryUserDto } from './dto/query-users.dto';
import { QueryRange } from '~/common/dto/queryTime.dto';
import { DateRangeUtil } from '~/utils/date-range.util';

@Injectable()
export class AdminUsersService {
    constructor(private readonly usersService: UsersService) {}
    async getUsers(queryUserDto: QueryUserDto) {
        const {
            limit,
            page,
            search,
            sort_by,
            sort_order,
            from,
            range,
            to,
            user_status,
        } = queryUserDto;
        const { fromDate, toExclusive } = DateRangeUtil.getDateRange(
            from,
            to,
            range as QueryRange,
            {
                requireDateRange: false,
            },
        );
        return await this.usersService.findAllUser(
            limit,
            page,
            search,
            sort_by,
            sort_order,
            fromDate,
            toExclusive,
            user_status,
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
