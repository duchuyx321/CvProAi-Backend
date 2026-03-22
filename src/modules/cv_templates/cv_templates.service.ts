import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cv_templates } from '~/models/cv_templates.model';

@Injectable()
export class CvTemplatesService {
    constructor(
        @InjectModel(Cv_templates)
        private readonly cvTemplatesModel: typeof Cv_templates,
    ) {}
}
