import { PartialType } from '@nestjs/mapped-types';
import { CreateCVSDto } from './create-cvs.dto';

export class UpdateCVSDto extends PartialType(CreateCVSDto) {}
