import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const getDynamicAvatarUrl = async (uid: string) => {
  const supabase = createClientComponentClient();
  
  // Configuration matching your setup
  const bucket = 'user-uploads';
  const folder = `avatars/${uid}`;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // e.g. https://xyz.supabase.co

  try {
    // 1. LIST files in the specific user's folder to find the exact name
    // We sort by created_at descending to get the latest upload
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .list(folder, {
        limit: 1,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error("Error listing files:", error);
      return null;
    }

    // 2. If folder is empty, return null (UI should show fallback)
    if (!data || data.length === 0) {
      return null;
    }

    // 3. Extract the exact File Name (e.g., "profile.png" or "174823.jpg")
    const fileName = data[0].name;

    // 4. Manually Construct the Public URL
    // Pattern: PROJECT_URL + /storage/v1/object/public/ + BUCKET + / + FOLDER + / + FILE
    const fullUrl = `${projectUrl}/storage/v1/object/public/${bucket}/${folder}/${fileName}`;

    // 5. Add Timestamp for Cache Busting (Forces browser to see new image)
    return `${fullUrl}?t=${Date.now()}`;

  } catch (e) {
    console.error("Unexpected error building URL:", e);
    return null;
  }
};