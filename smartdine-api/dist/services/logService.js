import { readMissedQuestions, readQuestionLogs, } from '../data/logStore.js';
const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;
function normalizePositiveInteger(value, fallbackValue) {
    if (typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < 1) {
        return fallbackValue;
    }
    return value;
}
function normalizeKeyword(value) {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim().toLowerCase();
}
function parseOptionalDate(value, errorMessage) {
    if (typeof value !== 'string') {
        return null;
    }
    const normalizedValue = value.trim();
    if (normalizedValue === '') {
        return null;
    }
    const timestamp = Date.parse(normalizedValue);
    if (Number.isNaN(timestamp)) {
        throw new Error(errorMessage);
    }
    return timestamp;
}
function getCreatedAtTimestamp(createdAt) {
    const timestamp = Date.parse(createdAt);
    if (Number.isNaN(timestamp)) {
        return 0;
    }
    return timestamp;
}
function sortByCreatedAtDesc(items) {
    return [...items].sort((left, right) => getCreatedAtTimestamp(right.createdAt) -
        getCreatedAtTimestamp(left.createdAt));
}
function paginateList(items, page, size) {
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    return items.slice(startIndex, endIndex);
}
function includesKeyword(value, keyword) {
    if (!value) {
        return false;
    }
    return value.toLowerCase().includes(keyword);
}
export async function listQuestionLogs(params = {}) {
    const page = normalizePositiveInteger(params.page, DEFAULT_PAGE);
    const size = normalizePositiveInteger(params.size, DEFAULT_SIZE);
    const keyword = normalizeKeyword(params.keyword);
    const items = sortByCreatedAtDesc(await readQuestionLogs());
    const filteredItems = items.filter((item) => {
        if (keyword === '') {
            return true;
        }
        return (includesKeyword(item.question, keyword) ||
            includesKeyword(item.matchedTitle, keyword) ||
            includesKeyword(item.answer, keyword));
    });
    return {
        list: paginateList(filteredItems, page, size),
        total: filteredItems.length,
        page,
        size,
    };
}
export async function listMissedQuestions(params = {}) {
    const page = normalizePositiveInteger(params.page, DEFAULT_PAGE);
    const size = normalizePositiveInteger(params.size, DEFAULT_SIZE);
    const keyword = normalizeKeyword(params.keyword);
    const startDate = parseOptionalDate(params.startDate, 'Invalid startDate.');
    const endDate = parseOptionalDate(params.endDate, 'Invalid endDate.');
    const items = sortByCreatedAtDesc(await readMissedQuestions());
    const filteredItems = items.filter((item) => {
        const createdAtTimestamp = Date.parse(item.createdAt);
        if (keyword !== '' && !includesKeyword(item.question, keyword)) {
            return false;
        }
        if (startDate !== null &&
            (Number.isNaN(createdAtTimestamp) || createdAtTimestamp < startDate)) {
            return false;
        }
        if (endDate !== null &&
            (Number.isNaN(createdAtTimestamp) || createdAtTimestamp > endDate)) {
            return false;
        }
        return true;
    });
    return {
        list: paginateList(filteredItems, page, size),
        total: filteredItems.length,
        page,
        size,
    };
}
