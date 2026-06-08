import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

// Thin wrapper — same pattern as useAuth.js and useToast.js.
// Components import useTheme(), not ThemeContext directly.
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
};

export default useTheme;