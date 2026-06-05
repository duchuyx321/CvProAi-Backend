import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = () => {
    const config = new DocumentBuilder()
        .setTitle('CvProAi example')
        .setDescription('Xây dựng API cho CvProAi')
        .setVersion('1.0')
        .build();
    return config;
};
