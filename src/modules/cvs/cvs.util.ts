/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import { CVContent } from './dto/create-cvs.dto';

export function applyProposalToCvContent(cvContent: CVContent, proposal: any) {
    validateProposalBeforeApply(proposal);

    const action = proposal.action;
    const targetPath = normalizeTargetPath(
        proposal.target_path ?? proposal.target_section,
        proposal,
    );

    if (!targetPath) {
        throw new BadRequestException(
            `Proposal ${proposal.id} không có target_path`,
        );
    }

    validateTargetPath(targetPath, proposal);

    if (action === 'replace') {
        return replaceCvContentByProposal(cvContent, targetPath, proposal);
    }

    if (action === 'add') {
        return addCvContentByProposal(cvContent, targetPath, proposal);
    }

    throw new BadRequestException(
        `Proposal ${proposal.id} có action không hợp lệ`,
    );
}

export function validateProposalBeforeApply(proposal: any) {
    if (!proposal || typeof proposal !== 'object') {
        throw new BadRequestException('Proposal không hợp lệ');
    }

    if (!proposal.id || typeof proposal.id !== 'string') {
        throw new BadRequestException('Proposal không có id hợp lệ');
    }

    if (!['add', 'replace'].includes(proposal.action)) {
        throw new BadRequestException(
            `Proposal ${proposal.id} có action không hợp lệ`,
        );
    }

    if (proposal.status && proposal.status !== 'pending') {
        throw new BadRequestException(
            `Proposal ${proposal.id} không còn ở trạng thái pending`,
        );
    }

    if (
        proposal.new_text === undefined ||
        proposal.new_text === null ||
        String(proposal.new_text).trim() === ''
    ) {
        throw new BadRequestException(
            `Proposal ${proposal.id} không có new_text hợp lệ`,
        );
    }
}

export function normalizeTargetPath(targetPath: string, proposal?: any) {
    if (!targetPath || typeof targetPath !== 'string') return '';

    let normalized = targetPath.trim();

    const rootMap: Record<string, string> = {
        SUMMARY: 'SUMMARY',
        SKILL: 'SKILLS',
        SKILLS: 'SKILLS',
        EXPERIENCE: 'EXPERIENCE',
        EXPERIENCES: 'EXPERIENCE',
        PROJECT: 'PROJECTS',
        PROJECTS: 'PROJECTS',
        EDUCATION: 'EDUCATION',
        EDUCATIONS: 'EDUCATION',
        CERTIFICATION: 'CERTIFICATIONS',
        CERTIFICATIONS: 'CERTIFICATIONS',
        LANGUAGE: 'LANGUAGES',
        LANGUAGES: 'LANGUAGES',
        AWARD: 'AWARDS',
        AWARDS: 'AWARDS',
        INTEREST: 'INTERESTS',
        INTERESTS: 'INTERESTS',
        // lowercase variants
        summary: 'SUMMARY',
        skill: 'SKILLS',
        skills: 'SKILLS',
        experience: 'EXPERIENCE',
        experiences: 'EXPERIENCE',
        project: 'PROJECTS',
        projects: 'PROJECTS',
        education: 'EDUCATION',
        certifications: 'CERTIFICATIONS',
        languages: 'LANGUAGES',
        awards: 'AWARDS',
        interests: 'INTERESTS',
    };

    const match = normalized.match(/^([a-zA-Z_]+)(.*)$/);

    if (match) {
        const rawRoot = match[1];
        const restPath = match[2] ?? '';
        const mappedRoot = rootMap[rawRoot.toUpperCase()] ?? rootMap[rawRoot];

        if (mappedRoot) {
            normalized = `${mappedRoot}${restPath}`;
        }
    }

    if (
        proposal?.action === 'add' &&
        proposal?.insert_position === 'append' &&
        /^SKILLS\[\d+\]$/i.test(normalized)
    ) {
        normalized = 'SKILLS';
    }

    return normalized;
}
export function validateTargetPath(targetPath: string, proposal: any) {
    const allowedRoots = [
        'SUMMARY',
        'SKILLS',
        'EXPERIENCE',
        'PROJECTS',
        'EDUCATION',
        'CERTIFICATIONS',
        'LANGUAGES',
        'AWARDS',
        'INTERESTS',
        // giữ lowercase phòng CV cũ lưu lowercase
        'summary',
        'skills',
        'experience',
        'projects',
        'education',
        'certifications',
        'languages',
        'awards',
        'interests',
    ];

    const root = targetPath.split(/[.[\]]/).filter(Boolean)[0];

    if (!root || !allowedRoots.includes(root)) {
        throw new BadRequestException(
            `Proposal ${proposal.id} có target_path không được phép: ${targetPath}`,
        );
    }

    if (
        targetPath.includes('__proto__') ||
        targetPath.includes('constructor') ||
        targetPath.includes('prototype')
    ) {
        throw new BadRequestException(
            `Proposal ${proposal.id} có target_path không an toàn`,
        );
    }
}

