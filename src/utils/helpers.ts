export class Helper {
    static makeSlugFromString(text: string): string {
        return text
            .toLowerCase()
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // xoá dấu
            .trim()
            .replace(/[^a-z0-9\s]/g, '') // xoá ký tự đặc biệt
            .replace(/\s+/g, '-') // space -> -
            .replace(/-+/g, '-'); // tránh --
    }
}
