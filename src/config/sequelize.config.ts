import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { Dialect } from 'sequelize';

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
});
