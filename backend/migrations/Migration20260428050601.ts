import { Migration } from '@mikro-orm/migrations';

export class Migration20260428050601 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table \`zalo_account\` modify \`status\` enum('pending_login', 'active', 'disconnected', 'restricted', 'login_failed') not null`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`zalo_account\` modify \`status\` enum('pending_login', 'active', 'disconnected', 'restricted') not null`);
  }

}
