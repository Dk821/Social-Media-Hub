import { createContext, useContext, useState, useEffect } from "react";
import {
    auth,
    googleProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import api from "@/lib/axiosConfig";

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const idToken = await firebaseUser.getIdToken();
                setToken(idToken);
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
                    photoURL: firebaseUser.photoURL || "",
                });

                // Sync profile with backend (use raw fetch to avoid interceptor redirect loops)
                try {
                    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
                    await fetch(`${backendUrl}/api/auth/profile`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${idToken}`,
                            "Content-Type": "application/json",
                        },
                    });
                } catch (err) {
                    console.warn("Profile sync skipped:", err.message);
                }
            } else {
                setUser(null);
                setToken(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Auto-refresh token periodically (tokens expire in 1 hour)
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const newToken = await currentUser.getIdToken(true);
                setToken(newToken);
            }
        }, 50 * 60 * 1000); // Refresh every 50 minutes
        return () => clearInterval(interval);
    }, [user]);

    const login = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    };

    const register = async (email, password, displayName) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
            await updateProfile(result.user, { displayName });
        }
        return result.user;
    };

    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
