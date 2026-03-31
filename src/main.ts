/* eslint-disable @typescript-eslint/no-floating-promises */
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from '~/app.module';
import { TransformInterceptor } from '~/common/interceptor/response.interceptor';
import { AllExceptionFilter } from '~/common/filter/all-exception.filter';
import { swaggerConfig } from '~/config/swagger.config';
import { SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // loại bỏ các trường dư trong payload(dto)
            forbidNonWhitelisted: true, //bảo lỗi khi có field không cần thiết trong payload
            transform: true, // chuyển payload thành instance của dto
        }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionFilter());
    //set up version api
    app.setGlobalPrefix('api/v1');
    // swagger
    const config = swaggerConfig();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, documentFactory);
    // log
    const configService = new ConfigService();
    const URI_SERVER = configService.get<string>('URI_SERVER');
    Logger.log(`Swagger running on ${URI_SERVER}/api/v1/docs`);
    const port = configService.get<number>('PORT')
        ? Number(configService.get<number>('PORT'))
        : 5000;
    Logger.log(`server started on port ${port}`);
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
