import { Module } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';
import { AuthTokenController } from './auth-token.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Auth_tokens } from '~/models';

@Module({
    imports: [SequelizeModule.forFeature([Auth_tokens])],
    controllers: [AuthTokenController],
    providers: [AuthTokenService],
    exports: [AuthTokenService],
})
export class AuthTokenModule {}
