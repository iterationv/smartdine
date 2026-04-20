export function mapLegacyFaqToKnowledgeItem(faqItem, now) {
    return {
        id: faqItem.id,
        title: faqItem.question.slice(0, 20),
        question: faqItem.question,
        answer: faqItem.answer,
        aliases: [],
        tags: Array.isArray(faqItem.tags) ? faqItem.tags : [],
        status: 'active',
        createdAt: now,
        updatedAt: now,
    };
}
export function migrateLegacyFaqList(faqList, now) {
    return faqList.map((faqItem) => mapLegacyFaqToKnowledgeItem(faqItem, now));
}
