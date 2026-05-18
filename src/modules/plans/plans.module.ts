import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Orders, Plans } from '~/models';
import { AuthModule } from '../auth/auth.module';
import { AiAddonPackagesModule } from '../ai_addon_packages/ai_addon_packages.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Plans, Orders]),
        AuthModule,
        AiAddonPackagesModule,
    ],
    controllers: [PlansController],
    providers: [PlansService],
    exports: [PlansService],
})
export class PlansModule {}
