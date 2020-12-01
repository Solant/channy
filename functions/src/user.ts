import { User } from './db';

export function forSuggestion(u: User): string {
    const lastName = u.last_name || '';
    const firstName = u.first_name;
    const userName = u.username ? `(@${u.username})` : '';

    return [lastName, firstName, userName]
        .filter(i => i)
        .join(' ');
}

export function forPost(u: User): string {
    return u.first_name;
}
