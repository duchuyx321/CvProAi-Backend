import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CvTemplatesService } from '~/modules/cv_templates/cv_templates.service';
import { CreateTemplateDTO } from '~/modules/cv_templates/dto/create-template.dto';
import { UpdateTemplateDto } from '~/modules/cv_templates/dto/update-template.dto';
import { CvsService } from '~/modules/cvs/cvs.service';

@Injectable()
export class AdminCvTemplatesService {
    constructor(
        private readonly cvTemplatesService: CvTemplatesService,
        private readonly cvsService: CvsService,
    ) {}

    async getAllTemplate(
        limit: number = 8,
        page: number = 1,
        search?: string,
        sort_by: 'createdAt' | 'updatedAt' | 'name' = 'updatedAt',
        sort_order: 'ASC' | 'DESC' = 'DESC',
    ) {
        const templates = await this.cvTemplatesService.getAllTemplate(
            limit,
            page,
            search,
            sort_by,
            sort_order,
        );
        if (templates.data.length > 0) {
            const { data, meta } = templates;
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
