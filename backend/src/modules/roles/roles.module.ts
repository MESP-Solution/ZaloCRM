import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Role } from './role.entity';
import { RolesSeederService } from './roles-seeder.service';

@Module({
  imports: [MikroOrmModule.forFeature([Role])],
  providers: [RolesSeederService],
  exports: [MikroOrmModule],
})
export class RolesModule {}
