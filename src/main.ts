/* eslint-disable @typescript-eslint/no-floating-promises */
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '~/app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = new ConfigService();
    const port = configService.get<number>('PORT')
        ? Number(configService.get<number>('PORT'))
        : 5000;
    console.log(`server started on port ${port}`);
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
