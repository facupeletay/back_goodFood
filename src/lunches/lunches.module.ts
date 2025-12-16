import { Module } from '@nestjs/common';
import { LunchesController } from './lunches.controller';
import { LunchesService } from './lunches.service';
import { Lunch } from './lunch.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Lunch])],
  controllers: [LunchesController],
  providers: [LunchesService],
})
export class LunchesModule {}