export function parsePath(path: string): Array<string | number> {
    if (!path || typeof path !== 'string') {
        return [];
    }

    return path
        .replace(/\[(\d+)\]/g, '.$1')
        .split('.')
        .filter(Boolean)
        .map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

export function getValueByPath(obj: any, path: string) {
    const parts = parsePath(path);

    if (parts.length === 0) return undefined;

    return parts.reduce((current, part) => {
        if (current === undefined || current === null) {
            return undefined;
        }

        return current[part];
    }, obj);
}

/**
 * Strict: chỉ set nếu path đã tồn tại.
 * Không tự tạo field mới để tránh AI trả sai path làm hỏng cấu trúc CV.
 */
export function setValueByPathStrict(obj: any, path: string, value: any) {
    const parts = parsePath(path);

    if (parts.length === 0) {
        throw new BadRequestException(`target_path không hợp lệ: ${path}`);
    }

    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];

        if (current?.[part] === undefined || current?.[part] === null) {
            throw new BadRequestException(
                `Không tìm thấy vị trí cần sửa: ${path}`,
            );
        }

        current = current[part];
    }

    const lastPart = parts[parts.length - 1];

    if (current?.[lastPart] === undefined || current?.[lastPart] === null) {
        throw new BadRequestException(`Không tìm thấy field cần sửa: ${path}`);
    }

    current[lastPart] = value;

    return obj;
}

export function normalizeTextForCompare(value: unknown): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(value ?? '')
        .replace(/\r\n/g, '\n')
        .replace(/^[\-•–]\s*/gm, '') // strip bullet đầu dòng
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*[-–]\s+/g, ' ') // strip "- " còn sót giữa câu
        .trim()
        .toLowerCase();
}

export function replaceCvContentByProposal(
    cvContent: any,
    targetPath: string,
    proposal: any,
) {
    const currentValue = getValueByPath(cvContent, targetPath);

    if (currentValue === undefined || currentValue === null) {
        throw new BadRequestException(
            `Không tìm thấy vị trí cần sửa: ${targetPath}`,
        );
    }

    if (typeof currentValue !== 'string') {
        throw new BadRequestException(
            `Vị trí ${targetPath} không phải dạng text nên không thể replace`,
        );
    }

    const oldText = proposal.old_text ? String(proposal.old_text).trim() : '';
    const newText = String(proposal.new_text).trim();

    if (!newText) {
        throw new BadRequestException(
            `Proposal ${proposal.id} không có new_text hợp lệ`,
        );
    }

    const normalizedCurrent = normalizeTextForCompare(currentValue);
    const normalizedOld = normalizeTextForCompare(oldText);
    const normalizedNew = normalizeTextForCompare(newText);

    // ✅ Đã apply rồi — bỏ qua
    if (normalizedCurrent === normalizedNew) {
        return cvContent;
    }

    // ✅ Full match — replace toàn bộ field
    if (!oldText || normalizedCurrent === normalizedOld) {
        return setValueByPathStrict(cvContent, targetPath, newText);
    }

    // ✅ NEW: Partial match — old_text là một đoạn con trong currentValue
    if (normalizedOld && normalizedCurrent.includes(normalizedOld)) {
        const updatedValue = normalizedCurrent.replace(
            normalizedOld,
            normalizedNew,
        );
        return setValueByPathStrict(cvContent, targetPath, updatedValue);
    }

    // ✅ NEW: new_text đã tồn tại trong currentValue — coi như đã apply
    if (normalizedOld && normalizedCurrent.includes(normalizedNew)) {
        return cvContent;
    }

    // ❌ Thực sự mismatch
    console.log('[applyProposal] old_text mismatch', {
        proposalId: proposal.id,
        targetPath,
        normalizedCurrent,
        normalizedOld,
        normalizedNew,
    });

    throw new BadRequestException(
        `Nội dung CV tại ${targetPath} đã thay đổi, vui lòng phân tích lại trước khi apply`,
    );
}

