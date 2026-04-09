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

@Injectable()
export class CvTemplatesService {
    constructor(
        @InjectModel(Cv_templates)
        private readonly cvTemplatesModel: typeof Cv_templates,
        private readonly cloudinaryService: CloudinaryService,
    ) {}
    async getAllTemplate(limit: number = 8, page: number = 1) {
        const offset = (page - 1) * limit;
        const { rows, count } = await this.cvTemplatesModel.findAndCountAll({
            attributes: {
                exclude: ['config'],
            },
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });
        return {
            message: 'Lấy danh sách mẫu cv thành công',
            data: rows,
            meta: {
                page,
                limit,
                total_items: count,
                total_pages: Math.ceil(count / limit),
            },
        };
    }
    async getTemplateByCode(code: string, isAlreadyExsist: boolean = true) {
        console.log(code);
        const template = await this.cvTemplatesModel.findOne({
            where: { code },
        });
        if (!template && isAlreadyExsist)
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
                    false,
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
}
