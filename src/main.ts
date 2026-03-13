/* eslint-disable @typescript-eslint/no-floating-promises */
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '~/app.module';
import { TransformInterceptor } from '~/common/interceptor/response.interceptor';
import { AllExceptionFilter } from '~/common/filter/all-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // loại bỏ các trường dư trong payload(dto)
            forbidNonWhitelisted: true, //bảo lỗi khi có field không cần thiết trong payload
            transform: true, // chuyển payload thành instance của dto
        }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionFilter());
    const configService = new ConfigService();
    const port = configService.get<number>('PORT')
        ? Number(configService.get<number>('PORT'))
        : 5000;
    console.log(`server started on port ${port}`);
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
