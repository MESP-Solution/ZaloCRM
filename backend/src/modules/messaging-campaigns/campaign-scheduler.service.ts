import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/core';
import { MessagingCampaign } from './messaging-campaign.entity';
import { CampaignDispatchService } from './campaign-dispatch.service';

@Injectable()
export class CampaignSchedulerService {
  private readonly logger = new Logger(CampaignSchedulerService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly dispatchService: CampaignDispatchService,
  ) {}

  @Cron('*/1 * * * *')
  async pollScheduledCampaigns(): Promise<void> {
    const em = this.em.fork();
    const now = new Date();

    const campaigns = await em.find(MessagingCampaign, {
      status: 'queued',
      scheduleAt: { $lte: now },
    });

    if (campaigns.length === 0) return;

    this.logger.log(
      `Found ${campaigns.length} scheduled campaign(s) ready to dispatch`,
    );

    for (const campaign of campaigns) {
      try {
        await this.dispatchService.startDispatch(campaign.id);
        this.logger.log(`Auto-dispatched scheduled campaign ${campaign.id}`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Failed to auto-dispatch campaign ${campaign.id}: ${message}`,
        );
      }
    }
  }
}
