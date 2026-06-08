import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const useScrollRestoration = () => {
  const { pathname } = useLocation();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);
};

export default useScrollRestoration;