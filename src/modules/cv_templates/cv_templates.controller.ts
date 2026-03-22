import { Controller } from '@nestjs/common';
import { CvTemplatesService } from './cv_templates.service';

@Controller('cv-templates')
export class CvTemplatesController {
    constructor(private readonly cvTemplatesService: CvTemplatesService) {}
}
