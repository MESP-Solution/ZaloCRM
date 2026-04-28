import { Migration } from '@mikro-orm/migrations';

export class Migration20260427172411 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table \`customer_account\` (\`id\` varchar(255) not null, \`email\` varchar(255) not null, \`name\` varchar(255) not null, \`password_hash\` varchar(255) not null, \`status\` enum('active','disabled') not null, \`created_at\` datetime not null, \`updated_at\` datetime not null, primary key (\`id\`)) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`customer_account\` add unique \`customer_account_email_unique\` (\`email\`);`);

    this.addSql(`create table \`role\` (\`id\` varchar(255) not null, \`name\` varchar(255) not null, \`description\` varchar(255) not null, primary key (\`id\`)) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`role\` add unique \`role_name_unique\` (\`name\`);`);

    this.addSql(`create table \`customer_account_roles\` (\`customer_account_id\` varchar(255) not null, \`role_id\` varchar(255) not null, primary key (\`customer_account_id\`, \`role_id\`)) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`customer_account_roles\` add index \`customer_account_roles_customer_account_id_index\` (\`customer_account_id\`);`);
    this.addSql(`alter table \`customer_account_roles\` add index \`customer_account_roles_role_id_index\` (\`role_id\`);`);

    this.addSql(`create table \`zalo_account\` (\`id\` varchar(255) not null, \`customer_id\` varchar(255) not null, \`display_name\` varchar(255) not null, \`provider_account_id\` varchar(255) null, \`status\` enum('pending_login','active','disconnected','restricted') not null default 'pending_login', \`created_at\` datetime not null, \`updated_at\` datetime not null, primary key (\`id\`)) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`zalo_account\` add index \`zalo_account_customer_id_index\` (\`customer_id\`);`);
    this.addSql(`alter table \`zalo_account\` add index \`zalo_account_provider_account_id_index\` (\`provider_account_id\`);`);

    this.addSql(`create table \`messaging_campaign\` (\`id\` varchar(255) not null, \`customer_id\` varchar(255) not null, \`zalo_account_id\` varchar(255) not null, \`name\` varchar(255) not null, \`message_text\` varchar(255) not null, \`status\` enum('draft','queued','sending','completed','failed') not null default 'draft', \`jobs\` json not null, \`schedule_at\` datetime null, \`sent_count\` int not null default 0, \`delivered_count\` int not null default 0, \`failed_count\` int not null default 0, \`created_at\` datetime not null, \`updated_at\` datetime not null, primary key (\`id\`)) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`messaging_campaign\` add index \`messaging_campaign_customer_id_index\` (\`customer_id\`);`);
    this.addSql(`alter table \`messaging_campaign\` add index \`messaging_campaign_zalo_account_id_index\` (\`zalo_account_id\`);`);

    this.addSql(`alter table \`customer_account_roles\` add constraint \`customer_account_roles_customer_account_id_foreign\` foreign key (\`customer_account_id\`) references \`customer_account\` (\`id\`) on update cascade on delete cascade;`);
    this.addSql(`alter table \`customer_account_roles\` add constraint \`customer_account_roles_role_id_foreign\` foreign key (\`role_id\`) references \`role\` (\`id\`) on update cascade on delete cascade;`);

    this.addSql(`alter table \`zalo_account\` add constraint \`zalo_account_customer_id_foreign\` foreign key (\`customer_id\`) references \`customer_account\` (\`id\`);`);

    this.addSql(`alter table \`messaging_campaign\` add constraint \`messaging_campaign_customer_id_foreign\` foreign key (\`customer_id\`) references \`customer_account\` (\`id\`);`);
    this.addSql(`alter table \`messaging_campaign\` add constraint \`messaging_campaign_zalo_account_id_foreign\` foreign key (\`zalo_account_id\`) references \`zalo_account\` (\`id\`);`);
  }

}
