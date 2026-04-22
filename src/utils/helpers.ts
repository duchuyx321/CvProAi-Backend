import { randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

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
    static generateOTP(length: number = 6): string {
        let code = '';
        const chars =
            'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        for (let i = 0; i < length; i++) {
            code += chars[randomInt(0, chars.length)];
        }

        return code;
    }
    static generateResetPass(): string {
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const number = '0123456789';
        const special = '!@#$%^&*';
        const all = lower + upper + number + special;
        const pick = (chars: string) => chars[randomInt(chars.length)];
        const pass = [
            pick(lower),
            pick(upper),
            pick(number),
            pick(special),
            ...Array.from({ length: 4 }, () => pick(all)),
        ];
        for (let i = pass.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [pass[i], pass[j]] = [pass[j], pass[i]];
        }
        return pass.join('');
    }
    static hashValue(value: string) {
        return bcrypt.hashSync(value, 10);
    }
    static RegexValidate = {
        email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/,
        otp: /^[A-HJ-NP-Za-km-z2-9]{6}$/,
    };

    static isCheckoutExpired(created_at: Date) {
        return dayjs().isAfter(dayjs(created_at).add(15, 'minute'));
    }
    static isAcceptPaymentExpired(created_at: Date) {
        return dayjs().isAfter(dayjs(created_at).add(48, 'hour'));
    }
    static TransferCode(value: string): string {
        return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }
    static formatOrderCodeFromTransferCode(value?: string): string | null {
        if (!value) return null;

        const match = value
            .toUpperCase()
            .match(/\bCVPROAI[-\s]?(SUB|ADD|BTH)[-\s]?([A-Z0-9]+)\b/);

        if (!match) return null;

        const [, type, code] = match;
        return `CVPROAI-${type}-${code}`;
    }
}
