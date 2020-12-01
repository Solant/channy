import * as functions from 'firebase-functions';

export default function config(key: string): string {
    const isLocal = process.env.IS_LOCAL || false;

    if (isLocal) {
        return process.env[key] || '';
    }

    return functions.config().telegram[key.toLowerCase()] || '';
}
