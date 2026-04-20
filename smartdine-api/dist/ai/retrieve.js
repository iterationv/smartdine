import { generateAnswer } from './generateAnswer.js';
import { matchKnowledge } from './matchKnowledge.js';
export async function retrieve(question) {
    const matched = await matchKnowledge(question);
    if (matched) {
        const answer = await generateAnswer(question, matched);
        return {
            matched,
            source: 'knowledge',
            answer,
        };
    }
    const answer = await generateAnswer(question, null);
    return {
        matched: null,
        source: 'ai_fallback',
        answer,
    };
}
