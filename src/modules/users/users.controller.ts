import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('người dùng')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}
    @ApiOperation({ summary: 'Lấy dữ liệu dashboard' })
    @Get('dashboard')
    async dashboard(@Req() req: Request) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return await this.usersService.dashboar(user_id);
    }
}
