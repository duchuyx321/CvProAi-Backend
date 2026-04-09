import { Injectable, Inject } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    constructor(
        @Inject('CLOUDINARY')
        private readonly cloudinary: typeof Cloudinary,
    ) {}
    private extractPublicId(url: string): string {
        // Ví dụ URL: https://res.cloudinary.com/demo/image/upload/v1234/cvproai/abc.jpg
        const parts = url.split('/');
        const filename = parts.pop()?.split('.')[0]; // Lấy 'abc'
        const folder = 'cvproai'; // Folder bạn đã đặt lúc upload
        return `${folder}/${filename}`;
    }
    private async uploadCore(
        file: Express.Multer.File,
        options: {
            folder: string;
            public_id?: string;
            overwrite?: boolean;
            resource_type?: 'image' | 'raw' | 'auto';
        },
    ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return new Promise<any>((resolve, reject) => {
            const stream = this.cloudinary.uploader.upload_stream(
                {
                    folder: options.folder,
                    public_id: options.public_id,
                    overwrite: options.overwrite,
                    resource_type: options.resource_type || 'auto',
                },
                (error, result) => {
                    if (error) return reject(new Error(error.message));
                    resolve(result);
                },
            );

            stream.end(file.buffer);
        });
    }

    async uploadFile(file: Express.Multer.File) {
        return await new Promise((resolve, reject) => {
            const stream = this.cloudinary.uploader.upload_stream(
                { resource_type: 'image', folder: 'cvproai' },
                (error, result) => {
                    if (error) return reject(new Error(error.message));
                    resolve(result);
                },
            );
            stream.end(file.buffer);
        });
    }
    async replaceCV(oldPublicId: string, file: Express.Multer.File) {
        if (oldPublicId) {
            await this.cloudinary.uploader.destroy(oldPublicId, {
                resource_type: 'raw',
            });
        }

        const folder = oldPublicId
            ? oldPublicId.split('/').slice(0, -1).join('/')
            : 'users/default/cv';

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this.uploadCore(file, {
            folder,
            resource_type: 'raw',
        });
    }

    async deleteByUrl(url: string) {
        if (!url) return;

        const publicId = this.extractPublicId(url);

        // Đoán resource_type dựa trên đuôi file
        const isRaw = url.match(/\.(pdf|docx|zip|xlsx|txt|csv)$/i);
        const resourceType = isRaw ? 'raw' : 'image';

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return await this.cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    }
    async deleteMultiple(publicIds: string[]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return await Promise.all(publicIds.map((id) => this.deleteByUrl(id)));
    }
}
