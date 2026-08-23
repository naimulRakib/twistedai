'use server';
import { getUserIp } from './utils/getIp';
import { createClient } from '@supabase/supabase-js';
 // Import helper


export async function submitMessageAction() {
  
  // 1. GET THE IP
  const ip = await getUserIp();
  
  console.log(`New Message from IP: ${ip}`);
  
  // 2. (Optional) Get Location from IP
  // You can use a free API like ip-api.com to convert IP -> City
  let location = "Unknown";
  try {
    const locRes = await fetch(`http://ip-api.com/json/${ip}`);
    const locData = await locRes.json();
    console.log(locData);
    if (locData.status === 'success') {
      location = `${locData.city}, ${locData.country}`;
      console.log(location); // e.g., "Dhaka, Bangladesh"
    }
  } catch (e) {
    console.error("Location fetch failed");
  }


  

}