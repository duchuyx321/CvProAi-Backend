import { PartialType } from '@nestjs/mapped-types';
import { CreateAiResultsDto } from './create-ai-results.dto';

export class UpdateAiResultDto extends PartialType(CreateAiResultsDto) {}
