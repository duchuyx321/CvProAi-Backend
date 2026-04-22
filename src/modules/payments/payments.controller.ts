import {
    Body,
    Controller,
    Get,
    Headers,
    Param,
    Post,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '~/modules/auth/guards';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SepayWebhookDto } from './dto/payload-payment.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('cv cá nhân')
@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly configService: ConfigService,
    ) {}
    @ApiOperation({ summary: 'Tạo đơn hàng' })
    @UseGuards(JwtAuthGuard)
    @Post('create')
    async create(
        @Req() req: Request,
        @Body() createPaymentDto: CreatePaymentDto,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return await this.paymentsService.create(user_id, createPaymentDto);
    }

    @ApiOperation({ summary: 'thanh toán đơn hàng' })
    @UseGuards(JwtAuthGuard)
    @Get('checkout/:payment_id')
    async checkout(
        @Req() req: Request,
        @Param('payment_id') payment_id: string,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return await this.paymentsService.checkout(user_id, payment_id);
    }

    @ApiOperation({ summary: 'thanh toán đơn hàng' })
    @UseGuards(JwtAuthGuard)
    @Get('status/:payment_id')
    async status(@Req() req: Request, @Param('payment_id') payment_id: string) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return await this.paymentsService.checkStatus(payment_id, user_id);
    }

    @ApiOperation({ summary: 'nhận callback' })
    @Post('sepay/callback')
    async callbackPost(
        @Body() payload: SepayWebhookDto,
        @Headers('authorization') authorization: string,
    ) {
        const [scheme, apiKey] = (authorization ?? '').split(' ');
        const API_KEY_SEPAY = this.configService.get<string>('API_KEY_SEPAY');
        const ACCOUNT_SEPAY = this.configService.get<string>('ACCOUNT_SEPAY');
        if (
            scheme !== 'Apikey' ||
            apiKey !== API_KEY_SEPAY ||
            payload.transferType !== 'in' ||
            payload.subAccount !== ACCOUNT_SEPAY
        ) {
            throw new UnauthorizedException('Đơn hàng không hợp lệ.');
        }
        return await this.paymentsService.callback(payload);
    }
}
