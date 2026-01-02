import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  Req,
  ParseArrayPipe,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { LunchesService } from './lunches.service';
import { CreateLunchDto } from './dtos/create_lunch.dto';
import { LunchTypesService } from 'src/lunch-types/lunch-types.service';

@Controller('lunches')
export class LunchesController {
  constructor(
    private lunchesService: LunchesService,
    private lunchTypesService: LunchTypesService,
  ) { }

  @Get('/daily')
  @UseGuards(AuthGuard)
  async getDaily() {
    return this.lunchesService.findDaily();
  }

  @Get('/daily-with-types')
  @UseGuards(AuthGuard)
  async getDailyWithTypes() {
    const [lunches, types] = await Promise.all([
      this.lunchesService.findDaily(),
      this.lunchTypesService.findAllActive(),
    ]);
    return { lunches, types };
  }

  @Post('/')
  @UseGuards(AuthGuard)
  async saveLunches(
    @Body(new ParseArrayPipe({ items: CreateLunchDto, whitelist: true })) body: CreateLunchDto[],
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    const updatedBody: CreateLunchDto[] = body.map((lunch) => ({
      ...lunch,
      idusuario: userId,
    }));
    const result = await this.lunchesService.insertLunches(updatedBody);
    return result?.length || 0;
  }

}
