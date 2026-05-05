import { BadRequestException, Injectable } from '@nestjs/common';
import {
    ExportFormat,
    QueryDashboardDto,
    QueryRange,
} from './dto/query-dashboard.dto';
import { UsersService } from '~/modules/users/users.service';
import { CvExportService } from '~/modules/cv-export/cv-export.service';
import { CvsService } from '~/modules/cvs/cvs.service';
import { AiRunsService } from '~/modules/ai-runs/ai-runs.service';
import { PaymentsService } from '~/modules/payments/payments.service';
import { Helper } from '~/utils/helpers';
import {
    ExportDashboardService,
    ExportFileResult,
} from './export-dashboard.service';

const MAX_DASHBOARD_RANGE_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
@Injectable()
export class DashboardService {
    constructor(
        private readonly usersService: UsersService,
        private readonly cvExportService: CvExportService,
        private readonly cvsService: CvsService,
        private readonly AiRunsService: AiRunsService,
        private readonly paymentsService: PaymentsService,
        private readonly exportDashboardService: ExportDashboardService,
    ) {}
    startOfDay(date: Date) {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    endOfDay(date: Date) {
        const result = new Date(date);
        result.setHours(23, 59, 59, 999);
        return result;
    }

    startOfMonth(date: Date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    startOfYear(date: Date) {
        return new Date(date.getFullYear(), 0, 1);
    }
    getDateRange(from?: Date, to?: Date, range?: QueryRange) {
        const hasRange = range !== undefined && range !== null;
        const hasFrom = from !== undefined && from !== null;
        const hasTo = to !== undefined && to !== null;

        if (hasRange && (hasFrom || hasTo)) {
            throw new BadRequestException(
                'Chỉ được truyền range hoặc cặp from/to, không truyền cả hai.',
            );
        }

        if ((hasFrom && !hasTo) || (!hasFrom && hasTo)) {
            throw new BadRequestException(
                'Nếu lọc theo ngày tùy chọn, vui lòng truyền đủ cả from và to.',
            );
        }

        if (!hasRange && !hasFrom && !hasTo) {
            throw new BadRequestException(
                'Vui lòng truyền range hoặc cặp from/to.',
            );
        }

        let fromDate: Date;
        let toDate: Date;
        let toExclusive: Date;

        if (hasFrom && hasTo) {
            const normalizedFrom = this.startOfDay(new Date(from));
            const normalizedTo = this.startOfDay(new Date(to));

            if (
                Number.isNaN(normalizedFrom.getTime()) ||
                Number.isNaN(normalizedTo.getTime())
            ) {
                throw new BadRequestException('Ngày truyền lên không hợp lệ.');
            }

            toExclusive = new Date(normalizedTo.getTime() + MS_PER_DAY);

            const totalDays =
                (toExclusive.getTime() - normalizedFrom.getTime()) / MS_PER_DAY;

            if (totalDays <= 0) {
                throw new BadRequestException(
                    'Ngày bắt đầu và ngày đến không hợp lệ.',
                );
            }

            if (totalDays > MAX_DASHBOARD_RANGE_DAYS) {
                throw new BadRequestException(
                    `Không được quá ${MAX_DASHBOARD_RANGE_DAYS} ngày.`,
                );
            }

            fromDate = normalizedFrom;
            toDate = this.endOfDay(normalizedTo);
        } else {
            const now = new Date();
            const today = this.startOfDay(now);

            toExclusive = new Date(today.getTime() + MS_PER_DAY);
            toDate = this.endOfDay(today);

            switch (range) {
                case QueryRange.SEVEN_DAYS:
                    fromDate = new Date(today.getTime() - 6 * MS_PER_DAY);
                    break;

                case QueryRange.THIRTY_DAYS:
                    fromDate = new Date(today.getTime() - 29 * MS_PER_DAY);
                    break;

                case QueryRange.MONTH:
                    fromDate = this.startOfMonth(today);
                    break;

                case QueryRange.YEAR:
                    fromDate = this.startOfYear(today);
                    break;

                default:
                    throw new BadRequestException('Range không hợp lệ.');
            }
        }

        return { fromDate, toDate, toExclusive };
    }
    async getAdminDashboard(queryDashboardDto: QueryDashboardDto) {
        const { from, range, to } = queryDashboardDto;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { fromDate, toDate, toExclusive } = this.getDateRange(
            from,
            to,
            range as QueryRange,
        );
        const [
            //Thống kê
            total_users,
            total_cvs,
            total_aiRuns,
            total_exports,
            total_success_payments,
            total_amount,
            // chart
            chartPieData,
            chartProgress,
            // transitions
            payments,
        ] = await Promise.all([
            //Thống kê
            this.usersService.AdminCountUser(fromDate, toExclusive),
            this.cvsService.AdminCountCvs(fromDate, toExclusive),
            this.AiRunsService.AdminCountAiRuns(fromDate, toExclusive),
            this.cvExportService.AdminCountExport(fromDate, toExclusive),
            this.paymentsService.AdminCountPayment(fromDate, toExclusive),
            this.paymentsService.AdminCountAmount(fromDate, toExclusive),
            // chart
            this.paymentsService.AdminTotalRevenue(fromDate, toExclusive),
            this.paymentsService.AdminTotalPremium(fromDate, toExclusive),
            // transitions
            this.paymentsService.getPayments(
                4,
                1,
                undefined,
                'createdAt',
                'DESC',
            ),
        ]);
        const buckets = Helper.mapToBucket(fromDate, toExclusive);
        const chartLineData = await Promise.all(
            buckets.map(async (bucket) => {
                const [users, cvs, aiRuns] = await Promise.all([
                    this.usersService.AdminCountUser(
                        bucket.fromDate,
                        bucket.toDate,
                    ),
                    this.cvsService.AdminCountCvs(
                        bucket.fromDate,
                        bucket.toDate,
                    ),
                    this.AiRunsService.AdminCountAiRuns(
                        bucket.fromDate,
                        bucket.toDate,
                    ),
                ]);
                return {
                    label: bucket.label,
                    fromDate: bucket.fromDate,
                    toDate: bucket.toDate,
                    users,
                    cvs,
                    aiRuns,
                };
            }),
        );
        return {
            message: 'Lấy dữ liệu thống kê thành công',
            data: {
                summary: {
                    total_users,
                    total_cvs,
                    total_aiRuns,
                    total_exports,
                    total_success_payments,
                    total_amount,
                },
                chartLineData,
                chartPieData,
                chartProgress,
                payments,
            },
        };
    }

    async export(
        format: ExportFormat,
        queryDashboardDto: QueryDashboardDto,
    ): Promise<ExportFileResult> {
        const { data } = await this.getAdminDashboard(queryDashboardDto);
        return this.exportDashboardService.exportDashboard({ format, data });
    }
}
