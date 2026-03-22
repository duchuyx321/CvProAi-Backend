import { StringRequired } from '~/common/decorators';

export class CreateUserDto {
    @StringRequired('Email')
    email!: string;
    @StringRequired('Password')
    password!: string;
    @StringRequired('Tên người dùng')
    full_name!: string;
}
