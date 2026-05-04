/* eslint-disable no-case-declarations */
import { randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

type Mode = 'DAILY' | 'PARITY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
export interface Buckets {
    label: string;
    formDate: Date;
    toDate: Date;
}
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

    static calculateGrowthPercent(current: number, previous: number): number {
        if (previous === 0) {
            return current > 0 ? 100 : 0;
        }

        return Number((((current - previous) / previous) * 100).toFixed(1));
    }
    static diffDays(formDate: Date, toDate: Date) {
        const start = new Date(formDate);
        const end = new Date(toDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }
    static getModeDate(totalDate: number): Mode {
        if (totalDate <= 7) return 'DAILY';
        if (totalDate <= 14) return 'PARITY';
        if (totalDate <= 31) return 'WEEKLY';
        if (totalDate <= 123) return 'MONTHLY';
        return 'QUARTERLY';
    }
    static addDays = (date: Date, days: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    };
    static mapToBucket(formDate: Date, toDate: Date) {
        const totalDate = this.diffDays(formDate, toDate);
        const mode = this.getModeDate(totalDate);
        const buckets: Buckets[] = [];
        switch (mode) {
            case 'DAILY':
                for (let i = 0; i < totalDate; i++) {
                    const current = this.addDays(formDate, i);
                    buckets.push({
                        label: `D${i + 1}`,
                        formDate: current,
                        toDate: current,
                    });
                }
                break;
            case 'PARITY':
                const isTotalEven: boolean = totalDate % 2 === 0;
                for (let i = 0; i < totalDate; i++) {
                    const curren = this.addDays(formDate, i);
                    const dayNumber = i + 1;
                    const shouldPush = isTotalEven
                        ? dayNumber % 2 === 0
                        : dayNumber % 2 !== 0;
                    if (shouldPush) {
                        buckets.push({
                            label: `P${dayNumber}`,
                            formDate: curren,
                            toDate: curren,
                        });
                    }
                }
                break;
            case 'WEEKLY':
                for (let i = 0; i < 4; i++) {
                    const statrtDate = i * 7;
                    if (statrtDate >= totalDate) break;
                    const isLastBucket = i === 3;
                    buckets.push({
                        label: `W${i + 1}`,
                        formDate: this.addDays(formDate, statrtDate),
                        toDate: isLastBucket
                            ? this.addDays(formDate, totalDate)
                            : this.addDays(formDate, statrtDate + 6),
                    });
                    if (isLastBucket) break;
                }
                break;
            case 'MONTHLY':
                const current = new Date(formDate);
                current.setDate(1);
                while (current <= toDate) {
                    let start = new Date(current);
                    if (start < formDate) {
                        start = new Date(formDate);
                    }
                    let end = new Date(
                        current.getFullYear(),
                        current.getMonth() + 1,
                        0,
                    );
                    if (end > toDate) {
                        end = new Date(toDate);
                    }
                    buckets.push({
                        label: `T${current.getMonth() + 1}`,
                        formDate: start,
                        toDate: end,
                    });
                    current.setMonth(current.getMonth() + 1);
                }
                break;
            case 'QUARTERLY':
                const currentQuarte = new Date(formDate);
                const startMonthOfQuarter =
                    Math.floor(currentQuarte.getMonth() / 3) * 3;
                currentQuarte.setMonth(startMonthOfQuarter);
                currentQuarte.setDate(1);
                while (currentQuarte <= toDate) {
                    let bStart = new Date(currentQuarte);
                    if (bStart < formDate) bStart = new Date(formDate);
                    let bEnd = new Date(
                        currentQuarte.getFullYear(),
                        currentQuarte.getMonth() + 3,
                        0,
                    );
                    if (bEnd > toDate) bEnd = new Date(toDate);
                    const quarterIdx =
                        Math.floor(currentQuarte.getMonth() / 3) + 1;
                    buckets.push({
                        label: `Q${quarterIdx}`,
                        formDate: bStart,
                        toDate: bEnd,
                    });
                    currentQuarte.setMonth(currentQuarte.getMonth() + 3);
                }
                break;
        }

        return buckets;
    }
}
