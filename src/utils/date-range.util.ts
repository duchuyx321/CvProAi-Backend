// src/common/utils/date-range.util.ts

import { BadRequestException } from '@nestjs/common';
import { QueryRange } from '~/common/dto/queryTime.dto';

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MAX_RANGE_DAYS = 366;

export interface DateRangeResult {
    fromDate?: Date;
    toDateInclusive?: Date; // dùng để hiển thị
    toExclusive?: Date; // dùng để query với Op.lt
}

export interface DateRangeOptions {
    requireDateRange?: boolean;
    maxDays?: number;
}

export class DateRangeUtil {
    static startOfDay(date: Date): Date {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    static endOfDay(date: Date): Date {
        const result = new Date(date);
        result.setHours(23, 59, 59, 999);
        return result;
    }

    static startOfMonth(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    static startOfYear(date: Date): Date {
        return new Date(date.getFullYear(), 0, 1);
    }

    static isInvalidDate(date: Date): boolean {
        return Number.isNaN(date.getTime());
    }

    static getDateRange(
        from?: Date,
        to?: Date,
        range?: QueryRange,
        options: DateRangeOptions = {},
    ): DateRangeResult {
        const requireDateRange = options.requireDateRange ?? false;
        const maxDays = options.maxDays ?? MAX_RANGE_DAYS;

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
            if (requireDateRange) {
                throw new BadRequestException(
                    'Vui lòng truyền range hoặc cặp from/to.',
                );
            }

            return {};
        }

        let fromDate: Date;
        let toDateInclusive: Date;
        let toExclusive: Date;

        if (hasFrom && hasTo) {
            const normalizedFrom = this.startOfDay(new Date(from));
            const normalizedTo = this.startOfDay(new Date(to));

            if (
                this.isInvalidDate(normalizedFrom) ||
                this.isInvalidDate(normalizedTo)
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

            if (totalDays > maxDays) {
                throw new BadRequestException(
                    `Không được quá ${maxDays} ngày.`,
                );
            }

            fromDate = normalizedFrom;
            toDateInclusive = this.endOfDay(normalizedTo);
        } else {
            const now = new Date();
            const today = this.startOfDay(now);

            toExclusive = new Date(today.getTime() + MS_PER_DAY);
            toDateInclusive = this.endOfDay(today);

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

        return {
            fromDate,
            toDateInclusive,
            toExclusive,
        };
    }
}
