export async function generateClientMasterId(spyData: any) {
  // 1. Select the stable hardware traits (Same logic as server)
  const stableTraits = [
    spyData.os_platform,
    spyData.cpu_cores,
    spyData.ram_gb,
    spyData.gpu,
    spyData.screen_res,
    spyData.pixel_ratio
  ].join('|'); 

  // 2. Use Browser Native Crypto API (SHA-256)
  const msgBuffer = new TextEncoder().encode(stableTraits);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  
  // 3. Convert ArrayBuffer to Hex String
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}