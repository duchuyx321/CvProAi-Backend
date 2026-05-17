import {
    AiInsertPosition,
    AiRewriteAction,
    AiRewriteProposalDto,
    AiRewriteStatus,
    AiSeverity,
    AiTargetSection,
} from '../ai-results/dto/create-ai-results.dto';

export type ParsedAnalysisDocument = {
    sourceType: AnalysisSourceType;
    fileName?: string;
    mimeType?: string;
    contentMarkdown: string;
    contentText: string;
};
export type AnalysisSourceType = 'cv' | 'jd';
export function normalizeText(value?: string | null): string {
    return String(value ?? '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
export function cleanExtractedPdfText(value: string): string {
    return normalizeText(value)
        .replace(/[]/g, '')
        .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
        .replace(/©\s*topcv\.vn/gi, '')
        .replace(/Powered by TCPDF\s*\(www\.tcpdf\.org\)/gi, '')
        .replace(/^\s*•\s*$/gm, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function markdownToPlainText(markdown: string): string {
    return markdown
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function normalizeAiRunLabel(value?: string | null): string | undefined {
    const normalized = normalizeText(value);

    if (!normalized) {
        return undefined;
    }

    return normalized.slice(0, 255).trim();
}

export function getBaseFileName(fileName?: string | null): string | undefined {
    const normalized = normalizeAiRunLabel(fileName);

    if (!normalized) {
        return undefined;
    }

    return normalizeAiRunLabel(normalized.replace(/\.[^/.]+$/, ''));
}

export function extractJobTitleFromJdText(
    jdText?: string | null,
): string | undefined {
    const normalized = normalizeText(jdText);

    if (!normalized) {
        return undefined;
    }

    const firstMeaningfulLine = normalized
        .split('\n')
        .map((line) => line.trim())
        .find(Boolean);

    return normalizeAiRunLabel(firstMeaningfulLine);
}
export function buildDocument(
    sourceType: AnalysisSourceType,
    contentMarkdown: string,
    meta?: Partial<ParsedAnalysisDocument>,
): ParsedAnalysisDocument {
    const normalizedMarkdown = normalizeText(contentMarkdown);

    return {
        sourceType,
        fileName: meta?.fileName,
        mimeType: meta?.mimeType,
        contentMarkdown: normalizedMarkdown,
        contentText: markdownToPlainText(normalizedMarkdown),
    };
}

export function buildRawTextDocument(
    sourceType: AnalysisSourceType,
    rawText: string,
): ParsedAnalysisDocument {
    return buildDocument(sourceType, rawText);
}

export function normalizeRewriteProposals(
    proposals: Record<string, unknown>[],
): AiRewriteProposalDto[] {
    return proposals.map((proposal, index) => {
        const normalized = new AiRewriteProposalDto();

        normalized.id =
            typeof proposal.id === 'string'
                ? proposal.id
                : `proposal_${index + 1}`;

        normalized.weakness_id =
            typeof proposal.weakness_id === 'string'
                ? proposal.weakness_id
                : '';

        normalized.action = Object.values(AiRewriteAction).includes(
            proposal.action as AiRewriteAction,
        )
            ? (proposal.action as AiRewriteAction)
            : AiRewriteAction.REPLACE;

        normalized.target_section = Object.values(AiTargetSection).includes(
            proposal.target_section as AiTargetSection,
        )
            ? (proposal.target_section as AiTargetSection)
            : AiTargetSection.SUMMARY;

        normalized.target_path =
            typeof proposal.target_path === 'string'
                ? proposal.target_path
                : '';

        if (
            typeof proposal.insert_position === 'string' &&
            Object.values(AiInsertPosition).includes(
                proposal.insert_position as AiInsertPosition,
            )
        ) {
            normalized.insert_position =
                proposal.insert_position as AiInsertPosition;
        }

        normalized.old_text =
            typeof proposal.old_text === 'string' ? proposal.old_text : '';

        normalized.new_text =
            typeof proposal.new_text === 'string' ? proposal.new_text : '';

        normalized.reason =
            typeof proposal.reason === 'string' ? proposal.reason : '';

        normalized.severity = Object.values(AiSeverity).includes(
            proposal.severity as AiSeverity,
        )
            ? (proposal.severity as AiSeverity)
            : AiSeverity.MEDIUM;

        normalized.estimated_score_gain = Number(
            proposal.estimated_score_gain ?? 0,
        );

        normalized.status = AiRewriteStatus.PENDING;

        normalized.proposal_hash =
            typeof proposal.proposal_hash === 'string'
                ? proposal.proposal_hash
                : '';

        normalized.applied_at = '';
        normalized.applied_by = '';

        return normalized;
    });
}
