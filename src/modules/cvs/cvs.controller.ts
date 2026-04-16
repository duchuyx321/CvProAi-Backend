/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Res,
    Req,
    StreamableFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { CvsService } from './cvs.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '~/modules/auth/guards';
import { CreateCVSDto, CVContent } from './dto/create-cvs.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '~/modules/cloudinary/cloudinary.service';
import { UpdateCVSDto } from './dto/update-cvs.dto';
import { ExportCvsDto } from './dto/export-cvs.dto';

@ApiTags('cv cá nhân')
@UseGuards(JwtAuthGuard)
@Controller('cvs')
export class CvsController {
    constructor(
        private readonly cvsService: CvsService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}
    @ApiOperation({ summary: 'Lấy danh sách cv cá nhân' })
    @Get('me')
    async getAllCvByMe(
        @Req() req: Request,
        @Query('limit') limit?: number,
        @Query('page') page?: number,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return this.cvsService.getAllTemplateCV(
            user_id,
            Number(limit) || 8,
            Number(page) || 1,
        );
    }
    @ApiOperation({ summary: 'Xem chi tiết cv cá nhân theo slug' })
    @Get('me/:slug')
    async getCvMeBySlug(@Req() req: Request, @Param('slug') slug: string) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return this.cvsService.getCvMeSlug(user_id, slug);
    }
    @ApiOperation({ summary: 'Tạo Cv cá nhân' })
    @Post('add')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'avatar', maxCount: 1 },
                { name: 'thumbnail', maxCount: 1 },
            ],
            {
                storage: memoryStorage(),
            },
        ),
    )
    async addCv(
        @Req() req: Request,
        @UploadedFiles()
        files: {
            avatar?: Express.Multer.File[];
            thumbnail?: Express.Multer.File[];
        },
        @Body() createCVSDto: CreateCVSDto,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        const avatar = files?.avatar?.[0];
        const thumbnail = files?.thumbnail?.[0];

        const [avatarUpload, thumbnailUpload] = await Promise.all([
            avatar ? this.cloudinaryService.uploadFile(avatar) : null,
            thumbnail ? this.cloudinaryService.uploadFile(thumbnail) : null,
        ]);
        if (avatarUpload) {
            if (!createCVSDto.content) {
                createCVSDto.content = {} as CVContent;
            }
            if (!createCVSDto.content.profile_header) {
                createCVSDto.content.profile_header = {
                    full_name: '',
                    headline: '',
                };
            }
            createCVSDto.content.profile_header.avatar_url =
                avatarUpload['url'];
        }
        if (thumbnailUpload) {
            createCVSDto.preview_url = thumbnailUpload['url'];
        }
        return this.cvsService.addCv(user_id, createCVSDto);
    }

    @ApiOperation({ summary: 'chỉnh sửa Cv cá nhân' })
    @Patch('edit/:id')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'avatar', maxCount: 1 },
                { name: 'thumbnail', maxCount: 1 },
            ],
            {
                storage: memoryStorage(),
            },
        ),
    )
    async editCv(
        @Req() req: Request,
        @Param('id') id: string,
        @UploadedFiles()
        files: {
            avatar?: Express.Multer.File[];
            thumbnail?: Express.Multer.File[];
        },
        @Body() updateCVSDto: UpdateCVSDto,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        const avatar = files?.avatar?.[0];
        const thumbnail = files?.thumbnail?.[0];

        const [avatarUpload, thumbnailUpload] = await Promise.all([
            avatar ? this.cloudinaryService.uploadFile(avatar) : null,
            thumbnail ? this.cloudinaryService.uploadFile(thumbnail) : null,
        ]);
        if (avatarUpload) {
            if (!updateCVSDto.content) {
                updateCVSDto.content = {} as CVContent;
            }

            if (!updateCVSDto.content.profile_header) {
                updateCVSDto.content.profile_header = {
                    full_name: '',
                    headline: '',
                };
            }

            updateCVSDto.content.profile_header.avatar_url =
                avatarUpload['url'];
        } else {
            const avatarUrl = updateCVSDto.content?.profile_header?.avatar_url;

            if (avatarUrl === '' && updateCVSDto.content?.profile_header) {
                delete updateCVSDto.content.profile_header.avatar_url;
            }
        }
        if (thumbnailUpload) {
            updateCVSDto.preview_url = thumbnailUpload['url'];
        } else if (updateCVSDto?.preview_url === '') {
            delete updateCVSDto.preview_url;
        }
        return this.cvsService.editCv(user_id, id, updateCVSDto);
    }

    @ApiOperation({ summary: 'Xuất file pdf' })
    @Post('export/:cvID')
    async exportCV(
        @Req() req: Request,
        @Param('cvID') cvID: string,
        @Body() exportCvsDto: ExportCvsDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        const result = await this.cvsService.exportCv(
            cvID,
            user_id,
            exportCvsDto,
        );
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${result.fileName}"`,
        });

        return new StreamableFile(result.buffer);
    }
}
