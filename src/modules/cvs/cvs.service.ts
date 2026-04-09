import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cvs } from '~/models';
import { CreateCVSDto } from './dto/create-cvs.dto';
import { Helper } from '~/utils/helpers';
import { CloudinaryService } from '~/modules/cloudinary/cloudinary.service';
import { UpdateCVSDto } from './dto/update-cvs.dto';
import { CvTemplatesService } from '~/modules/cv_templates/cv_templates.service';
import { merge } from 'lodash';

@Injectable()
export class CvsService {
    constructor(
        @InjectModel(Cvs) private readonly CvsModule: typeof Cvs,
        private readonly cloudinaryService: CloudinaryService,
        private readonly cvTemplatesService: CvTemplatesService,
    ) {}

    async getAllTemplateCV(user_id: string, limit: number, page: number) {
        const offset = (page - 1) * limit;
        const { rows, count } = await this.CvsModule.findAndCountAll({
            where: { user_id },
            // attributes: {
            //     exclude: ['content', 'custom_config'],
            // },
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });
        return {
            message: 'Lấy danh sách CV thành công',
            data: rows,
            meta: {
                page,
                limit,
                total_items: count,
                total_pages: Math.ceil(count / limit),
            },
        };
    }
    async getCvMeByID(user_id: string, cv_id: string) {
        const alreadyExist = await this.CvsModule.findOne({
            where: {
                user_id,
                id: cv_id,
            },
        });
        if (!alreadyExist) {
            throw new NotFoundException('Không tìm thấy cv này.');
        }
        return {
            message: 'Lấy dữ liệu CV thành công.',
            data: alreadyExist,
        };
    }
    async getCvMeSlug(
        user_id: string,
        slug: string,
        isAlreadyExist: boolean = false,
    ) {
        const alreadyExist = await this.CvsModule.findOne({
            where: { user_id, slug },
        });

        if (!alreadyExist && !isAlreadyExist) {
            throw new NotFoundException('Không tìm thấy cv này.');
        }

        // 1. Lấy Template gốc
        const cvTemplate = await this.cvTemplatesService.getTemplateByID(
            alreadyExist?.dataValues.template_id as string,
        );

        const cvData = alreadyExist?.get({ plain: true });
        const templateConfig =
            cvTemplate.data?.dataValues?.config ||
            cvTemplate.data?.config ||
            {};
        const finalConfig = merge(
            {},
            cvTemplate.data?.config || {},
            templateConfig,
        );

        // 4. Xóa custom_config gốc đi vì nó đã được "hòa tan" vào finalConfig
        delete cvData?.custom_config;

        return {
            message: 'Lấy dữ liệu CV thành công.',
            data: {
                ...cvData,
                config: finalConfig, // Trả về config hoàn chỉnh cho Frontend
            },
        };
    }
    getFilesToDelete = (cv: CreateCVSDto | UpdateCVSDto): string[] => {
        const files: string[] = [];
        const avatarUrl = cv?.content?.profile_header?.avatar_url;
        const previewUrl = cv?.preview_url;

        if (avatarUrl) files.push(avatarUrl);
        if (previewUrl) files.push(previewUrl);

        return files;
    };
    async addCv(user_id: string, createCVSDto: CreateCVSDto) {
        try {
            const slug = Helper.makeSlugFromString(createCVSDto.title);
            const alreadyExists = await this.getCvMeSlug(user_id, slug, true);
            if (alreadyExists?.data) {
                const files = this.getFilesToDelete(createCVSDto);
                if (files.length > 0) {
                    await this.cloudinaryService.deleteMultiple(files);
                }
                throw new BadRequestException('tiêu đề này đã tồn tại.');
            }
            await this.CvsModule.create({ user_id, ...createCVSDto } as any);
            return {
                message: 'Lưu cv thành công',
            };
        } catch (error) {
            console.log(error);
            const files = this.getFilesToDelete(createCVSDto);
            if (files.length > 0) {
                await this.cloudinaryService.deleteMultiple(files);
            }
            throw new BadRequestException('Lưu Cv thất bại');
        }
    }
    async editCv(user_id: string, cv_id: string, updateCVSDto: UpdateCVSDto) {
        try {
            await this.getCvMeByID(user_id, cv_id);
            if (updateCVSDto?.title) {
                const slug = Helper.makeSlugFromString(updateCVSDto?.title);
                const alreadyExists = await this.getCvMeSlug(
                    user_id,
                    slug,
                    true,
                );
                if (alreadyExists?.data) {
                    const files = this.getFilesToDelete(updateCVSDto);
                    if (files.length > 0) {
                        await this.cloudinaryService.deleteMultiple(files);
                    }
                    throw new BadRequestException('tiêu đề này đã tồn tại.');
                }
            }
            console.log(updateCVSDto);
            const updated = await this.CvsModule.update(updateCVSDto, {
                where: {
                    user_id,
                    id: cv_id,
                },
            });
            if (updated[0] === 0) {
                const files = this.getFilesToDelete(updateCVSDto);
                if (files.length > 0) {
                    await this.cloudinaryService.deleteMultiple(files);
                }
                throw new BadRequestException('Chỉnh sửa cv không thành công.');
            }
            return {
                message: 'Lưu cv thành công',
            };
        } catch (error) {
            console.log(error);
            const files = this.getFilesToDelete(updateCVSDto);
            if (files.length > 0) {
                await this.cloudinaryService.deleteMultiple(files);
            }
            throw new BadRequestException('Lưu Cv thất bại');
        }
    }
}
