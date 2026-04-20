import { appConfig } from '../config.js';
const ALLOW_METHODS = 'GET,POST,PUT,DELETE,OPTIONS';
const ALLOW_HEADERS = 'Content-Type,x-api-key';
const getAllowedOrigin = (origin) => {
    if (appConfig.corsOrigins.length === 0) {
        return '*';
    }
    if (origin && appConfig.corsOrigins.includes(origin)) {
        return origin;
    }
    return null;
};
const applyCorsHeaders = (response, origin) => {
    response.headers.set('Access-Control-Allow-Methods', ALLOW_METHODS);
    response.headers.set('Access-Control-Allow-Headers', ALLOW_HEADERS);
    const allowedOrigin = getAllowedOrigin(origin);
    if (allowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
        if (allowedOrigin !== '*') {
            response.headers.set('Vary', 'Origin');
        }
    }
};
export const corsMiddleware = async (c, next) => {
    const origin = c.req.header('origin');
    if (c.req.method === 'OPTIONS') {
        const response = new Response(null, { status: 204 });
        applyCorsHeaders(response, origin);
        return response;
    }
    await next();
    applyCorsHeaders(c.res, origin);
};
