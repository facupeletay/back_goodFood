import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { Restaurant } from './restaurant.entity';

@Injectable()
export class RestaurantsService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {
    this.userRepo = userRepo;
  }
  async allByUser(userId: number): Promise<Restaurant[]> {
    const usuario = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['restaurantes'],
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return usuario.restaurantes;
  }
}
