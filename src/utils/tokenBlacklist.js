const blacklist = new Map();

const addToBlacklist = (jti, exp) => {
  const expiresAtMs = exp * 1000;
  blacklist.set(jti, expiresAtMs);
};

const isBlacklisted = (jti) => {
  return blacklist.has(jti);
};

const cleanup = () => {
  const now = Date.now();
  for (const [jti, expiresAt] of blacklist.entries()) {
    if (now > expiresAt) {
      blacklist.delete(jti);
    }
  }
};

setInterval(cleanup, 15 * 60 * 1000).unref();

export default { addToBlacklist, isBlacklisted };
