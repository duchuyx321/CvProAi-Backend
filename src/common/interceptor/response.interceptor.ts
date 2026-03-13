/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '~/common/interface';

export interface Response<T> {
    data: T;
}
// custom message resqonse
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
    T,
    ApiResponse<T>
> {
    private getDefaultMessage(method: string): string {
        switch (method) {
            case 'POST':
                return 'Tạo mới thành công.';
            case 'PATCH':
                return 'Cập nhật thành công.';
            case 'DELETE':
                return 'Xóa thành công';
            case 'GET':
                return 'Lấy dữ liệu thành công';
            default:
                return 'Yêu cầu đã hoàn thành';
        }
    }
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        const request = context.switchToHttp().getRequest();
        return next.handle().pipe(
            map((data: any) => {
                // data dùng yêu cầu
                if (data && typeof data === 'object' && 'success' in data) {
                    return data as ApiResponse<T>;
                }
                let findMessage: string = this.getDefaultMessage(
                    request.method,
                );
                // nếu có message trả về
                if (data && typeof data === 'object' && 'message' in data) {
                    findMessage = data.message as string;
                    // delete data.message;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { message, ...rest } = data;
                    data = Object.keys(rest).length > 0 ? rest : undefined;
                }
                // tránh lồng data với nhau
                if (data && typeof data === 'object' && 'data' in data) {
                    data = data.data as T;
                }
                return {
                    success: true,
                    messsage: findMessage,
                    data,
                    date: new Date().toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        hour12: false,
                    }),
                    path: request.url,
                };
            }),
        );
    }
}
