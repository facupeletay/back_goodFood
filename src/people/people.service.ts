import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Person } from './person.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PeopleService {
  constructor(@InjectRepository(Person) private repo: Repository<Person>) {
    this.repo = repo;
  }

  findByName(name: string) {
    if (!name) {
      return null;
    }
    return this.repo.findOneBy({ apellidonombre: name.toLocaleUpperCase() });
  }

  findByFile(file: number) {
    if (!file) {
      return null;
    }
    return this.repo.findOneBy({ legajo: file });
  }

  findAll() {
    return this.repo.find();
  }

  findAllByBranch(branchId: number) {
    return this.repo.find({
      where: { sucursal: { id: branchId } },
    });
  }
}
