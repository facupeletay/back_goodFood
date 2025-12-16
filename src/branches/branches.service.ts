import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from './branch.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BranchesService {
  constructor(@InjectRepository(Branch) private repo: Repository<Branch>) {
    this.repo = repo;
  }
  findAll(): Promise<Branch[]> | null {
    return this.repo.find();
  }
}
