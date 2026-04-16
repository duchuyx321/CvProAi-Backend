import { Controller } from '@nestjs/common';
import { CvVersionService } from './cv-version.service';

@Controller('cv-version')
export class CvVersionController {
  constructor(private readonly cvVersionService: CvVersionService) {}
}
