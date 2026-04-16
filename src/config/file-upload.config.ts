import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const DOCUMENT_FILE_SIZE_LIMIT = 3 * 1024 * 1024;

export const DOCUMENT_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const documentUploadConfig: MulterOptions = {
    limits: {
        fileSize: DOCUMENT_FILE_SIZE_LIMIT,
    },
    fileFilter(req, file, callback) {
        if (
            !DOCUMENT_MIME_TYPES.includes(
                file.mimetype as (typeof DOCUMENT_MIME_TYPES)[number],
            )
        ) {
            return callback(
                new BadRequestException('Chỉ cho phép file PDF/DOC/DOCX'),
                false,
            );
        }

        return callback(null, true);
    },
};
