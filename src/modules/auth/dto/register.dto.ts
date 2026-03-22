import { RegexRequired, StringRequired } from '~/common/decorators';

export const RegexValidate = {
    email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/,
};
export class RegisterDto {
    @RegexRequired('Email', RegexValidate.email)
    email!: string;
    @RegexRequired('Password', RegexValidate.password)
    password!: string;
    @StringRequired('Tên người dùng', 2, 255)
    full_name!: string;
}
