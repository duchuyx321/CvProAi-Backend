import { EnumRequired, StringRequired } from '~/common/decorators';
import { user_provider } from '~/models/users.model';

export class CreateUserDto {
    @StringRequired('Email')
    email!: string;
    @StringRequired('Password')
    password!: string;
    @StringRequired('Tên người dùng')
    full_name!: string;
    @EnumRequired('provide', user_provider)
    provider: user_provider = user_provider.GOOGLE;
}
