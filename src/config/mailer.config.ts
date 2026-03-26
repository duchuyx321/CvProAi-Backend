import { ConfigService } from '@nestjs/config';

export const MailerConfig = (configService: ConfigService) => ({
    transport: {
        host: configService.get<string>('MAIL_HOST'),
        port: configService.get<string>('MAIL_PORT'),
        auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
        },
    },
    defaults: {
        from: configService.get<string>('MAIL_FROM'),
    },
});
