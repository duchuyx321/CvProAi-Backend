import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { memoryStorage } from 'multer';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { user_role } from '~/models';
import { AdminCvTemplatesService } from './admin-cv-templates.service';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';
import { UseRoles } from '~/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateTemplateDTO } from '~/modules/cv_templates/dto/create-template.dto';
import { CloudinaryService } from '~/modules/cloudinary/cloudinary.service';
import { UpdateTemplateDto } from '~/modules/cv_templates/dto/update-template.dto';

@ApiTags('Admin - Quản lý mẫu Cv')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseRoles(user_role.ADMIN)
@Controller('admin/cv-templates')
export class AdminCvTemplatesController {
    constructor(
        private readonly adminCvTemplatesService: AdminCvTemplatesService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}
    @ApiOperation({ summary: 'Lấy danh sách mẫu cv' })
    @Get()
    async getAllTemplate(
        @Query('limit') limit?: number,
        @Query('page') page?: number,
        @Query('search') search?: string,
        @Query('sort_by') sort_by?: 'createdAt' | 'updatedAt' | 'name',
        @Query('sort_order') sort_order?: 'ASC' | 'DESC',
    ) {
        const allowedSortBy = ['createdAt', 'updatedAt', 'name'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const finalSortBy = allowedSortBy.includes(sort_by ?? 'updatedAt')
            ? sort_by
            : 'updatedAt';
        const finalSortOrder = allowedSortOrder.includes(sort_order ?? 'DESC')
            ? sort_order
            : 'DESC';
        return await this.adminCvTemplatesService.getAllTemplate(
            Number(limit) || 8,
            Number(page) || 1,
            search,
            finalSortBy || 'updatedAt',
            finalSortOrder || 'DESC',
        );
    }
    @ApiOperation({ summary: 'Lấy chi tiết mẫu cv' })
    @Get('code/:code')
    async getTemplateByCode(@Param('code') code: string) {
        return await this.adminCvTemplatesService.getCvTemplateByCode(code);
    }
    @ApiOperation({ summary: 'Thêm mẫu cv' })
    @Post('add')
    @UseInterceptors(
        FileInterceptor('thumnail', {
            storage: memoryStorage(),
        }),
    )
    async addTemplate(
        @UploadedFile() thumnail: Express.Multer.File,
        @Body() createTemplateCvDto: CreateTemplateDTO,
    ) {
        let preview_url = createTemplateCvDto?.preview_url || '';
        if (thumnail) {
            const result = (await this.cloudinaryService.uploadFile(
                thumnail,
            )) as {
                url?: string;
            };
            preview_url = result.url as string;
        }

        return await this.adminCvTemplatesService.addTemplate({
            ...createTemplateCvDto,
            preview_url,
        });
    }
    @ApiOperation({ summary: 'sửa mẫu cv' })
    @Patch('edit/:id')
    @UseInterceptors(
        FileInterceptor('thumnail', {
            storage: memoryStorage(),
        }),
    )
    async editTemplate(
        @UploadedFile() thumnail: Express.Multer.File,
        @Param('id') id: string,
        @Body() updateTemplateDto: UpdateTemplateDto,
    ) {
        let preview_url = updateTemplateDto?.preview_url;
        if (thumnail) {
            const result = (await this.cloudinaryService.uploadFile(
                thumnail,
            )) as {
                url?: string;
            };
            preview_url = result.url as string;
        }
        const payload = { ...updateTemplateDto };
        if (preview_url?.trim()) {
            payload.preview_url = preview_url;
        } else {
            delete payload.preview_url;
        }
        return await this.adminCvTemplatesService.editTemplate(id, payload);
    }
    @ApiOperation({ summary: 'Khóa mẫu CV' })
    @Patch('disable/:id')
    async disableTemplate(@Param('id') id: string) {
        return await this.adminCvTemplatesService.disableTemplate(id);
    }
    @ApiOperation({ summary: 'Mở khóa mẫu CV' })
    @Patch('restore/:id')
    async restoreTemplate(@Param('id') id: string) {
        return await this.adminCvTemplatesService.restoreTemplate(id);
    }
    @ApiOperation({ summary: 'Xóa Vĩnh Viễn mẫu CV' })
    @Delete('destroy/:id')
    async destroyTemplate(@Param('id') id: string) {
        return await this.adminCvTemplatesService.destroyTemplate(id);
    }
}
