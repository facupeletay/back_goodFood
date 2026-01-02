import { Module } from '@nestjs/common';
import { LunchesController } from './lunches.controller';
import { LunchesSyncController } from './lunches-sync.controller';
import { LunchesService } from './lunches.service';
import { Lunch } from './lunch.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LunchType } from 'src/lunch-types/lunch-types.entity';
import { LunchTypesModule } from 'src/lunch-types/lunch-types.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lunch, LunchType]), LunchTypesModule],
  controllers: [LunchesController, LunchesSyncController],
  providers: [LunchesService],
})
export class LunchesModule {}
