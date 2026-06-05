import { PartialType } from '@nestjs/mapped-types';
import { CreateAiRunsDto } from './create-ai-run.dto';

export class UpdateAiRunDto extends PartialType(CreateAiRunsDto) {}
