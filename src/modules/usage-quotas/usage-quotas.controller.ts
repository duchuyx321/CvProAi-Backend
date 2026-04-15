import { Controller } from '@nestjs/common';
import { UsageQuotasService } from './usage-quotas.service';

@Controller('usage-quotas')
export class UsageQuotasController {
  constructor(private readonly usageQuotasService: UsageQuotasService) {}
}
