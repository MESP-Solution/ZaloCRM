import { Migration } from '@mikro-orm/migrations';

export class Migration20260428103956_AddAvatarUrl extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table \`zalo_account\` add \`avatar_url\` varchar(2048) null;`);
    this.addSql(`alter table \`zalo_account\` modify \`status\` enum('pending_login','active','disconnected','restricted','login_failed') not null default 'pending_login';`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`zalo_account\` drop column \`avatar_url\`;`);
    this.addSql(`alter table \`zalo_account\` modify \`status\` enum('pending_login','active','disconnected','restricted','login_failed') not null;`);
  }

}
