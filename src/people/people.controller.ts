import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { PeopleService } from './people.service';

@Controller('people')
export class PeopleController {
  constructor(private peopleService: PeopleService) {}

  @Get('/branch/:branchId')
  @UseGuards(AuthGuard)
  getAllByBranch(@Param('branchId') branchId: string) {
    return this.peopleService.findAllByBranch(parseInt(branchId));
  }
}
