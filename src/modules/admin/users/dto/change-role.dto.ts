import { EnumRequired } from '~/common/decorators';
import { user_role } from '~/models';

export class changeRoleDto {
    @EnumRequired('role', user_role)
    role!: user_role;
}
