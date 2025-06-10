import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  linkedinUrl: string | null;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: true, // Always authenticated
  user: { username: 'demo-user', email: 'demo@example.com' }, // Mock user
  linkedinUrl: null,
  signOut: async () => {},
  loading: false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Mock authentication state - always authenticated
  const [isAuthenticated] = useState(true);
  const [user] = useState({ 
    username: 'demo-user', 
    email: 'demo@example.com',
    attributes: {
      email: 'demo@example.com',
      name: 'Demo User',
      sub: '12345-mock-user-id'
    }
  });
  const [linkedinUrl] = useState<string | null>(null);
  const [loading] = useState(false);

  // Mock sign out function
  const signOut = async () => {
    console.log('Sign out clicked - authentication disabled for demo purposes');
    // In a real app, this would sign the user out
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
