import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cv_versions } from '~/models';
import { CreateVersionDto } from './dto/create-version.dto';

@Injectable()
export class CvVersionService {
    constructor(
        @InjectModel(Cv_versions) private cvVersionsModel: typeof Cv_versions,
    ) {}

    async createVersion(createDatabase: CreateVersionDto) {
        return await this.cvVersionsModel.create(createDatabase as any);
    }
}
