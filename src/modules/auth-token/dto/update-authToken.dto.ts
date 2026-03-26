import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateAuthTokenDto } from './create-authToken.dto';

export class UpdateAuthToken extends PartialType(
    OmitType(CreateAuthTokenDto, ['user_id', 'type'] as const),
) {}
