import { Controller } from '@nestjs/common';
import { AiRunsService } from './ai-runs.service';

@Controller('ai-runs')
export class AiRunsController {
  constructor(private readonly aiRunsService: AiRunsService) {}
}
