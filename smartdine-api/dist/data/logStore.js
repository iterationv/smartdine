import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const QUESTION_LOGS_FILE_PATH = path.resolve(process.cwd(), 'src/data/questionLogs.json');
const MISSED_QUESTIONS_FILE_PATH = path.resolve(process.cwd(), 'src/data/missedQuestions.json');
async function readJsonArray(filePath, errorMessage) {
    try {
        const content = await readFile(filePath, 'utf8');
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
            throw new Error(errorMessage);
        }
        return parsed;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}
async function writeJsonArray(filePath, items) {
    const content = JSON.stringify(items, null, 2);
    await writeFile(filePath, `${content}\n`, 'utf8');
}
export async function readQuestionLogs() {
    return readJsonArray(QUESTION_LOGS_FILE_PATH, 'Question logs data must be a JSON array.');
}
export async function writeQuestionLogs(items) {
    await writeJsonArray(QUESTION_LOGS_FILE_PATH, items);
}
export async function readMissedQuestions() {
    return readJsonArray(MISSED_QUESTIONS_FILE_PATH, 'Missed questions data must be a JSON array.');
}
export async function writeMissedQuestions(items) {
    await writeJsonArray(MISSED_QUESTIONS_FILE_PATH, items);
}
