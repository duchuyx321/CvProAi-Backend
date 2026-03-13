import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule, SequelizeModuleOptions } from '@nestjs/sequelize';
import { sequelizeConfig } from '~/config/sequelize.config';
import { PlansModule } from '~/modules/plans/plans.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.development.local',
        }),
        SequelizeModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (
                configService: ConfigService,
            ): SequelizeModuleOptions => sequelizeConfig(configService),
        }),
        PlansModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
