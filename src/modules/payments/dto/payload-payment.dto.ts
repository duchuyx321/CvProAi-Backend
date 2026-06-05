import {
    EnumRequired,
    NumberRequired,
    StringNotRequired,
    StringRequired,
} from '~/common/decorators';

export class SepayWebhookDto {
    @NumberRequired('id')
    id!: number;

    @StringRequired('gateway')
    gateway!: string;

    @StringRequired('transactionDate')
    transactionDate!: string;

    @StringRequired('accountNumber')
    accountNumber!: string;

    @StringNotRequired('subAccount')
    subAccount?: string | null;

    @StringNotRequired('code')
    code?: string | null;

    @StringRequired('content')
    content!: string;

    @EnumRequired('transferType', ['in', 'out'])
    transferType!: 'in' | 'out';

    @StringRequired('description')
    description!: string;

    @NumberRequired('transferAmount')
    transferAmount!: number;

    @StringRequired('referenceCode')
    referenceCode!: string;

    @NumberRequired('accumulated')
    accumulated!: number;
}
