import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    DateNotRequired,
    EnumNotRequired,
    TransformToDate,
} from '~/common/decorators';

export enum QueryRange {
    SEVEN_DAYS = '7d',
    THIRTY_DAYS = '30d',
    MONTH = 'month',
    YEAR = 'year',
}

export enum ExportFormat {
    EXCEL = 'excel',
    PDF = 'pdf',
    JSON = 'json',
}
export class QueryTimeDto {
    @ApiPropertyOptional({
        example: '2026-05-02',
    })
    @TransformToDate()
    @DateNotRequired('from')
    from?: Date;

    @ApiPropertyOptional({
        example: '2026-05-02',
    })
    @TransformToDate()
    @DateNotRequired('to')
    to?: Date;

    @ApiPropertyOptional({
        example: '7d, 30d, 90d, month, year',
    })
    @EnumNotRequired('range', QueryRange)
    range?: string;
}
