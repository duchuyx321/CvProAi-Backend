import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
    AiAddonPackages,
    order_type,
    Orders,
    payment_status,
    Plans,
    Users,
} from '~/models';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PlansService } from '~/modules/plans/plans.service';
import { SubscriptionsService } from '~/modules/subscriptions/subscriptions.service';
import { ConfigService } from '@nestjs/config';
import { AiAddonPackagesService } from '~/modules/ai_addon_packages/ai_addon_packages.service';
import { Helper } from '~/utils/helpers';
import { SepayWebhookDto } from './dto/payload-payment.dto';
import { Op } from 'sequelize';
import { UsageQuotasService } from '../usage-quotas/usage-quotas.service';
import { UpdateUsageQuotasDto } from '../usage-quotas/dto/update-usageQuatas.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectModel(Orders) private readonly OrdersModel: typeof Orders,
        private readonly plansService: PlansService,
        private readonly subscriptionsService: SubscriptionsService,
        private readonly configService: ConfigService,
        private readonly aiAddonPackagesService: AiAddonPackagesService,
        private readonly usageQuotasService: UsageQuotasService,
        private readonly usersService: UsersService,
    ) {}

    async getPaymentsMe(
        user_id: string,
        limit: number,
        page: number,
        search?: string,
        sort_by: 'created_at' | 'updated_at' | 'title' = 'updated_at',
        sort_order: 'ASC' | 'DESC' = 'DESC',
    ) {
        const offset = (page - 1) * limit;
        const where: Record<string, any> = { user_id };
        if (search?.trim()) {
            where.order_code = { [Op.iLike]: `%${search.trim()}%` };
        }
        const { rows, count } = await this.OrdersModel.findAndCountAll({
            where,
            order: [[sort_by, sort_order]],
            limit,
            offset,
            attributes: [
                'id',
                'order_code',
                'amount_cents',
                'status',
                'order_type',
                'paid_at',
                'created_at',
            ],
            include: [
                {
                    model: Users,
                    attributes: ['full_name', 'email', 'avatar'],
                },
                {
                    model: Plans,
                    attributes: ['name'],
                },
                {
                    model: AiAddonPackages,
                    attributes: ['name'],
                },
            ],
        });
        return {
            message: 'Lấy danh sách payments thành công',
            data: {
                data: rows,
                meta: {
                    page,
                    limit,
                    total_items: count,
                    total_pages: Math.ceil(count / limit),
                },
            },
        };
    }
    async getPayments(
        limit: number,
        page: number,
        search?: string,
        sort_by: 'created_at' | 'updated_at' | 'title' = 'updated_at',
        sort_order: 'ASC' | 'DESC' = 'DESC',
    ) {
        const offset = (page - 1) * limit;
        const where: Record<string, any> = {};
        if (search?.trim()) {
            where.order_code = { [Op.iLike]: `%${search.trim()}%` };
        }
        const { rows, count } = await this.OrdersModel.findAndCountAll({
            where,
            order: [[sort_by, sort_order]],
            limit,
            offset,
            attributes: [
                'id',
                'order_code',
                'amount_cents',
                'status',
                'order_type',
                'paid_at',
                'created_at',
            ],
            include: [
                {
                    model: Users,
                    attributes: ['full_name', 'email', 'avatar'],
                },
                {
                    model: Plans,
                    attributes: ['name'],
                },
                {
                    model: AiAddonPackages,
                    attributes: ['name'],
                },
            ],
        });
        return {
            message: 'Lấy danh sách payments thành công',
            data: {
                data: rows,
                meta: {
                    page,
                    limit,
                    total_items: count,
                    total_pages: Math.ceil(count / limit),
                },
            },
        };
    }
    async AdminCountPayment(fromDate: Date, toDate: Date) {
        const durationMs = toDate.getTime() - fromDate.getTime();
        const previousFromDate = new Date(fromDate.getTime() - durationMs);
        const previousToExclusive = fromDate;

        const currentDateWhere = {
            [Op.gte]: fromDate,
            [Op.lt]: toDate,
        };

        const previousDateWhere = {
            [Op.gte]: previousFromDate,
            [Op.lt]: previousToExclusive,
        };
        const [current, previous] = await Promise.all([
            this.OrdersModel.count({
                where: {
                    status: 'PAID',
                    createdAt: currentDateWhere,
                },
            }),
            this.OrdersModel.count({
                where: {
                    status: 'PAID',
                    createdAt: previousDateWhere,
                },
            }),
        ]);
        const growth_percent = Helper.calculateGrowthPercent(current, previous);
        return {
            value: current,
            growth_percent,
        };
    }
    async AdminCountAmount(fromDate: Date, toDate: Date) {
        const durationMs = toDate.getTime() - fromDate.getTime();
        const previousFromDate = new Date(fromDate.getTime() - durationMs);
        const previousToExclusive = fromDate;

        const currentDateWhere = {
            [Op.gte]: fromDate,
            [Op.lt]: toDate,
        };

        const previousDateWhere = {
            [Op.gte]: previousFromDate,
            [Op.lt]: previousToExclusive,
        };
        const [current, previous] = await Promise.all([
            this.OrdersModel.sum('amount_cents', {
                where: {
                    status: 'PAID',
                    paid_at: currentDateWhere,
                },
            }),

            this.OrdersModel.sum('amount_cents', {
                where: {
                    status: 'PAID',
                    paid_at: previousDateWhere,
                },
            }),
        ]);
        const growth_percent = Helper.calculateGrowthPercent(current, previous);
        return {
            value: current,
            growth_percent,
        };
    }
    async AdminTotalRevenue(fromDate: Date, toDate: Date) {
        const planPremium = await this.plansService.findOneBySlug('premium');
        if (!planPremium) {
            throw new NotFoundException('Không tìm thấy đơn hàng.');
        }
        const plaintPlanPremium = planPremium.get({ plain: true });
        const currentDateWhere = {
            [Op.gte]: fromDate,
            [Op.lt]: toDate,
        };
        const [totalRevenues, totalPremiums, totalAddons] = await Promise.all([
            // Tổng tiền
            this.OrdersModel.sum('amount_cents', {
                where: {
                    status: payment_status.PAID,
                    paid_at: currentDateWhere,
                },
            }),
            // Tổng tiền premium paid
            this.OrdersModel.sum('amount_cents', {
                where: {
                    status: payment_status.PAID,
                    order_type: order_type.SUBSCRIPTION,
                    plan_id: plaintPlanPremium.id,
                    paid_at: currentDateWhere,
                },
            }),
            // tổng tiền addon
            this.OrdersModel.sum('amount_cents', {
                where: {
                    status: payment_status.PAID,
                    order_type: order_type.AI_ADDON,
                    paid_at: currentDateWhere,
                },
            }),
        ]);
        // Xử lý trường hợp sum trả về null nếu không có dữ liệu
        const revenue = Number(totalRevenues) || 0;
        const premium = Number(totalPremiums) || 0;
        const addon = Number(totalAddons) || 0;
        const others = revenue - premium - addon;
        return {
            totalRevenues: revenue,
            totalPremiums: premium,
            totalAddons: addon,
            totalOrders: others,
        };
    }
    async AdminTotalPremium(fromDate: Date, toDate: Date) {
        const planPremium = await this.plansService.findOneBySlug('premium');
        if (!planPremium) {
            throw new NotFoundException('Không tìm thấy đơn hàng.');
        }
        const plaintPlanPremium = planPremium.get({ plain: true });
        const currentDateWhere = {
            [Op.gte]: fromDate,
            [Op.lt]: toDate,
        };
        const [
            totalPremiums,
            totalPremiumsPaid,
            totalPremiumsPending,
            totalUsers,
        ] = await Promise.all([
            // Tổng số đơn hàng
            this.OrdersModel.count({
                where: {
                    paid_at: currentDateWhere,
                },
            }),
            // Tổng số đơn hàng premium đã thanh toán thành công
            this.OrdersModel.count({
                where: {
                    status: payment_status.PAID,
                    order_type: order_type.SUBSCRIPTION,
                    plan_id: plaintPlanPremium.id,
                    paid_at: currentDateWhere,
                },
            }),
            // tổng số đơn hàng premium chờ xử lý
            this.OrdersModel.count({
                where: {
                    status: payment_status.PENDING,
                    order_type: order_type.SUBSCRIPTION,
                    plan_id: plaintPlanPremium.id,
                    paid_at: currentDateWhere,
                },
            }),
            this.usersService.AdminCountAll(),
        ]);
        // Xử lý trường hợp sum trả về null nếu không có dữ liệu
        const total = Number(totalPremiums) || 0;
        const paid = Number(totalPremiumsPaid) || 0;
        const pending = Number(totalPremiumsPending) || 0;
        const canceled = total - paid - pending;
        const paymentPaidRate = (paid / total) * 100;
        const premiumRate = (paid / totalUsers) * 100;
        return {
            premiumRate,
            paymentPaidRate,
            pending,
            canceled,
        };
    }
    async create(user_id: string, createPaymentDto: CreatePaymentDto) {
        const {
            plan_id: dtoPlanId,
            addon_package_id: dtoAddonId,
            paymentable_type,
        } = createPaymentDto;
        const {
            subscription,
            plan: currentPlan,
            is_free_fallback,
        } = await this.subscriptionsService.getSubscriptionsByUserID(user_id);
        let amount_cents: number = 0;
        const provider = this.configService.get<string>('PROVIDE_PAYMENT');
        const currency = 'VND';
        let plan_id: string | null = null;
        let addon_package_id: string | null = null;
        let description: string | null = null;
        switch (paymentable_type) {
            case order_type.SUBSCRIPTION: {
                if (!dtoPlanId) {
                    throw new BadRequestException('Thiếu plan_id');
                }

                const planPayment = (
                    await this.plansService.findOneById(dtoPlanId)
                ).data.get({ plain: true });

                if (planPayment.slug === 'free') {
                    throw new BadRequestException(
                        'Không thể tạo thanh toán cho gói miễn phí',
                    );
                }

                if (currentPlan?.id === planPayment.id) {
                    throw new BadRequestException(
                        'Bạn đang sử dụng gói này rồi',
                    );
                }

                amount_cents = Number(planPayment.price);
                description = `Thanh toán ${planPayment.name}`;
                plan_id = planPayment.id;
                break;
            }

            case order_type.AI_ADDON: {
                if (!dtoAddonId) {
                    throw new BadRequestException('Thiếu addon_package_id');
                }

                if (is_free_fallback || !subscription) {
                    throw new BadRequestException(
                        'Bạn cần nâng cấp gói trước khi mua thêm lượt phân tích AI',
                    );
                }

                if (!currentPlan?.can_purchase_ai_addon) {
                    throw new BadRequestException(
                        'Gói hiện tại không được phép mua thêm lượt phân tích AI',
                    );
                }

                const addOn =
                    await this.aiAddonPackagesService.getAiAddonPackagesById(
                        dtoAddonId,
                    );

                amount_cents = Number(addOn.price);
                description = `Thanh toán ${addOn.name}`;
                addon_package_id = addOn.id;
                break;
            }

            case order_type.BOTH: {
                if (!dtoPlanId || !dtoAddonId) {
                    throw new BadRequestException(
                        'Thiếu plan_id hoặc addon_package_id',
                    );
                }

                const planPayment = (
                    await this.plansService.findOneById(dtoPlanId)
                ).data.get({ plain: true });

                if (planPayment.slug === 'free') {
                    throw new BadRequestException(
                        'Không thể tạo thanh toán cho gói miễn phí',
                    );
                }

                if (currentPlan?.id === planPayment.id) {
                    throw new BadRequestException(
                        'Bạn đang sử dụng gói này rồi',
                    );
                }

                if (!planPayment.can_purchase_ai_addon) {
                    throw new BadRequestException(
                        'Gói bạn chọn không được phép mua thêm lượt phân tích AI',
                    );
                }

                const addOn =
                    await this.aiAddonPackagesService.getAiAddonPackagesById(
                        dtoAddonId,
                    );
                const plainAddon = addOn.get({ plain: true });
                amount_cents =
                    Number(planPayment.price ?? 0) +
                    Number(plainAddon.price ?? 0);
                description = `Thanh toán ${planPayment.name} + ${plainAddon.name}`;
                plan_id = planPayment.id;
                addon_package_id = plainAddon.id;
                break;
            }

            default:
                throw new BadRequestException('Loại thanh toán không hợp lệ');
        }

        const prefixMap = {
            [order_type.SUBSCRIPTION]: 'SUB',
            [order_type.AI_ADDON]: 'ADD',
            [order_type.BOTH]: 'BTH',
        };

        const prefix = prefixMap[paymentable_type];
        const transferContent = `${prefix}-${Helper.generateOTP(10).toUpperCase()}`;
        const order_code = `CVPROAI-${transferContent}`;
        const payload = {
            user_id,
            order_type: paymentable_type,
            order_code,
            currency,
            description,
            amount_cents,
            plan_id,
            addon_package_id,
            provider,
        };
        const order = await this.OrdersModel.create(payload as any);

        return {
            message: 'tạo đơn hàng thành công',
            data: {
                payment_id: order.dataValues.id,
            },
        };
    }

    async getPaymentById(id: string, user_id: string) {
        const payment = await this.OrdersModel.findOne({
            where: { id, user_id },
        });
        if (!payment) {
            throw new NotFoundException('Không tìm thấy đơn hàng này.');
        }
        return payment;
    }
    async checkout(user_id: string, payment_id: string) {
        const order = await this.OrdersModel.findOne({
            where: {
                id: payment_id,
                user_id,
            },
            include: [
                {
                    model: Plans,
                    required: false,
                },
                {
                    model: AiAddonPackages,
                    required: false,
                },
            ],
        });
        if (!order) {
            throw new NotFoundException('Đơn thanh toán không tồn tại');
        }
        // if (
        //     order.dataValues.status !== payment_status.PENDING ||
        //     Helper.isCheckoutExpired(order.createdAt)
        // ) {
        //     throw new BadRequestException(
        //         'Đã hết hạn hoặc không ở trang thái chờ thanh toán.',
        //     );
        // }
        const plainOrder = order.get({ plain: true });
        const acc = this.configService.get<string>('ACCOUNT_SEPAY');
        const bank = this.configService.get<string>('BANK_SEPAY');
        const qrCode = `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${plainOrder.amount_cents}&des=${plainOrder.order_code}`;
        return {
            message: 'Lấy đơn hàng thành công.',
            data: {
                plan: plainOrder.plan,
                addon: plainOrder.addon_package,
                acc,
                bank,
                order_code: plainOrder.order_code,
                amount_cents: plainOrder.amount_cents,
                payment_id: plainOrder.id,
                qrCode,
            },
        };
    }
    async callback(payload: SepayWebhookDto) {
        const order_code = Helper.formatOrderCodeFromTransferCode(
            payload.content?.trim(),
        );
        Logger.log(`order_code: ${order_code}`);

        if (!order_code) {
            Logger.log(`order_code: ${order_code}`);
            throw new BadRequestException(
                'Không tìm thấy mã đơn hàng trong nội dung chuyển khoản',
            );
        }
        const order = await this.OrdersModel.findOne({
            where: {
                order_code,
                status: payment_status.PENDING,
            },
        });
        if (!order) {
            Logger.log(`order: ${order}`);
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }
        const plainOrder = order.get({ plain: true });
        if (
            Number(plainOrder.amount_cents) !== Number(payload.transferAmount)
        ) {
            Logger.log(`amount_cents: ${payload.transferAmount}`);
            throw new BadRequestException(
                'Số tiền thanh toán của bạn không hợp lệ.',
            );
        }
        await order.update({
            status: payment_status.PAID,
            provider_transaction_id: String(payload.id),
            paid_at: new Date(payload.transactionDate),
            metadata: {
                ...(order.metadata ?? {}),
                ...payload,
            },
        });
        // cập nhật vào subscript và quota
        const subscription = await this.subscriptionsService.create({
            order_id: plainOrder.id,
            plan_id: plainOrder.plan_id as string,
            user_id: plainOrder.user_id,
        });
        const quota = await this.usageQuotasService.getUsageQuotaByUserId(
            plainOrder.user_id,
        );
        let ai_runs_limit = 0;
        let exports_limit = 0;
        if (plainOrder.plan_id) {
            const plan = await this.plansService.findOneById(
                plainOrder.plan_id,
            );
            ai_runs_limit += Number(plan.data.dataValues.ai_limit);
            exports_limit = plan.data.dataValues.export_limit;
        } else if (plainOrder.addon_package_id) {
            const addon =
                await this.aiAddonPackagesService.getAiAddonPackagesById(
                    plainOrder.addon_package_id,
                );
            ai_runs_limit += Number(addon.dataValues.runs);
        }
        const payloadQuot: UpdateUsageQuotasDto = {
            user_id: plainOrder.user_id,
            quota_end_at: subscription.dataValues.current_period_end,
            ai_runs_used: 0,
            exports_used: 0,
        };
        if (ai_runs_limit !== 0) {
            payloadQuot['ai_runs_limit'] = ai_runs_limit;
        }
        if (exports_limit !== 0) {
            payloadQuot['exports_limit'] = exports_limit;
        }
        await this.usageQuotasService.updateUsageQuota(
            quota.quota.dataValues.id,
            payloadQuot,
        );
        return {
            message: 'thanh toán đơn hàng thành công',
            data: { payment_id: plainOrder.id },
        };
    }
    async checkStatus(id: string, user_id: string) {
        const order = await this.getPaymentById(id, user_id);
        const plainOrder = order.get({ plain: true });
        return {
            message: 'check trạng thái thành công.',
            data: {
                order_code: plainOrder.order_code,
                status: plainOrder.status,
                paid_at: plainOrder.paid_at,
            },
        };
    }
    async countOrders(plan_id: string) {
        return await this.OrdersModel.count({
            where: {
                plan_id,
            },
        });
    }
}
