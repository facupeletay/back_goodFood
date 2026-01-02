import { Body, BadRequestException, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { LunchesService } from './lunches.service';
import { SyncConsumeOperationDto } from './dtos/sync_consume_operation.dto';

@Controller('sync')
export class LunchesSyncController {
  constructor(private lunchesService: LunchesService) {}

  @Post('/consume')
  @UseGuards(AuthGuard)
  async syncConsume(@Body() body: SyncConsumeOperationDto[], @Req() req: Request) {
    if (!Array.isArray(body)) {
      throw new BadRequestException('Body debe ser un array de operaciones.');
    }
    const userId = req['user'].id;
    return this.lunchesService.syncConsume(body, userId);
  }

  @Get('/bootstrap')
  @UseGuards(AuthGuard)
  async bootstrap(@Req() req: Request) {
    const userId = req['user'].id;
    return this.lunchesService.syncBootstrap(userId);
  }
}
