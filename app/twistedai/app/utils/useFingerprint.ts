import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const useFingerprint = () => {
  const [visitorId, setVisitorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Only run this code in the browser (Client-Side)
    const initFingerprint = async () => {
      try {
        // 2. Load Agent inside the effect
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        
        setVisitorId(result.visitorId);
      } catch (error) {
        console.error("Fingerprint blocked:", error);
        // Fallback ID if blocked by AdBlocker
        setVisitorId('anon_' + Math.random().toString(36).substring(7));
      } finally {
        setIsLoading(false);
      }
    };

    initFingerprint();
  }, []);

  return { visitorId: visitorId || "Loading...", isLoading };
};