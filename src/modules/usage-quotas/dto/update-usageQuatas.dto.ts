import { PartialType } from '@nestjs/mapped-types';
import { CreateUsageQuotasDto } from './create-usageQuatas.dto';

export class UpdateUsageQuotasDto extends PartialType(CreateUsageQuotasDto) {}
