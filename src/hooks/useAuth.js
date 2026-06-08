import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure AuthProvider wraps your component tree in App.jsx.'
    );
  }

  return context;
  // Returns: { currentUser, userProfile, role, loading, refreshProfile }
};

export default useAuth;