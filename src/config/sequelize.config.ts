import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { Dialect } from 'sequelize';

import {
    Ai_results,
    Ai_runs,
    Cv_templates,
    Cvs,
    Plans,
    User_profile,
    Users,
    Subscriptions,
    Orders,
    Usage_quotas,
    Auth_tokens,
    Cv_exports,
    Cv_versions,
    AiAddonPackages,
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
        Cv_exports,
        Cv_versions,
        Ai_runs,
        Ai_results,
        Plans,
        Subscriptions,
        Orders,
        Usage_quotas,
        Auth_tokens,
        AiAddonPackages,
    ],
    dialectOptions: {
        ssl:
            configService.get<string>('DB_SSL') === 'true'
                ? {
                      require: true,
                      rejectUnauthorized: false,
                  }
                : false,
    },
});
