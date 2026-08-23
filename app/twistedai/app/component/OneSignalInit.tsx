"use client"; // This makes it a Client Component

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalInit() {
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const initOneSignal = async () => {
        try {
          await OneSignal.init({
            appId: "28baa749-4ba0-4328-910c-65b3437fc871", // Replace with your actual App ID
            allowLocalhostAsSecureOrigin: true, // Use this for local testing
            // notifyButton: { enable: true }, // Optional: shows a bell icon
          });
          
          // Request permission immediately (optional)
          OneSignal.Slidedown.promptPush();
        } catch (error) {
          console.error("OneSignal initialization failed:", error);
        }
      };

      initOneSignal();
    }
  }, []);

  return null; // This component doesn't render any visible UI
}