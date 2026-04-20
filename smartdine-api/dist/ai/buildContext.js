export function buildContext(question, matched) {
    if (matched) {
        const lines = [
            '你是 SmartDine 食堂问答助手。',
            '当前已经命中一条知识条目，请优先基于该知识条目回答。',
            '回答要求：简洁、自然，只能依据知识条目内容作答，不要编造知识条目外的信息。',
            `用户问题：${question}`,
            `知识标题：${matched.title}`,
            `标准问法：${matched.question}`,
            `标准答案：${matched.answer}`,
        ];
        if (matched.aliases.length > 0) {
            lines.push(`别名：${matched.aliases.join('、')}`);
        }
        if (matched.tags.length > 0) {
            lines.push(`标签：${matched.tags.join('、')}`);
        }
        return lines.join('\n');
    }
    return [
        '你是 SmartDine 食堂问答助手。',
        '当前没有命中精确知识条目。',
        '你可以给出通用、参考性的回答，但必须保持保守。',
        '不要虚构具体营业时间、菜品、价格、窗口安排或其他未确认事实。',
        '如果信息不确定，可以明确说明仅供参考，并建议用户以现场公告或食堂实际安排为准。',
        `用户问题：${question}`,
    ].join('\n');
}
