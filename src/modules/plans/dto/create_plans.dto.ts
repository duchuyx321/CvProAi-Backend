import {
    BooleanNotRequired,
    BooleanRequired,
    EnumNotRequired,
    NumberRequired,
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
    @StringRequired('name')
    name!: string;
    @StringNotRequired('description')
    description?: string;
    @NumberRequired('price', 0)
    price!: number;
    @EnumNotRequired('currency', PlanCurrency)
    currency?: PlanCurrency;
    @EnumNotRequired('interval', PlanInterval)
    billing_cycle: PlanInterval = PlanInterval.MONTH;
    @NumberRequired('cv_limit', 0)
    cv_limit!: number;
    @NumberRequired('export_limit', 0)
    export_limit!: number;
    @NumberRequired('ai_limit', 0)
    ai_limit!: number;
    @BooleanRequired('premium_template')
    premium_template!: boolean;
    @BooleanRequired('remove_watermark')
    remove_watermark!: boolean;
    @BooleanRequired('custom_domain')
    custom_domain!: boolean;
    @BooleanRequired('priority_support')
    priority_support!: boolean;
    @BooleanNotRequired('is_active')
    is_active?: boolean;
    @BooleanNotRequired('view_full_ai_analysis')
    view_full_ai_analysis?: boolean;
}
