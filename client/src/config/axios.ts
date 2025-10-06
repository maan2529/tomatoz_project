import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default api;