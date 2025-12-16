import { Controller, Get, UseGuards } from '@nestjs/common';
import { LunchTypesService } from './lunch-types.service';
import { LunchType } from './lunch-types.entity';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('lunch-types')
export class LunchTypesController {
  constructor(private readonly lunchTypesService: LunchTypesService) { }

  @Get('/')
  @UseGuards(AuthGuard)
  async findAllActive(): Promise<LunchType[]> {
    return this.lunchTypesService.findAllActive();
  }
}
