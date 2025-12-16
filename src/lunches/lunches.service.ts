import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lunch } from './lunch.entity';
import { CreateLunchDto } from './dtos/create_lunch.dto';

@Injectable()
export class LunchesService {
  constructor(@InjectRepository(Lunch) private repo: Repository<Lunch>) {
    this.repo = repo;
  }

  findAllByPerson(personId: number) {
    return this.repo.find({ where: { persona: { id: personId } } });
  }

  private getDayRange(dateStr: string) {
    const date = new Date(dateStr);
    const from = new Date(date);
    from.setHours(0, 0, 0, 0);
    const to = new Date(date);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  private async ensureCapacity(lunch: CreateLunchDto, extraInBatch: number) {
    const { from, to } = this.getDayRange(lunch.fechahora);
    const typeId = lunch.idtipoconsumo ?? 1;

    const row = await this.repo
      .createQueryBuilder('alm')
      .leftJoin('alm.tipoconsumo', 'tipo')
      .select('COALESCE(SUM(alm.cantidad), 0)', 'consumido')
      .addSelect('MAX(tipo.MaxCantidad)', 'maxCantidad')
      .where('alm.idempleado = :emp', { emp: lunch.idempleado })
      .andWhere('alm.idtipoconsumo = :tipo', { tipo: typeId })
      .andWhere('alm.fechahora BETWEEN :from AND :to', { from, to })
      .getRawOne<{ consumido: string; maxCantidad: string }>();

    const consumido = Number(row?.consumido ?? 0);
    const maxCantidad = Number(row?.maxCantidad ?? 0);

    if (
      maxCantidad > 0 &&
      consumido + lunch.cantidad + extraInBatch > maxCantidad
    ) {
      throw new BadRequestException(
        `Maximo diario (${maxCantidad}) superado para empleado ${lunch.idempleado} en tipo ${typeId}`,
      );
    }
  }

  async insertLunches(lunchesArray: CreateLunchDto[]) {
    const batchTotals = new Map<string, number>();

    for (const lunch of lunchesArray) {
      const typeId = lunch.idtipoconsumo ?? 1;
      const { from } = this.getDayRange(lunch.fechahora);
      const key = `${lunch.idempleado}|${typeId}|${from.toISOString()}`;
      batchTotals.set(key, (batchTotals.get(key) ?? 0) + lunch.cantidad);
    }

    for (const lunch of lunchesArray) {
      const typeId = lunch.idtipoconsumo ?? 1;
      const { from } = this.getDayRange(lunch.fechahora);
      const key = `${lunch.idempleado}|${typeId}|${from.toISOString()}`;
      const extraInBatch = (batchTotals.get(key) ?? 0) - lunch.cantidad;
      await this.ensureCapacity(lunch, extraInBatch);
    }

    return this.repo.save(lunchesArray);
  }
}
