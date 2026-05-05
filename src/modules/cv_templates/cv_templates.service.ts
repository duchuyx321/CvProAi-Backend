import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cv_templates } from '~/models/cv_templates.model';
import { CreateTemplateDTO } from './dto/create-template.dto';
import { CloudinaryService } from '~/modules/cloudinary/cloudinary.service';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Op } from 'sequelize';

@Injectable()
export class CvTemplatesService {
    constructor(
        @InjectModel(Cv_templates)
        private readonly cvTemplatesModel: typeof Cv_templates,
        private readonly cloudinaryService: CloudinaryService,
    ) {}
    async getAllTemplate(
        limit: number = 8,
        page: number = 1,
        search?: string,
        sort_by: 'createdAt' | 'updatedAt' | 'name' = 'updatedAt',
        sort_order: 'ASC' | 'DESC' = 'DESC',
        fromDate?: Date,
        toDate?: Date,
        is_active?: boolean,
    ) {
        const offset = (page - 1) * limit;
        const where: Record<string, any> = {};
        if (search?.trim()) {
            where.name = {
                [Op.iLike]: `%${search}%`,
            };
        }
        if (fromDate && toDate) {
            where.updatedAt = {
                [Op.gte]: fromDate,
                [Op.lt]: toDate,
            };
        }
        if (typeof is_active === 'boolean') {
            where.is_active = is_active;
        }
        const { rows, count } = await this.cvTemplatesModel.findAndCountAll({
            where,
            attributes: {
                exclude: ['config'],
            },
            order: [[sort_by, sort_order]],
            limit,
            offset,
        });

        return {
            message: 'Lấy danh sách mẫu cv thành công',
            data: {
                data: rows,
                meta: {
                    page,
                    limit,
                    total_items: count,
                    total_pages: Math.ceil(count / limit),
                },
            },
        };
    }
    async getTemplateByCode(
        code: string,
        is_active?: boolean,
        isAlreadyExist: boolean = true,
    ) {
        const where: Record<string, any> = { code };
        if (typeof is_active === 'boolean') {
            where.is_active = is_active;
        }
        const template = await this.cvTemplatesModel.findOne({
            where,
        });
        if (!template && isAlreadyExist)
            throw new NotFoundException('Không tìm thấy mẫu cv');
        return {
            message: 'Lấy mẫu cv thành công',
            data: template,
        };
    }
    async getTemplateByID(id: string) {
        const template = await this.cvTemplatesModel.findByPk(id);
        if (!template) throw new NotFoundException('Không tìm thấy mẫu cv');
        return {
            message: 'Lấy mẫu cv thành công',
            data: template,
        };
    }
    async addTemplate(createTemplateCvDto: CreateTemplateDTO) {
        try {
            const alreadyExits = await this.getTemplateByCode(
                createTemplateCvDto.code,
                false,
            );
            if (alreadyExits.data) {
                if (createTemplateCvDto.preview_url) {
                    await this.cloudinaryService.deleteByUrl(
                        createTemplateCvDto.preview_url,
                    );
                }
                throw new BadRequestException('code đã tồn tại.');
            }
            await this.cvTemplatesModel.create(createTemplateCvDto as any);
            return { message: 'Lưu mẫu cv thành công.' };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            if (createTemplateCvDto.preview_url) {
                await this.cloudinaryService.deleteByUrl(
                    createTemplateCvDto.preview_url,
                );
            }
            throw new InternalServerErrorException('Tạo mẫu cv thất bại');
        }
    }
    async editTemplate(id: string, updateTemplateCvDto: UpdateTemplateDto) {
        try {
            await this.getTemplateByID(id);
            if (updateTemplateCvDto?.code) {
                const checkCode = await this.getTemplateByCode(
                    updateTemplateCvDto.code,
                );
                if (checkCode.data && checkCode.data.id !== id) {
                    if (updateTemplateCvDto.preview_url) {
                        await this.cloudinaryService.deleteByUrl(
                            updateTemplateCvDto.preview_url,
                        );
                    }
                    throw new BadRequestException(
                        'Code này đã tồn tại ở một mẫu CV khác.',
                    );
                }
            }
            const updated = await this.cvTemplatesModel.update(
                updateTemplateCvDto,
                { where: { id } },
            );
            if (updated[0] === 0) {
                if (updateTemplateCvDto.preview_url) {
                    await this.cloudinaryService.deleteByUrl(
                        updateTemplateCvDto.preview_url,
                    );
                }
                throw new InternalServerErrorException('Sửa mẫu cv thất bại');
            }
            return { message: 'Sửa mẫu cv thành công' };
        } catch (error) {
            console.log(error);
            if (updateTemplateCvDto.preview_url) {
                await this.cloudinaryService.deleteByUrl(
                    updateTemplateCvDto.preview_url,
                );
            }
            throw new InternalServerErrorException('Sửa mẫu cv thất bại');
        }
    }
    async disableTemplate(template_id: string) {
        const template = await this.getTemplateByID(template_id);

        await template.data.update({
            is_active: false,
        });
        return { message: 'Khóa mẫu cv thành công' };
    }
    async restoreTemplate(template_id: string) {
        const template = await this.getTemplateByID(template_id);

        await template.data.update({
            is_active: true,
        });
        return { message: 'Mở khóa mẫu cv thành công' };
    }
    async destroyTemplate(template_id: string) {
        const template = await this.getTemplateByID(template_id);
        if (template.data.preview_url) {
            await this.cloudinaryService.deleteByUrl(template.data.preview_url);
        }
        await template.data.destroy();
        return { message: 'Xóa vĩnh viễn CV thành công' };
    }
}
