import SecureSpyChat from '../../../component/LiveSpyChat';

type Props = {
  params: Promise<{ masterId: string; creatorId: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { masterId, creatorId } = await params;
  return <SecureSpyChat masterId={masterId} creatorId={creatorId} />;
}