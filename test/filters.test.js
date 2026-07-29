const { shouldSkipMessage } = require('../src/filters');

describe('Filtros de msjes', () => {
    let config = {
    "filters": {
        "skip_commands": true,
        "skip_urls": true,
        "user_cooldown_seconds": 0,
        "blacklisted_users": ["user2"],
        "blacklisted_words": ["maricon", "negro", "nigger", "nigga"]
    }
    };

    test('skip_commands', () => {
        expect(shouldSkipMessage('user', '!tts hola', config)).toBe(false);
    });
    test('skip_urls', () => {
        expect(shouldSkipMessage('user', '!tts www.google.com', config)).toBe(true);
    });
    test('blacklisted_words', () => {
        expect(shouldSkipMessage('user', '!tts maricon', config)).toBe(true);
    });
    test('blacklisted_users', () => {
        expect(shouldSkipMessage('user2', '!tts hola', config)).toBe(true);
    });
});