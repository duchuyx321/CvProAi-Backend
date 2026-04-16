import { Controller } from '@nestjs/common';
import { AiResultsService } from './ai-results.service';

@Controller('ai-results')
export class AiResultsController {
    constructor(private readonly aiResultsService: AiResultsService) {}
}
