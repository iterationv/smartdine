import { securityConfig } from '../config.js';
const createJsonUtf8Response = (status, data) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
        },
    });
};
export const authMiddleware = async (c, next) => {
    const apiSecret = securityConfig.apiSecret;
    const requestApiKey = c.req.header('x-api-key');
    if (!apiSecret || requestApiKey !== apiSecret) {
        return createJsonUtf8Response(401, {
            message: 'Unauthorized',
        });
    }
    await next();
};
