import { CampaignListPanel } from '~features/campaigns/components/campaign-list-panel';

export default function CampaignsPage() {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-950">Chiến dịch nhắn tin</h1>
      </div>
      <CampaignListPanel />
    </div>
  );
}
