import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export enum PlanInterval {
    MONTH = 'MONTH',
    YEAR = 'YEAR',
    FOREVER = 'FOREVER',
}

export enum PlanCurrency {
    VND = 'VND',
    USD = 'USD',
}
export class CreatePlansDto {
    @IsString({ message: 'code phải là chuỗi!' })
    @IsNotEmpty({ message: 'code không được bỏ trống!' })
    code!: string;

    @IsString({ message: 'tên phải là chuỗi!' })
    @IsNotEmpty({ message: 'tên không được bỏ trống!' })
    name!: string;

    @IsString({ message: 'Mô tả phải là chuỗi!' })
    @IsOptional()
    description?: string;

    @IsNumber({}, { message: 'giá tiền phải là number!' })
    @IsNotEmpty({ message: 'giá tiền không được bỏ trống!' })
    @Type(() => Number)
    @Min(0, { message: 'giá tiền phải lớn hơn hoặc bằng 0!' })
    price_cents!: number;

    @IsEnum(PlanCurrency, { message: 'Vui lòng chọn đúng đơn vị tiền!' })
    @IsOptional()
    currency?: PlanCurrency;

    @IsEnum(PlanInterval, { message: 'Vui lòng chọn đúng chu kì gói!' })
    @IsOptional()
    interval?: PlanInterval;

    @IsObject({ message: 'dịch vụ phải là object!' })
    @IsNotEmpty({ message: 'Dịch vụ không được bỏ trống!' })
    features!: Record<string, any>;

    @IsBoolean({ message: 'Trạng thái hoạt động phải là true/false!' })
    @IsOptional()
    is_active?: boolean;
}
