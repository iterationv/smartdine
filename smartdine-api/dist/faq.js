import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appConfig } from './config.js';
const moduleDir = dirname(fileURLToPath(import.meta.url));
const resolveConfiguredFaqPath = (value) => {
    if (!value.trim()) {
        return '';
    }
    return isAbsolute(value) ? value : resolve(moduleDir, '..', value);
};
const faqFileCandidates = [
    ...(appConfig.faqFilePath
        ? [resolveConfiguredFaqPath(appConfig.faqFilePath)]
        : []),
    resolve(moduleDir, 'data', 'faq.json'),
    resolve(moduleDir, '..', 'src', 'data', 'faq.json'),
];
let faqCache = [];
let hasLoadedFaqCache = false;
let faqFilePath = null;
const cloneFaqItem = (item) => ({
    ...item,
    tags: [...item.tags],
});
const cloneFaqList = (list) => {
    return list.map(cloneFaqItem);
};
const isFaqItem = (value) => {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const item = value;
    return (typeof item.id === 'string' &&
        typeof item.question === 'string' &&
        typeof item.answer === 'string' &&
        Array.isArray(item.tags) &&
        item.tags.every((tag) => typeof tag === 'string'));
};
const normalizeFaqList = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter(isFaqItem).map(cloneFaqItem);
};
const getFaqFilePath = async () => {
    if (faqFilePath) {
        return faqFilePath;
    }
    for (const candidate of faqFileCandidates) {
        try {
            await access(candidate);
            faqFilePath = candidate;
            return faqFilePath;
        }
        catch {
            continue;
        }
    }
    faqFilePath = faqFileCandidates[0];
    return faqFilePath;
};
const normalizeSearchText = (value) => {
    return value.trim().toLowerCase();
};
export const loadFaqFromFile = async () => {
    try {
        const filePath = await getFaqFilePath();
        const content = await readFile(filePath, 'utf8');
        if (!content.trim()) {
            return [];
        }
        return normalizeFaqList(JSON.parse(content));
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            console.warn('Failed to parse FAQ JSON, using an empty FAQ list.');
            return [];
        }
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
};
const saveFaqToFile = async (list) => {
    const filePath = await getFaqFilePath();
    const content = JSON.stringify(cloneFaqList(list), null, 2);
    await writeFile(filePath, `${content}\n`, 'utf8');
};
export const reloadFaqCache = async () => {
    faqCache = await loadFaqFromFile();
    hasLoadedFaqCache = true;
    return cloneFaqList(faqCache);
};
export const ensureFaqCache = async () => {
    if (!hasLoadedFaqCache) {
        return reloadFaqCache();
    }
    return cloneFaqList(faqCache);
};
export const getFaqList = async () => {
    return ensureFaqCache();
};
export const addFaq = async (input) => {
    const list = await ensureFaqCache();
    if (list.some((item) => item.id === input.id)) {
        throw new Error(`FAQ with id "${input.id}" already exists.`);
    }
    const newItem = {
        id: input.id,
        question: input.question,
        answer: input.answer,
        tags: [...input.tags],
    };
    list.push(newItem);
    await saveFaqToFile(list);
    await reloadFaqCache();
    return cloneFaqItem(newItem);
};
export const updateFaq = async (id, input) => {
    const list = await ensureFaqCache();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
        throw new Error(`FAQ with id "${id}" does not exist.`);
    }
    const updatedItem = {
        ...list[index],
        ...(input.question !== undefined ? { question: input.question } : {}),
        ...(input.answer !== undefined ? { answer: input.answer } : {}),
        ...(input.tags !== undefined ? { tags: [...input.tags] } : {}),
    };
    list[index] = updatedItem;
    await saveFaqToFile(list);
    await reloadFaqCache();
    return cloneFaqItem(updatedItem);
};
export const deleteFaq = async (id) => {
    const list = await ensureFaqCache();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
        throw new Error(`FAQ with id "${id}" does not exist.`);
    }
    list.splice(index, 1);
    await saveFaqToFile(list);
    await reloadFaqCache();
};
export const getMatchedFaq = async (question) => {
    const normalizedQuestion = normalizeSearchText(question);
    if (!normalizedQuestion) {
        return null;
    }
    const list = await ensureFaqCache();
    for (const item of list) {
        const normalizedFaqQuestion = normalizeSearchText(item.question);
        if (normalizedFaqQuestion &&
            (normalizedQuestion.includes(normalizedFaqQuestion) ||
                normalizedFaqQuestion.includes(normalizedQuestion))) {
            return cloneFaqItem(item);
        }
        const matchedTag = item.tags.some((tag) => {
            const normalizedTag = normalizeSearchText(tag);
            return normalizedTag ? normalizedQuestion.includes(normalizedTag) : false;
        });
        if (matchedTag) {
            return cloneFaqItem(item);
        }
    }
    return null;
};
