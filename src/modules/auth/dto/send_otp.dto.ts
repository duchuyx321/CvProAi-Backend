import { EnumRequired, RegexRequired } from '~/common/decorators';
import { user_provider } from '~/models/users.model';
import { Helper } from '~/utils/helpers';

export class SendOtpDto {
    @RegexRequired('email', Helper.RegexValidate.email)
    email!: string;
    @EnumRequired('provide', user_provider)
    provide: user_provider = user_provider.LOCAL;
}
