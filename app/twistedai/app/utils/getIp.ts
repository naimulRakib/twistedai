import { headers } from 'next/headers';

// 1. Make function ASYNC
export async function getUserIp() {
  
  // 2. Add AWAIT here
  const headersList = await headers(); 
  
  const forwardedFor = headersList.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headersList.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return '127.0.0.1';
}