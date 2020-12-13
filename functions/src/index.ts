import * as functions from 'firebase-functions';

import createBot from './bot';

const bot = createBot();

export const handler = functions.https.onRequest(async (request, response) => {
    const res = await bot.handleUpdate(request.body, response);

    // handle google audit log
    if (!res) {
        response.sendStatus(200);
    }
});
