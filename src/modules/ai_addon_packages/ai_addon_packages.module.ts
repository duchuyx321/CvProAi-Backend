import { Module } from '@nestjs/common';
import { AiAddonPackagesService } from './ai_addon_packages.service';
import { AiAddonPackagesController } from './ai_addon_packages.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AiAddonPackages, Orders } from '~/models';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        SequelizeModule.forFeature([AiAddonPackages, Orders]),
        AuthModule,
    ],
    controllers: [AiAddonPackagesController],
    providers: [AiAddonPackagesService],
    exports: [AiAddonPackagesService],
})
export class AiAddonPackagesModule {}
