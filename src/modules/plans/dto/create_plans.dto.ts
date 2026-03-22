import {
    BooleanNotRequired,
    EnumNotRequired,
    NumberRequired,
    ObjectRequired,
    StringNotRequired,
    StringRequired,
} from '~/common/decorators';

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
    @StringRequired('code')
    code!: string;

    @StringRequired('name')
    name!: string;

    @StringNotRequired('description')
    description?: string;

    @NumberRequired('price_cents', 0)
    price_cents!: number;

    @EnumNotRequired('currency', PlanCurrency)
    currency?: PlanCurrency;

    @EnumNotRequired('interval', PlanInterval)
    interval?: PlanInterval;

    @ObjectRequired('features')
    features!: Record<string, any>;

    @BooleanNotRequired('is_active')
    is_active?: boolean;
}
