import { RegexRequired } from '~/common/decorators';
import { Helper } from '~/utils/helpers';

export class SendOtpDto {
    @RegexRequired('email', Helper.RegexValidate.email)
    email!: string;
}
