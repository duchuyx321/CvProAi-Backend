import {
    Body,
    Controller,
    Get,
    Headers,
    Param,
    Post,
    Query,
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
import { QueryPaymentDto } from './dto/query-payment.dto';
import { DateRangeUtil } from '~/utils/date-range.util';
import { QueryRange } from '~/common/dto/queryTime.dto';

@ApiTags('Thanh Toán Nâng Cấp tài khoản')
@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly configService: ConfigService,
    ) {}
    @ApiOperation({ summary: 'danh sách đơn hàng cá nhân' })
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getPaymentMe(@Req() req: Request, @Query() query: QueryPaymentDto) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        const { limit, page, search, sort_by, sort_order, from, range, to } =
            query;
        const { fromDate, toExclusive } = DateRangeUtil.getDateRange(
            from,
            to,
            range as QueryRange,
        );
        return this.paymentsService.getPaymentsMe(
            user_id,
            limit,
            page,
            search,
            sort_by,
            sort_order,
            fromDate,
            toExclusive,
        );
    }

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

    @ApiOperation({ summary: 'Kiểm tra trang thái đơn hàng' })
    @UseGuards(JwtAuthGuard)
    @Get('status/:payment_id')
    async status(@Req() req: Request, @Param('payment_id') payment_id: string) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return await this.paymentsService.checkStatus(payment_id, user_id);
    }
    @ApiOperation({ summary: 'Trạng thái đơn hàng' })
    @UseGuards(JwtAuthGuard)
    @Get('checkout/status/:payment_id')
    async checkoutStatus(
        @Req() req: Request,
        @Param('payment_id') payment_id: string,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return await this.paymentsService.checkoutStatus(payment_id, user_id);
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
