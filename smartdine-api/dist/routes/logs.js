import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { listMissedQuestions, listQuestionLogs, } from '../services/logService.js';
const logsRoutes = new Hono();
const getOptionalQuery = (value) => {
    return value === undefined || value === '' ? undefined : value;
};
const getOptionalNumberQuery = (value) => {
    const query = getOptionalQuery(value);
    return query === undefined ? undefined : Number(query);
};
const isInvalidDateError = (error) => {
    return (error instanceof Error &&
        (error.message === 'Invalid startDate.' ||
            error.message === 'Invalid endDate.'));
};
logsRoutes.use('*', authMiddleware);
logsRoutes.get('/api/logs', async (c) => {
    try {
        const result = await listQuestionLogs({
            page: getOptionalNumberQuery(c.req.query('page')),
            size: getOptionalNumberQuery(c.req.query('size')),
            keyword: getOptionalQuery(c.req.query('keyword')),
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Failed to list question logs:', error);
        return c.json({
            message: 'Internal server error',
        }, 500);
    }
});
logsRoutes.get('/api/logs/missed', async (c) => {
    try {
        const result = await listMissedQuestions({
            page: getOptionalNumberQuery(c.req.query('page')),
            size: getOptionalNumberQuery(c.req.query('size')),
            keyword: getOptionalQuery(c.req.query('keyword')),
            startDate: getOptionalQuery(c.req.query('startDate')),
            endDate: getOptionalQuery(c.req.query('endDate')),
        });
        return c.json(result);
    }
    catch (error) {
        if (isInvalidDateError(error)) {
            return c.json({
                message: error.message,
            }, 400);
        }
        console.error('Failed to list missed questions:', error);
        return c.json({
            message: 'Internal server error',
        }, 500);
    }
});
export default logsRoutes;
