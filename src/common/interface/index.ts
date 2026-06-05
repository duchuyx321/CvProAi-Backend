export interface ApiResponse<T> {
    success: boolean;
    messsage: string;
    data?: T;
    date?: Date | string;
    path?: string;
}
