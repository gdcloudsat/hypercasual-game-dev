const config = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  wsUrl: import.meta.env.VITE_WS_URL as string,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD
};

export default config;
