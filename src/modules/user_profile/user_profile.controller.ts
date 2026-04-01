/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UseRoles } from '~/common/decorators';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';
import { UserProfileService } from './user_profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePassDto } from './dto/change-pass.dto';

@ApiTags('Thông tin cá nhân')
@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseRoles('USER')
export class UserProfileController {
    constructor(private readonly userProfileService: UserProfileService) {}

    @ApiOperation({ summary: 'Lấy thông tin cá nhân.' })
    @Get()
    async MyProfile(@Req() req: Request) {
        return this.userProfileService.getMyProfile(req['user'] as any);
    }

    @ApiOperation({ summary: 'Cập nhật thông tin cá nhân.' })
    @Post('update')
    async updateProfile(
        @Body() updateProfileDto: UpdateProfileDto,
        @Req() req: Request,
    ) {
        return this.userProfileService.updateProfile(
            req['user'] as any,
            updateProfileDto,
        );
    }

    @ApiOperation({ summary: 'Thay đổi mật khẩu.' })
    @Post('change-password')
    async ChangePassword(
        @Body() changePassDto: ChangePassDto,
        @Req() req: Request,
    ) {
        return this.userProfileService.changePassword(
            req['user'] as any,
            changePassDto,
        );
    }
}
