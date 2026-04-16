import { Controller } from '@nestjs/common';
import { CvExportService } from './cv-export.service';

@Controller('cv-export')
export class CvExportController {
    constructor(private readonly cvExportService: CvExportService) {}
}
