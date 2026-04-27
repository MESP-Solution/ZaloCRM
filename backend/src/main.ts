import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  DomainErrorFilter,
  HttpErrorFilter,
} from './common/filters/domain-error.filter';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  app.setGlobalPrefix(config.apiPrefix);
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  });
  app.useGlobalFilters(new DomainErrorFilter(), new HttpErrorFilter());
  app.enableShutdownHooks();

  await app.listen(config.port);
}
void bootstrap();
