import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '~/modules/users/users.service';
import { QueryUserDto } from './dto/query-users.dto';
import { QueryRange } from '~/common/dto/queryTime.dto';
import { DateRangeUtil } from '~/utils/date-range.util';
import { changeRoleDto } from './dto/change-role.dto';
import { CreateManualOrderDto } from './dto/change-subscription.dto';
import { user_role } from '~/models';
import { PaymentsService } from '~/modules/payments/payments.service';

@Injectable()
export class AdminUsersService {
    constructor(
        private readonly usersService: UsersService,
        private readonly paymentService: PaymentsService,
    ) {}
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
    async changeRole(use_id: string, changeRoleDto: changeRoleDto) {
        const { role } = changeRoleDto;
        return await this.usersService.changeRole(use_id, role);
    }
    async changeSubscription(
        use_id: string,
        changeSubscriptionDto: CreateManualOrderDto,
        adminId: string,
    ) {
        const user = await this.usersService.findById(use_id);
        const plainUser = user.get({ plain: true });
        if (plainUser.role === user_role.ADMIN) {
            throw new BadRequestException(
                'Người dùng đang sữ dụng role ADMIN.',
            );
        }
        return await this.paymentService.AdminCreateManualOrder(
            use_id,
            changeSubscriptionDto,
            adminId,
        );
    }
}
