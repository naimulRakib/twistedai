import { createClient } from '@supabase/supabase-js';
import { redirect, notFound } from 'next/navigation';
import { Metadata } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  params: Promise<{ slug: string }>;
};

// 1. ADD METADATA (Crucial for FB/Messenger Previews)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  return {
    title: 'Secret Message 🤫',
    description: 'Someone wants to tell you something...',
    openGraph: {
      title: 'Secret Message 🤫',
      description: 'Click to see the message or send a reply.',
      images: ['https://twst.fun/og-image.jpg'], // Make sure this image exists!
    },
  };
}

export default async function ShortRedirectPage({ params }: Props) {
  // 2. Await params
  const { slug } = await params;

  // 3. Look up original URL
  const { data } = await supabase
    .from('short_links')
    .select('original_url')
    .eq('slug', slug)
    .single();

  // 4. If not found, 404
  if (!data || !data.original_url) {
    return notFound();
  }

  // 5. Redirect (307 Temporary Redirect is default and correct)
  redirect(data.original_url);
}