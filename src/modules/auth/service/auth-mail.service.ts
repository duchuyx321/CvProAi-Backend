import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import { SendOTPTemplate, SendResetPasswordTemplate } from '~/common/templates';

export enum typeTemplateMail {
    TEMPLATE_OTP = 'template_otp',
    TEMPLATE_resetPass = 'SendRestPass',
}
@Injectable()
export class AuthMailService {
    constructor(private readonly mailerService: MailerService) {}
    async sendMail(
        fullname: string,
        emails: string,
        code: string,
        type: typeTemplateMail,
    ) {
        let templateSendMail: Record<string, any>;
        switch (type) {
            case typeTemplateMail.TEMPLATE_OTP:
                templateSendMail = SendOTPTemplate(emails, fullname, code);
                break;

            case typeTemplateMail.TEMPLATE_resetPass:
                templateSendMail = SendResetPasswordTemplate(
                    emails,
                    fullname,
                    code,
                );
                break;

            default:
                throw new BadRequestException('Loại email không hợp lệ');
        }
        await this.mailerService.sendMail(templateSendMail);
        return { message: 'Gửi mail thành công!' };
    }
}
