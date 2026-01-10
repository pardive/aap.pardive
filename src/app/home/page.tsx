'use client';

import { useEffect } from 'react';

export default function HomeRedirect() {
  useEffect(() => {
    const lastApp = localStorage.getItem('last_app');

    if (!lastApp || lastApp === 'workspace') {
      window.location.replace('/workspace');
    } else {
      window.location.replace(`/apps/${lastApp}`);
    }
  }, []);

  return null;
}
