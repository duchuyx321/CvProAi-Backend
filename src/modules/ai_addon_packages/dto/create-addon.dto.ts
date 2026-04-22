import {
    BooleanNotRequired,
    NumberRequired,
    StringNotRequired,
    StringRequired,
} from '~/common/decorators';

export class CreateAddonDto {
    @StringRequired('name')
    name!: string;
    @StringNotRequired('description')
    description?: string;
    @NumberRequired('price')
    price!: number;
    @NumberRequired('runs')
    runs!: number;
    @BooleanNotRequired('is_active')
    is_active: boolean = true;
}
