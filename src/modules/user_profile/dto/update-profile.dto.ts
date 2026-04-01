import { ObjectNotRequired, StringNotRequired } from '~/common/decorators';

export class UpdateProfileDto {
    @StringNotRequired('fullName')
    fullName?: string;
    @StringNotRequired('phone')
    phone?: string;
    @StringNotRequired('avatar_url')
    avatar_url?: string;
    @StringNotRequired('birthday')
    dob?: string;
    @StringNotRequired('location')
    location?: string;
    @StringNotRequired('headline')
    headline?: string;
    @StringNotRequired('summary')
    summary?: string;
    @ObjectNotRequired('links')
    links?: Record<string, any>;
}
