import { CampaignDetailPanel } from '~features/campaigns/components/campaign-detail-panel';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  return <CampaignDetailPanel campaignId={id} />;
}
