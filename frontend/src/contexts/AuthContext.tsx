import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Auth } from 'aws-amplify';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  linkedinUrl: string | null;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  linkedinUrl: null,
  signOut: async () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setIsAuthenticated(true);
      setUser(currentUser);
      
      // Get LinkedIn URL from user attributes
      const { attributes } = currentUser;
      setLinkedinUrl(attributes['custom:linkedin_url'] || null);
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setLinkedinUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await Auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setLinkedinUrl(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        linkedinUrl,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
