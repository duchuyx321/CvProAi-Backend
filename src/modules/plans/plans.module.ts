import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Plans } from '~/models';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [SequelizeModule.forFeature([Plans]), AuthModule],
    controllers: [PlansController],
    providers: [PlansService],
    exports: [PlansService],
})
export class PlansModule {}
