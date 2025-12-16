import { Controller, UseGuards, Get } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/')
  @UseGuards(AuthGuard)
  getAllUsers() {
    return this.usersService.findAll();
  }
}
