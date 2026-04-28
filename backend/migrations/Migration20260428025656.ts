import { Migration } from '@mikro-orm/migrations';

export class Migration20260428025656 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table \`zalo_account\` add \`phone_number\` varchar(255) null, add \`proxy_url\` varchar(255) null, add \`encrypted_cookie_data\` text null, add \`last_connected_at\` datetime null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`zalo_account\` drop column \`phone_number\`, drop column \`proxy_url\`, drop column \`encrypted_cookie_data\`, drop column \`last_connected_at\`;`);
  }

}
