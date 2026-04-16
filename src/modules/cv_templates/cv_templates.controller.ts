import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { CvTemplatesService } from './cv_templates.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTemplateDTO } from './dto/create-template.dto';
import { UseRoles } from '~/common/decorators';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '~/modules/cloudinary/cloudinary.service';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';

@ApiTags('mẫu cv')
@Controller('cv-templates')
export class CvTemplatesController {
    constructor(
        private readonly cvTemplatesService: CvTemplatesService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    @ApiOperation({ summary: 'Lấy danh sách mẫu cv' })
    @Get()
    async getAllTemplate(
        @Query('limit') limit?: number,
        @Query('page') page?: number,
    ) {
        return await this.cvTemplatesService.getAllTemplate(
            Number(limit) || 8,
            Number(page) || 1,
        );
    }
    @ApiOperation({ summary: 'Lấy mẫu cv' })
    @Get('code/:code')
    async getTemplateByCode(@Param('code') code: string) {
        return await this.cvTemplatesService.getTemplateByCode(code);
    }
    @ApiOperation({ summary: 'Thêm mẫu cv' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseRoles('ADMIN')
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
        let preview_url = '';
        if (thumnail) {
            const result = (await this.cloudinaryService.uploadFile(
                thumnail,
            )) as {
                url?: string;
            };
            preview_url = result.url as string;
        }

        return await this.cvTemplatesService.addTemplate({
            ...createTemplateCvDto,
            preview_url,
        });
    }
    @ApiOperation({ summary: 'sửa mẫu cv' })
    @UseGuards(JwtAuthGuard)
    @UseRoles('ADMIN')
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
        let preview_url = updateTemplateDto?.preview_url || '';
        if (thumnail) {
            const result = (await this.cloudinaryService.uploadFile(
                thumnail,
            )) as {
                url?: string;
            };
            preview_url = result.url as string;
        }
        const payload = { ...updateTemplateDto };
        if (preview_url) {
            payload.preview_url = preview_url;
        } else {
            delete payload.preview_url;
        }
        return await this.cvTemplatesService.editTemplate(id, {
            ...updateTemplateDto,
            preview_url,
        });
    }
}
