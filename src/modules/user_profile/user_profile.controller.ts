import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UseRoles } from '~/common/decorators';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';
import { UserProfileService } from './user_profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePassDto } from './dto/change-pass.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '~/modules/cloudinary/cloudinary.service';
import { user_role } from '~/models';

@ApiTags('Thông tin cá nhân')
@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseRoles(user_role.USER, user_role.ADMIN)
export class UserProfileController {
    constructor(
        private readonly userProfileService: UserProfileService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    @ApiOperation({ summary: 'Lấy thông tin cá nhân.' })
    @Get()
    async MyProfile(@Req() req: Request) {
        return this.userProfileService.getMyProfile(req['user'] as any);
    }

    @ApiOperation({ summary: 'Cập nhật thông tin cá nhân.' })
    @Post('update')
    @UseInterceptors(
        FileInterceptor('avatar', {
            storage: memoryStorage(),
        }),
    )
    async updateProfile(
        @Body() updateProfileDto: UpdateProfileDto,
        @UploadedFile() avatar: Express.Multer.File,
        @Req() req: Request,
    ) {
        let avatar_url = '';
        if (avatar) {
            const result = (await this.cloudinaryService.uploadFile(
                avatar,
            )) as {
                url?: string;
            };
            avatar_url = result.url || '';
        }
        const payload = { ...updateProfileDto };
        if (avatar_url?.trim()) {
            payload.avatar_url = avatar_url;
        } else {
            delete payload.avatar_url;
        }
        return this.userProfileService.updateProfile(
            req['user'] as any,
            payload,
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
