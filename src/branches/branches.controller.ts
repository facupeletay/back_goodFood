import { Controller, Get, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('branches')
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Get()
  @UseGuards(AuthGuard)
  getAllBranches() {
    return this.branchesService.findAll();
  }
}
