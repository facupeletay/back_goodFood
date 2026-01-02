import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LunchTypesService } from './lunch-types.service';
import { LunchTypesController } from './lunch-types.controller';
import { LunchType } from './lunch-types.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LunchType])],
  controllers: [LunchTypesController],
  providers: [LunchTypesService],
  exports: [LunchTypesService],
})
export class LunchTypesModule { }
