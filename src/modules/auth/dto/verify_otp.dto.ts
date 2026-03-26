import { EnumRequired, RegexRequired } from '~/common/decorators';
import { Helper } from '~/utils/helpers';
import { SendOtpDto } from './send_otp.dto';
export enum OtpPurpose {
    VERIFY_EMAIL = 'VERIFY_EMAIL',
    RESET_PASSWORD = 'RESET_PASSWORD',
}
export class VerifyOTPDTO extends SendOtpDto {
    @RegexRequired('otp', Helper.RegexValidate.otp)
    otp!: string;
    @EnumRequired('purpose', OtpPurpose)
    purpose!: OtpPurpose;
}
