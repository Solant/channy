import * as functions from 'firebase-functions';

import createBot from './bot';

const bot = createBot();

export const handler = functions.https.onRequest(async (request, response) => {
    await bot.handleUpdate(request.body, response);
});
