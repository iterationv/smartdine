import { readKnowledgeList } from '../data/knowledgeStore.js';
function normalizeText(text) {
    const halfWidthText = Array.from(text, (char) => {
        const charCode = char.charCodeAt(0);
        if (charCode === 12288) {
            return ' ';
        }
        if (charCode >= 65281 && charCode <= 65374) {
            return String.fromCharCode(charCode - 65248);
        }
        return char;
    }).join('');
    return halfWidthText
        .toLowerCase()
        .replace(/\u8bf7\u95ee|\u4f60\u597d|\u5417|\u5462|\u554a/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function tokenize(text) {
    const normalizedText = normalizeText(text);
    if (!normalizedText) {
        return [];
    }
    const sanitizedText = normalizedText
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
        .trim();
    if (!sanitizedText) {
        return [];
    }
    const tokenSet = new Set();
    const segments = sanitizedText.split(/\s+/);
    for (const segment of segments) {
        const parts = segment.match(/[a-z0-9]+|[\u4e00-\u9fff]+/g) ?? [];
        for (const part of parts) {
            if (/^[a-z0-9]+$/.test(part)) {
                tokenSet.add(part);
                continue;
            }
            if (part.length < 2) {
                continue;
            }
            for (let index = 0; index < part.length - 1; index += 1) {
                tokenSet.add(part.slice(index, index + 2));
            }
        }
    }
    return [...tokenSet];
}
function countIntersection(a, b) {
    const tokenSetA = new Set(a);
    const tokenSetB = new Set(b);
    let intersectionCount = 0;
    for (const token of tokenSetA) {
        if (tokenSetB.has(token)) {
            intersectionCount += 1;
        }
    }
    return intersectionCount;
}
function scoreAliasMatch(question, aliases) {
    const normalizedQuestion = normalizeText(question);
    if (!normalizedQuestion) {
        return false;
    }
    return aliases.some((alias) => {
        const normalizedAlias = normalizeText(alias);
        return normalizedAlias ? normalizedQuestion.includes(normalizedAlias) : false;
    });
}
export async function matchKnowledge(question) {
    const normalizedQuestion = normalizeText(question);
    if (!normalizedQuestion) {
        return null;
    }
    const questionTokens = tokenize(normalizedQuestion);
    const items = await readKnowledgeList();
    let bestCandidate = null;
    for (const item of items) {
        if (item.status !== 'active') {
            continue;
        }
        const questionIntersectionCount = countIntersection(questionTokens, tokenize(item.question));
        const aliasMatched = scoreAliasMatch(normalizedQuestion, item.aliases);
        if (questionIntersectionCount < 2 && !aliasMatched) {
            continue;
        }
        if (!bestCandidate) {
            bestCandidate = {
                item,
                intersectionCount: questionIntersectionCount,
                aliasMatched,
            };
            continue;
        }
        if (questionIntersectionCount > bestCandidate.intersectionCount) {
            bestCandidate = {
                item,
                intersectionCount: questionIntersectionCount,
                aliasMatched,
            };
            continue;
        }
        if (questionIntersectionCount === bestCandidate.intersectionCount &&
            aliasMatched &&
            !bestCandidate.aliasMatched) {
            bestCandidate = {
                item,
                intersectionCount: questionIntersectionCount,
                aliasMatched,
            };
        }
    }
    return bestCandidate?.item ?? null;
}
