import { RegexRequired, StringRequired } from '~/common/decorators';
import { Helper } from '~/utils/helpers';

export class RegisterDto {
    @RegexRequired('Email', Helper.RegexValidate.email)
    email!: string;
    @RegexRequired('Password', Helper.RegexValidate.password)
    password!: string;
    @StringRequired('Tên người dùng', 2, 255)
    full_name!: string;
}