export function addCvContentByProposal(
    cvContent: any,
    targetPath: string,
    proposal: any,
) {
    const newText = String(proposal.new_text).trim();

    if (!newText) {
        throw new BadRequestException(
            `Proposal ${proposal.id} không có new_text`,
        );
    }

    let currentValue = getValueByPath(cvContent, targetPath);
    let finalTargetPath = targetPath;

    if (currentValue === undefined || currentValue === null) {
        const resolvedPath = resolveExistingSectionPath(cvContent, targetPath);
        if (resolvedPath) {
            finalTargetPath = resolvedPath;
            currentValue = getValueByPath(cvContent, finalTargetPath);
        }
    }

    // ✅ Thêm: nếu path trỏ đến field cụ thể trong object (vd: experience[0].description)
    // mà field đó undefined/null → thử set trực tiếp nếu object cha tồn tại
    if (currentValue === undefined || currentValue === null) {
        const parentPath = targetPath.replace(/\.[^.]+$/, '');
        if (parentPath !== targetPath) {
            const parentValue = getValueByPath(cvContent, parentPath);
            if (
                parentValue &&
                typeof parentValue === 'object' &&
                !Array.isArray(parentValue)
            ) {
                console.warn(
                    `[addProposal] Field không tồn tại tại ${targetPath}, tạo mới field trong object cha`,
                );
                return setValueByPathUnsafe(cvContent, targetPath, newText); // ← dùng unsafe
            }
        }
    }

    // ✅ Thêm: nếu path trỏ đến string field đã có (vd: experience[0].description đang = "")
    // → append thay vì báo lỗi
    if (typeof currentValue === 'string') {
        if (currentValue.toLowerCase().includes(newText.toLowerCase())) {
            throw new BadRequestException(
                `Nội dung đề xuất đã tồn tại trong ${finalTargetPath}`,
            );
        }

        const updatedValue = currentValue.trim()
            ? `${currentValue.trim()}\n- ${newText}`
            : newText;

        return setValueByPathStrict(cvContent, finalTargetPath, updatedValue);
    }

    if (currentValue === undefined || currentValue === null) {
        if (!canCreateMissingRootSection(targetPath)) {
            throw new BadRequestException(
                `Không tìm thấy vị trí cần thêm: ${targetPath}`,
            );
        }

        cvContent[targetPath] = [];
        finalTargetPath = targetPath;
        currentValue = cvContent[targetPath];
    }

    if (Array.isArray(currentValue)) {
        if (arrayAlreadyContainsText(currentValue, newText)) {
            throw new BadRequestException(
                `Nội dung "${newText}" đã tồn tại trong ${finalTargetPath}`,
            );
        }

        currentValue.push(
            buildArrayItemBySection(finalTargetPath, currentValue, newText),
        );

        return cvContent;
    }

    throw new BadRequestException(
        `Không thể add proposal vào vị trí: ${finalTargetPath}`,
    );
}
// Thêm helper này
export function setValueByPathUnsafe(obj: any, path: string, value: any) {
    const parts = parsePath(path);
    if (parts.length === 0) return obj;

    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (current[part] === undefined || current[part] === null) {
            throw new BadRequestException(
                `Không tìm thấy object cha tại: ${path}`,
            );
        }
        current = current[part];
    }

    current[parts[parts.length - 1]] = value;
    return obj;
}
export function buildArrayItemBySection(
    targetPath: string,
    items: any[],
    newText: string,
) {
    const firstObjectItem = items.find(
        (item) => item && typeof item === 'object' && !Array.isArray(item),
    );

    if (firstObjectItem) {
        if ('description' in firstObjectItem) {
            return { description: newText };
        }

        if ('name' in firstObjectItem) {
            return { name: newText };
        }

        if ('title' in firstObjectItem) {
            return { title: newText };
        }

        if ('skill_name' in firstObjectItem) {
            return { skill_name: newText };
        }
    }

    const root = targetPath.split(/[.[\]]/).filter(Boolean)[0];

    if (root === 'skills') {
        return { name: newText };
    }

    if (root === 'projects') {
        return {
            name: newText,
            description: '',
        };
    }

    if (root === 'experience') {
        return {
            position: newText,
            company: '',
            description: '',
        };
    }

    if (root === 'education') {
        return {
            school: newText,
            major: '',
            description: '',
        };
    }

    if (root === 'certifications' || root === 'languages') {
        return { name: newText };
    }

    if (root === 'awards') {
        return { title: newText };
    }

    return newText;
}
export function resolveExistingSectionPath(cvContent: any, targetPath: string) {
    const root = targetPath.split(/[.[\]]/).filter(Boolean)[0];

    const sectionAliases: Record<string, string[]> = {
        SKILLS: ['SKILLS', 'skills', 'skill', 'SKILL'],
        EXPERIENCE: [
            'EXPERIENCE',
            'experience',
            'experiences',
            'work_experiences',
        ],
        EDUCATION: ['EDUCATION', 'education', 'educations'],
        PROJECTS: ['PROJECTS', 'projects', 'project'],
        CERTIFICATIONS: ['CERTIFICATIONS', 'certifications', 'certificates'],
        LANGUAGES: ['LANGUAGES', 'languages'],
        AWARDS: ['AWARDS', 'awards'],
        INTERESTS: ['INTERESTS', 'interests'],
        SUMMARY: ['SUMMARY', 'summary'],
        // lowercase keys trỏ về cùng alias list
        skills: ['SKILLS', 'skills', 'skill'],
        experience: ['EXPERIENCE', 'experience', 'experiences'],
        education: ['EDUCATION', 'education'],
        projects: ['PROJECTS', 'projects'],
        certifications: ['CERTIFICATIONS', 'certifications'],
        languages: ['LANGUAGES', 'languages'],
        awards: ['AWARDS', 'awards'],
        interests: ['INTERESTS', 'interests'],
        summary: ['SUMMARY', 'summary'],
    };

    const aliases = sectionAliases[root] ?? [];

    for (const alias of aliases) {
        const value = getValueByPath(cvContent, alias);
        if (value !== undefined && value !== null) {
            return alias;
        }
    }

    return '';
}

