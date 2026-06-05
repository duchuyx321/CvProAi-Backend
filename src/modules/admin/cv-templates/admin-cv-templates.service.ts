import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CvTemplatesService } from '~/modules/cv_templates/cv_templates.service';
import { CreateTemplateDTO } from '~/modules/cv_templates/dto/create-template.dto';
import { UpdateTemplateDto } from '~/modules/cv_templates/dto/update-template.dto';
import { CvsService } from '~/modules/cvs/cvs.service';
import { QueryTemplateDto } from './dto/query-template.dto';
import { DateRangeUtil } from '~/utils/date-range.util';
import { QueryRange } from '~/common/dto/queryTime.dto';

@Injectable()
export class AdminCvTemplatesService {
    constructor(
        private readonly cvTemplatesService: CvTemplatesService,
        private readonly cvsService: CvsService,
    ) {}

    async getAllTemplate(queryTemplateDto: QueryTemplateDto) {
        const { limit, page, search, sort_by, sort_order, from, range, to } =
            queryTemplateDto;
        const { fromDate, toExclusive } = DateRangeUtil.getDateRange(
            from,
            to,
            range as QueryRange,
            {
                requireDateRange: false,
            },
        );
        const templates = await this.cvTemplatesService.getAllTemplate(
            limit,
            page,
            search,
            sort_by,
            sort_order,
            fromDate,
            toExclusive,
        );
        if (templates.data.data.length > 0) {
            const { data, meta } = templates.data;
            const templatesData = await Promise.all(
                data.map(async (template) => {
                    const plainTemplate = template.get({ plain: true });
                    const used_count = await this.cvsService.getCountCvs(
                        plainTemplate.id,
                    );
                    return {
                        ...plainTemplate,
                        used_count,
                    };
                }),
            );
            return {
                message: 'Lấy danh sách mẫu CV thành công',
                data: { data: templatesData, meta },
            };
        }
        return templates;
    }
    async getCvTemplateByCode(code: string) {
        const template = await this.cvTemplatesService.getTemplateByCode(code);
        if (!template.data)
            throw new NotFoundException('Không tìm thấy mẫu cv');
        const plainTemplate = template.data.get({ plain: true });
        const used_count = await this.cvsService.getCountCvs(plainTemplate.id);
        return {
            message: 'Lấy mẫu cv thành công',
            data: {
                ...plainTemplate,
                used_count,
            },
        };
    }
    async addTemplate(createTemplateCvDto: CreateTemplateDTO) {
        return await this.cvTemplatesService.addTemplate(createTemplateCvDto);
    }
    async editTemplate(
        template_id: string,
        updatedCvTemplate: UpdateTemplateDto,
    ) {
        // Kiểm tra edit
        if (
            updatedCvTemplate?.config &&
            Object.keys(updatedCvTemplate.config).length > 0
        ) {
            const countCvs = await this.cvsService.getCountCvs(template_id);
            if (countCvs > 0) {
                throw new BadRequestException(
                    'Mẫu CV đang được sử dụng, không thể chỉnh sửa cấu hình layout. Vui lòng tạo mẫu CV mới.',
                );
            }
        }
        if (!updatedCvTemplate.preview_url?.trim()) {
            delete updatedCvTemplate.preview_url;
        }
        return await this.cvTemplatesService.editTemplate(
            template_id,
            updatedCvTemplate,
        );
    }
    async disableTemplate(template_id: string) {
        return await this.cvTemplatesService.disableTemplate(template_id);
    }
    async restoreTemplate(template_id: string) {
        return await this.cvTemplatesService.restoreTemplate(template_id);
    }
    async destroyTemplate(template_id: string) {
        const countCvs = await this.cvsService.getCountCvs(template_id);
        if (countCvs > 0) {
            throw new BadRequestException(
                'Mẫu CV đang được sử dụng, không thể xóa. Vui lòng khóa mẫu CV.',
            );
        }
        return await this.cvTemplatesService.destroyTemplate(template_id);
    }
}
