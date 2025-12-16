import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LunchType } from './lunch-types.entity';

@Injectable()
export class LunchTypesService {
  constructor(
    @InjectRepository(LunchType)
    private lunchTypeRepository: Repository<LunchType>,
  ) { }

  async findAllActive(): Promise<LunchType[]> {
    const ACTIVO_STATUS = 'T';

    return this.lunchTypeRepository
      .createQueryBuilder('lunchType')
      .where('lunchType.Activo = :activo', { activo: ACTIVO_STATUS })
      .getMany();
  }
}
