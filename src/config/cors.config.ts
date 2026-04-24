import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export const configCors = (): CorsOptions => {
    const configService = new ConfigService();
    const isProd = configService.get<string>('NODE_ENV') === 'development';
    const hostAllow = configService.get<string>(
        isProd ? 'URI_CLIENT_LOCAL' : 'URI_CLIENT_PRODUCT',
    );
    const allowedOrigins = hostAllow
        ? hostAllow.split(',').map((item) => item.trim())
        : [];

    return {
        origin: (origin, callback) => {
            // Cho phép request không có origin như Postman, mobile app, server-to-server
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error(`CORS blocked for origin: ${origin}`),
                false,
            );
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
    };
};

export const configHTML = (accessToken: string) => {
    const configService = new ConfigService();
    const isProd = configService.get<string>('NODE_ENV') === 'development';
    const hostAllow = configService.get<string>(
        isProd ? 'URI_CLIENT_LOCAL' : 'URI_CLIENT_PRODUCT',
    );
    const html = `
        <!doctype html>
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage(
                  {
                    type: 'GOOGLE_LOGIN_SUCCESS',
                    data: {
                      accessToken: ${JSON.stringify(accessToken)},
                    },
                  },
                  ${JSON.stringify(hostAllow)}
                );
              }
              window.close();
            </script>
          </body>
        </html>
        `;
    return html;
};
