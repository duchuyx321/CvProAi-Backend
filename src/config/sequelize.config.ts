import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { Dialect } from 'sequelize';

import {
    Ai_results,
    Ai_runs,
    Cv_templates,
    Cv_versions,
    Cvs,
    Plans,
    User_profile,
    Users,
    Subscriptions,
    Orders,
    Payment_transactions,
    Order_subscriptions,
    Usage_quotas,
    Audit_logs,
    Auth_tokens,
    Cv_exports,
} from '~/models';

export const sequelizeConfig = (
    configService: ConfigService,
): SequelizeModuleOptions => ({
    dialect: configService.get<Dialect>('DB_DIALECT') ?? 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT')
        ? Number(configService.get<number>('DB_PORT'))
        : 5432,
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    autoLoadModels: true,
    models: [
        Users,
        User_profile,
        Cv_templates,
        Cvs,
        Cv_versions,
        Cv_exports,
        Ai_runs,
        Ai_results,
        Plans,
        Subscriptions,
        Orders,
        Payment_transactions,
        Order_subscriptions,
        Usage_quotas,
        Audit_logs,
        Auth_tokens,
    ],
});
