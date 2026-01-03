export const setOAuthState = (state: string) => {
  document.cookie = `oauth_state=${state}; path=/; secure; samesite=lax`;
};