export function canCreateMissingRootSection(targetPath: string) {
    const parts = parsePath(targetPath);
    if (parts.length !== 1) return false;

    const allowed = [
        'SKILLS',
        'EXPERIENCE',
        'EDUCATION',
        'PROJECTS',
        'CERTIFICATIONS',
        'LANGUAGES',
        'AWARDS',
        'INTERESTS',
        'skills',
        'experience',
        'education',
        'projects',
        'certifications',
        'languages',
        'awards',
        'interests',
    ];

    return allowed.includes(String(parts[0]));
}
export function arrayAlreadyContainsText(items: any[], text: string) {
    const normalizedText = text.trim().toLowerCase();

    return items.some((item) => {
        if (typeof item === 'string') {
            return item.trim().toLowerCase() === normalizedText;
        }

        if (item && typeof item === 'object' && !Array.isArray(item)) {
            return Object.values(item).some((value) => {
                return (
                    typeof value === 'string' &&
                    value.trim().toLowerCase() === normalizedText
                );
            });
        }

        return false;
    });
}

/**
 * Tự giữ đúng shape của mảng hiện tại.
 *
 * Ví dụ:
 * skills: ["NestJS", "PostgreSQL"]
 * => thêm "Docker"
 *
 * skills: [{ description: "Tools: Git" }]
 * => thêm { description: "Docker" }
 */
export function buildArrayItemByExistingShape(items: any[], newText: string) {
    const firstObjectItem = items.find(
        (item) => item && typeof item === 'object' && !Array.isArray(item),
    );

    if (!firstObjectItem) {
        return newText;
    }

    if ('description' in firstObjectItem) {
        return {
            description: newText,
        };
    }

    if ('name' in firstObjectItem) {
        return {
            name: newText,
        };
    }

    if ('title' in firstObjectItem) {
        return {
            title: newText,
        };
    }

    throw new BadRequestException(
        'Không xác định được cấu trúc item để thêm vào mảng CV',
    );
}
