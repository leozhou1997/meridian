export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Login URL now points to our self-hosted login page
export const getLoginUrl = (returnPath?: string) => {
  const path = returnPath || window.location.pathname;
  return `/login?returnTo=${encodeURIComponent(path)}`;
};
