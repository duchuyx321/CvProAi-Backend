/* eslint-disable @typescript-eslint/no-unsafe-return */
import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsDate,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

export { UseRoles } from '~/common/decorators/roles.decorator';

export const StringRequired = (
    name: string,
    minLength?: number,
    maxLength?: number,
) =>
    applyDecorators(
        ApiProperty({
            required: true,
            description: `${name} là bắt buộc`,
        }),
        IsString({ message: `${name} phải là chuỗi!` }),
        IsNotEmpty({ message: `${name} không được bỏ trống!` }),
        ...(minLength !== undefined
            ? [
                  MinLength(minLength, {
                      message: `${name} phải có ít nhất ${minLength} ký tự!`,
                  }),
              ]
            : []),
        ...(maxLength !== undefined
            ? [
                  MaxLength(maxLength, {
                      message: `${name} không được vượt quá ${maxLength} ký tự!`,
                  }),
              ]
            : []),
    );

export const StringNotRequired = (
    name: string,
    minLength?: number,
    maxLength?: number,
) =>
    applyDecorators(
        ApiProperty({
            required: false,
            description: `${name} không bắt buộc`,
        }),
        IsString({ message: `${name} phải là chuỗi!` }),
        IsOptional(),
        ...(minLength !== undefined
            ? [
                  MinLength(minLength, {
                      message: `${name} phải có ít nhất ${minLength} ký tự!`,
                  }),
              ]
            : []),
        ...(maxLength !== undefined
            ? [
                  MaxLength(maxLength, {
                      message: `${name} không được vượt quá ${maxLength} ký tự!`,
                  }),
              ]
            : []),
    );

export const NumberRequired = (name: string, min = 0) =>
    applyDecorators(
        ApiProperty({
            required: true,
            description: `${name} là bắt buộc`,
        }),
        IsNumber({}, { message: `${name} phải là số!` }),
        IsNotEmpty({ message: `${name} không được bỏ trống!` }),
        Type(() => Number),
        Min(min, { message: `${name} phải lớn hơn hoặc bằng ${min}` }),
    );
export const NumberNotRequired = (name: string) =>
    applyDecorators(
        ApiProperty({
            required: false,
            description: `${name} không bắt buộc`,
        }),
        IsNumber({}, { message: `${name} phải là số!` }),
        IsOptional(),
    );

export const BooleanRequired = (name: string) =>
    applyDecorators(
        ApiProperty({
            required: true,
            description: `${name} là bắt buộc`,
        }),
        IsBoolean({ message: `${name} phải là boolean!` }),
        IsNotEmpty({ message: `${name} không được bỏ trống!` }),
    );

export const BooleanNotRequired = (name: string) =>
    applyDecorators(
        ApiProperty({
            required: false,
            description: `${name} không bắt buộc`,
        }),
        IsBoolean({ message: `${name} phải là boolean!` }),
        IsOptional(),
    );

export const EnumRequired = (name: string, enumType: object) =>
    applyDecorators(
        ApiProperty({
            required: true,
            description: `${name} là bắt buộc`,
        }),
        IsEnum(enumType, { message: `${name} không hợp lệ!` }),
        IsNotEmpty({ message: `${name} không được bỏ trống!` }),
    );

export const EnumNotRequired = (name: string, enumType: object) =>
    applyDecorators(
        ApiProperty({
            required: false,
            description: `${name} không bắt buộc`,
        }),
        IsEnum(enumType, { message: `${name} không hợp lệ!` }),
        IsOptional(),
    );

export const ObjectRequired = (name: string) =>
    applyDecorators(
        ApiProperty({
            required: true,
            description: `${name} là bắt buộc`,
        }),
        IsObject({ message: `${name} phải là object!` }),
        IsNotEmpty({ message: `${name} không được bỏ trống!` }),
    );

export const ObjectNotRequired = (name: string) =>
    applyDecorators(
        ApiProperty({
            required: false,
            description: `${name} không bắt buộc`,
        }),
        IsObject({ message: `${name} phải là object!` }),
        IsOptional(),
    );

export const RegexRequired = (name: string, pattern: RegExp) =>
    applyDecorators(
        ApiProperty({
            required: true,
            description: `${name} là bắt buộc`,
        }),
        Matches(pattern, { message: `${name} không hợp lệ!` }),
        IsNotEmpty({ message: `${name} không được bỏ trống!` }),
    );
export const RegexNotRequired = (name: string, pattern: RegExp) =>
    applyDecorators(
        ApiProperty({
            required: false,
            description: `${name} không bắt buộc`,
        }),
        Matches(pattern, { message: `${name} không hợp lệ!` }),
        IsOptional(),
    );
export const DateRequired = (name: string) =>
    applyDecorators(
        ApiProperty({
            required: true,
            description: `${name} là bắt buộc`,
        }),
        IsDate({ message: `${name} phải là date!` }),
        IsNotEmpty({ message: `${name} không được bỏ trống!` }),
    );

export const DateNotRequired = (name: string) =>
    applyDecorators(
        ApiProperty({
            required: false,
            description: `${name} không bắt buộc`,
        }),
        IsDate({ message: `${name} phải là date!` }),
        IsOptional(),
    );

export const TransformToJson = () =>
    Transform(({ value }) => {
        if (value === undefined || value === null || value === '') {
            return value;
        }

        if (typeof value === 'object') {
            return value;
        }

        try {
            return JSON.parse(value);
        } catch {
            throw new Error('Dữ liệu JSON không hợp lệ.');
        }
    });
