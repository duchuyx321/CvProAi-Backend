import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Plans } from '~/models';

@Module({
    imports: [SequelizeModule.forFeature([Plans])],
    controllers: [PlansController],
    providers: [PlansService],
})
export class PlansModule {}
