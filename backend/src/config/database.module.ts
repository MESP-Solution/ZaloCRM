import { MikroOrmModule as BaseMikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { AppConfigModule } from './app-config.module';
import { AppConfigService } from './app-config.service';
import { createMikroOrmConfig } from './mikro-orm.config';

@Module({
  imports: [
    BaseMikroOrmModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (appConfigService: AppConfigService) =>
        createMikroOrmConfig(appConfigService),
      inject: [AppConfigService],
      driver: PostgreSqlDriver,
    }),
  ],
})
export class DatabaseModule {}
