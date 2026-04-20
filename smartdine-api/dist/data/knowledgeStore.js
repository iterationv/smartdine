import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const KNOWLEDGE_FILE_PATH = path.resolve(process.cwd(), 'src/data/knowledge.json');
export async function readKnowledgeList() {
    try {
        const content = await readFile(KNOWLEDGE_FILE_PATH, 'utf8');
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
            throw new Error('Knowledge data must be a JSON array.');
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
export async function writeKnowledgeList(items) {
    const content = JSON.stringify(items, null, 2);
    await writeFile(KNOWLEDGE_FILE_PATH, `${content}\n`, 'utf8');
}
