import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {
    this.repo = repo;
  }

  findOne(username: string) {
    if (!username) {
      return null;
    }
    return this.repo.findOneBy({ usuario: username });
  }

  findAll(): Promise<User[]> | null {
    return this.repo.find();
  }
}
