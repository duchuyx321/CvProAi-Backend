import { RegexRequired } from '~/common/decorators';
import { Helper } from '~/utils/helpers';

export class ChangePassDto {
    @RegexRequired('password', Helper.RegexValidate.password)
    password!: string;
    @RegexRequired('newPass', Helper.RegexValidate.password)
    newPass!: string;
    @RegexRequired('newPass', Helper.RegexValidate.password)
    repeatPass!: string;
}
