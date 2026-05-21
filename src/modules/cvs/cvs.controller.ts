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
    Delete,
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

    // [GET] --/cvs/me
    @ApiOperation({ summary: 'Lấy danh sách cv cá nhân' })
    @Get('me')
    async getAllCvByMe(
        @Req() req: Request,
        @Query('limit') limit?: number,
        @Query('page') page?: number,
        @Query('search') search?: string,
        @Query('sort_by') sort_by?: 'created_at' | 'updated_at' | 'title',
        @Query('sort_order') sort_order?: 'ASC' | 'DESC',
        @Query('is_trash') is_trash: boolean = false,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        const allowedSortBy = ['created_at', 'updated_at', 'title'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const finalSortBy = allowedSortBy.includes(sort_by ?? 'updated_at')
            ? sort_by
            : 'updated_at';
        const finalSortOrder = allowedSortOrder.includes(sort_order ?? 'DESC')
            ? sort_order
            : 'DESC';
        const { message, data, meta } = await this.cvsService.getAllCVMe(
            user_id,
            Number(limit) || 8,
            Number(page) || 1,
            search,
            finalSortBy || 'updated_at',
            finalSortOrder || 'DESC',
            is_trash || false,
        );
        return {
            message,
            data: {
                data,
                meta,
            },
        };
    }

    // [GET] --/cvs/me/:slug
    @ApiOperation({ summary: 'Xem chi tiết cv cá nhân theo slug' })
    @Get('me/:slug')
    async getCvMeBySlug(@Req() req: Request, @Param('slug') slug: string) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return this.cvsService.getCvMeSlug(user_id, slug);
    }

    // [POST] --/cvs/add
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

    // [PATCH] --/cvs/edit/:id
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
    // [POST] --/cvs/edit/:id
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
    @ApiOperation({ summary: 'Khôi phục Cv đã xóa' })
    @Patch('restore/:id')
    // khôi phục
    async restore(@Param('id') id: string, @Req() req: Request) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return this.cvsService.restoreCvMe(user_id, id);
    }
    // xóa mềm
    @ApiOperation({ summary: 'xóa mềm Cv đã xóa' })
    @Delete('delete/:id')
    async delete(@Param('id') id: string, @Req() req: Request) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return this.cvsService.deleteCvMe(user_id, id);
    }

    // xóa vĩnh viễn
    @ApiOperation({ summary: 'xóa vĩnh viễn Cv đã xóa' })
    @Delete('destroy/:id')
    async destry(@Param('id') id: string, @Req() req: Request) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return this.cvsService.destroyCvMe(user_id, id);
    }
}
