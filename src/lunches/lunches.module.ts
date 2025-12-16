import { Module } from '@nestjs/common';
import { LunchesController } from './lunches.controller';
import { LunchesService } from './lunches.service';
import { Lunch } from './lunch.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LunchType } from 'src/lunch-types/lunch-types.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lunch, LunchType])],
  controllers: [LunchesController],
  providers: [LunchesService],
})
export class LunchesModule {}
