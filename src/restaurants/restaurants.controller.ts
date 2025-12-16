import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { Restaurant } from './restaurant.entity';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private restaurantService: RestaurantsService) {}

  @Get('/')
  @UseGuards(AuthGuard)
  async obtenerRestaurantesPorUsuario(
    @Req() req: Request,
  ): Promise<Restaurant[]> {
    const userId = req['user'].id;
    return this.restaurantService.allByUser(userId);
  }
}
