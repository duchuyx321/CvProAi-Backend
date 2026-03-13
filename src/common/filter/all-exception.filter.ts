/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '~/common/interface';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionFilter.name);
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>(); // dữ liệu trả về
        const request = ctx.getRequest<Request>(); // dữ liệu gửi lên
        let status: number;
        let message: string = 'Có lỗi xảy ra.';
        let error: any;
        // khi lỗi biết trước (lỗi HTTP)
        if (exception instanceof HttpException) // instance
        {
            status = exception.getStatus();
            const exceptionRespone = exception.getResponse();
            if (typeof exceptionRespone === 'string') {
                message = exceptionRespone;
            } else if (typeof exceptionRespone === 'object') {
                const exceptionResponeObj = exceptionRespone as Record<
                    string,
                    any
                >;
                message =
                    exceptionResponeObj.message ||
                    exceptionResponeObj.error ||
                    'Có lỗi xảy ra.';
                // lỗi validate DTO
                if (Array.isArray(exceptionResponeObj.message)) {
                    message = 'Dữ liệu không hợp lệ.';
                    error = exceptionResponeObj.message;
                }
            }
        } else {
            // lỗi ngoài ý muốn
            status = HttpStatus.INTERNAL_SERVER_ERROR; // lỗi 500
            message = 'Hệ thống đang có lỗi';
            this.logger.error(exception);
        }
        const errResponse: ApiResponse<any> = {
            success: false,
            message,
            ...(error && { error }),
            date: new Date().toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour12: false,
            }),
            path: request.url,
        };
        response.status(status).json(errResponse);
    }
}
