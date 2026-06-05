import { PartialType } from '@nestjs/mapped-types';
import { CreatePlansDto } from '~/modules/plans/dto';

export class UpdatePlansDto extends PartialType(CreatePlansDto) {}
