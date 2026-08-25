import SecureSpyChat from '../../../component/LiveSpyChat';

type Props = {
  params: Promise<{ messageId: string; creatorId: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { messageId, creatorId } = await params;
  return <SecureSpyChat messageId={messageId} creatorId={creatorId} />;
}