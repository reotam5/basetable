import axios from 'axios';
import { electronConfig } from '../config.js';
import { AuthHandler } from './AuthHandler.js';

const api = axios.create({
  baseURL: electronConfig.api_base_url,
});

api.interceptors.request.use(async config => {
  const accessToken = await AuthHandler.getInstance().getAccessToken();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export { api };

