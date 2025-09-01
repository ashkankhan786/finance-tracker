import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fix 1: Memoize the API instance to prevent recreation on every render
  const api = useMemo(() => {
    return axios.create({
      baseURL: import.meta.env.VITE_SERVER_URL,
      withCredentials: true,
    });
  }, []);

  // Fix 2: Use useRef to track if interceptor is already set up
  const interceptorRef = useRef(null);

  useEffect(() => {
    // Only set up interceptor once
    if (interceptorRef.current) return;

    interceptorRef.current = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          (error.response?.status === 401 || error.response?.status === 403) &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          console.log("Access token expired. Attempting to refresh...");

          try {
            const res = await axios.post(
              `${import.meta.env.VITE_SERVER_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            );
            if (res.data.success) {
              const newAccessToken = res.data.data.accessToken;
              setAccessToken(newAccessToken);
              originalRequest.headers[
                "Authorization"
              ] = `Bearer ${newAccessToken}`;
              console.log("Token refreshed. Retrying original request.");
              return api(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed.", refreshError);
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      if (interceptorRef.current) {
        api.interceptors.response.eject(interceptorRef.current);
        interceptorRef.current = null;
      }
    };
  }, []); // Remove api dependency

  const loginWithGoogle = async (code) => {
    try {
      const res = await api.post("/auth/google", { code });
      if (res.data.success) {
        setAccessToken(res.data.data.accessToken);
        setUser(res.data.data.user);
        sessionStorage.setItem("accessToken", res.data.data.accessToken);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Fix 3: Properly handle token parameter in getProfile
  const getProfile = async (token = accessToken) => {
    // Use provided token or fall back to stored token
    const tokenToUse = token || sessionStorage.getItem("accessToken");

    if (!tokenToUse) {
      return null;
    }

    try {
      const res = await api.get("/auth/profile", {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });
      if (res.data.success) {
        setUser(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.error("Get profile failed", err);
      return null;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setAccessToken(null);
      setUser(null);
      sessionStorage.removeItem("accessToken");
    }
  };

  // Fix 4: Improve initialization logic
  useEffect(() => {
    const init = async () => {
      const storedToken = sessionStorage.getItem("accessToken");
      if (storedToken) {
        setAccessToken(storedToken);
        // Get profile with the stored token immediately
        await getProfile(storedToken);
      }
      setLoading(false);
    };
    init();
  }, []);

  // Fix 5: Only fetch profile when accessToken changes and is not null
  useEffect(() => {
    if (accessToken && !user) {
      getProfile(accessToken);
    }
  }, [accessToken, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        loginWithGoogle,
        api,
        getProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
