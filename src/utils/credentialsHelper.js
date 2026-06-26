/**
 * Helper to dynamically resolve user credentials based on the ACTIVE USER_ROLE.
 * Supported roles: 'tenant_admin', 'admin', 'supervisor', 'agent'
 */
function resolveCredentials() {
  const role = (process.env.USER_ROLE || 'admin').trim().toLowerCase();
  let userId, password;

  switch (role) {
    case 'tenant_admin':
      userId = process.env.TENANT_ADMIN_USER_ID;
      password = process.env.TENANT_ADMIN_USER_PASSWORD;
      break;
    case 'supervisor':
      userId = process.env.SUPERVISOR_USER_ID;
      password = process.env.SUPERVISOR_USER_PASSWORD;
      break;
    case 'agent':
      userId = process.env.AGENT_USER_ID;
      password = process.env.AGENT_USER_PASSWORD;
      break;
    case 'admin':
    default:
      // Fallback to global USER_ID / USER_PASSWORD if ADMIN_USER_ID is not configured
      userId = process.env.ADMIN_USER_ID || process.env.USER_ID;
      password = process.env.ADMIN_USER_PASSWORD || process.env.USER_PASSWORD;
      break;
  }

  return { role, userId, password };
}

module.exports = { resolveCredentials };
