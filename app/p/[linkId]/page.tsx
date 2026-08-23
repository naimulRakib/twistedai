// app/p/[linkId]/page.tsx — Public inbox page (server component)
// Uses Prisma to bypass RLS for reliable server-side data fetching
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";

type Props = {
  params: Promise<{ linkId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { linkId } = await params;

  const link = await prisma.links.findUnique({
    where: { id: linkId },
    select: { creator_user_id: true },
  });

  let username = "Someone";
  if (link?.creator_user_id) {
    const profile = await prisma.profiles.findUnique({
      where: { id: link.creator_user_id },
      select: { username: true },
    });
    if (profile?.username) username = profile.username;
  }

  return {
    title: `@${username}'s Public Inbox 🔓`,
    description: `Read the anonymous messages and savage replies from ${username}.`,
    openGraph: {
      title: `See ${username}'s Secret Messages 🤫`,
      description: "Click to view the public inbox.",
    },
  };
}

const cleanContent = (content: string) =>
  content.replace(/^\[(ROAST|LAUGH|QUESTION|IDEA|LETTER)\]\s*/, "");

export default async function PublicInboxPage({ params }: Props) {
  const { linkId } = await params;

  // Fetch the link
  const linkData = await prisma.links.findUnique({
    where: { id: linkId },
    select: { is_public_inbox: true, creator_user_id: true, name: true },
  });

  // Lock screen: private or not found
  if (!linkData || !linkData.is_public_inbox) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-white p-4">
        <div className="text-6xl mb-6 animate-pulse">🔒</div>
        <h1 className="text-3xl font-black mb-2 tracking-tight">This Inbox is Private</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          The owner hasn&apos;t made this inbox public yet.
          <br />
          <span className="text-xs opacity-50">
            Ask them to enable &quot;Public Inbox&quot; from their dashboard.
          </span>
        </p>
        <Link href="/">
          <button className="bg-emerald-600 text-black font-bold px-8 py-3 rounded-full hover:bg-emerald-500 transition shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            Create Your Own
          </button>
        </Link>
      </div>
    );
  }

  // Fetch profile
  const profile = await prisma.profiles.findUnique({
    where: { id: linkData.creator_user_id },
    select: { username: true, avatar_url: true },
  });

  const displayName = profile?.username ?? "Anonymous";
  const avatarUrl =
    profile?.avatar_url ??
    `https://api.dicebear.com/9.x/micah/svg?seed=${displayName}`;

  // Fetch public messages — is_public = true only
  const messages = await prisma.messages.findMany({
    where: {
      link_id: linkId,
      is_public: true,   // ✅ strictly public only
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      content: true,
      reply: true,
      created_at: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans py-10 px-4 relative">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      <div className="max-w-xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-5 duration-700">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-emerald-500 to-purple-600 p-[3px] mb-4 shadow-2xl">
            <img
              src={avatarUrl}
              className="w-full h-full rounded-full bg-black object-cover"
              alt="Profile"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tighter">@{displayName}</h1>
          <p className="text-emerald-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">
            Public Inbox Exposed
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-8">
          {messages && messages.length > 0 ? (
            messages.map((msg, index) => (
              <div
                key={String(msg.id)}
                className="animate-in fade-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Message bubble */}
                <div className="bg-[#111] border border-white/10 rounded-[24px] rounded-tl-sm p-5 sm:p-6 relative mb-2 shadow-xl hover:border-emerald-500/30 transition-colors">
                  <div className="absolute -top-3 -left-2 text-2xl">🤫</div>
                  <p className="text-lg sm:text-xl font-bold text-gray-200 leading-snug break-words">
                    {cleanContent(msg.content)}
                  </p>
                  <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-3">
                    <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                      Anonymous
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Reply bubble */}
                {msg.reply && (
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 text-white rounded-[24px] rounded-tr-sm p-4 sm:p-5 max-w-[90%] shadow-[0_10px_30px_rgba(16,185,129,0.15)] relative hover:scale-[1.02] transition">
                      <div className="flex items-center gap-2 mb-2 opacity-80">
                        <img
                          src={avatarUrl}
                          className="w-4 h-4 rounded-full bg-black object-cover"
                          alt=""
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Replied
                        </span>
                      </div>
                      <p className="font-medium text-base sm:text-lg leading-relaxed break-words">
                        {msg.reply}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
              <div className="text-4xl mb-2">👻</div>
              <p className="text-gray-500 font-medium">No public messages yet.</p>
              <p className="text-gray-600 text-xs mt-1">
                The owner hasn&apos;t made any messages public yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="mt-20 text-center pb-10">
          <p className="text-gray-500 text-sm mb-4">
            Want your own anonymous inbox? Visit twst.fun
          </p>
          <Link href="/">
            <button className="bg-white text-black font-black px-8 py-4 rounded-full hover:scale-105 transition shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              Get Your Own Link 🚀
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}