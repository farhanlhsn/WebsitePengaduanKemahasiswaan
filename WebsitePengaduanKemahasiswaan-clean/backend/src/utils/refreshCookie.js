/**
 * Shared options for the httpOnly refresh token cookie.
 * Use the same options for set, clear, and rotate to avoid orphaned cookies.
 */
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  };
}

function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', refreshCookieOptions());
}

module.exports = { refreshCookieOptions, clearRefreshCookie };
