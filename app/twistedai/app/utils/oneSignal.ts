import OneSignal from 'react-onesignal';

export const runOneSignal = async () => {
  try {
    await OneSignal.init({ 
      appId: "YOUR_ONESIGNAL_APP_ID_HERE", // Replace with your ID
      allowLocalhostAsSecureOrigin: true,
    });
    // This prompts the user to "Allow Notifications"
    OneSignal.Slidedown.promptPush(); 
  } catch (error) {
    console.error("OneSignal Init Error:", error);
  }
};