import axios from "axios";
import { auth } from "@/firebase";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

const api = axios.create({
    baseURL: BACKEND_URL,
});

// Interceptor: inject Firebase ID token into every request
api.interceptors.request.use(
    async (config) => {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const token = await currentUser.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (err) {
            console.error("Failed to get auth token:", err);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor: handle 401 responses — just log, don't redirect or sign out
// ProtectedRoute and AuthContext already handle unauthenticated state
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("API returned 401:", error.config?.url);
        }
        return Promise.reject(error);
    }
);

export default api;
