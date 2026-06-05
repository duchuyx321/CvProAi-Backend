import { StringRequired } from '~/common/decorators';

export class loginDto {
    @StringRequired('Email')
    email!: string;
    @StringRequired('Password')
    password!: string;
}
