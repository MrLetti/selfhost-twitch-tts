/** Mapa de cooldowns por usuario: username → timestamp último mensaje */
const userCooldowns = new Map();

const URL_REGEX = /https?:\/\/\S+/i;

/**
 * Determina si un mensaje debe ser saltado.
 * @returns {{ skip: boolean, reason?: string }}
 */
function shouldSkipMessage(username, message, config) {
  const lowerUser = username.toLowerCase();
  const lowerMsg  = message.toLowerCase();
  const { filters } = config;

  if (filters.blacklisted_users.map(u => u.toLowerCase()).includes(lowerUser)) {
    return { skip: true, reason: 'usuario bloqueado' };
  }

  const hasBadWord = filters.blacklisted_words.some(w => lowerMsg.includes(w.toLowerCase()));
  if (hasBadWord) {
    return { skip: true, reason: 'palabra prohibida' };
  }

  if (filters.skip_urls && URL_REGEX.test(message)) {
    return { skip: true, reason: 'contiene URL' };
  }

  if (filters.user_cooldown_seconds > 0) {
    const last = userCooldowns.get(lowerUser);
    const now  = Date.now();
    if (last && now - last < filters.user_cooldown_seconds * 1000) {
      return { skip: true, reason: 'cooldown' };
    }
    userCooldowns.set(lowerUser, now);
  }

  return { skip: false };
}

function resetCooldowns() {
  userCooldowns.clear();
}

module.exports = { shouldSkipMessage, resetCooldowns };
