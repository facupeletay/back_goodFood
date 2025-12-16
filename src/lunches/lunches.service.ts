import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Lunch } from './lunch.entity';
import { CreateLunchDto } from './dtos/create_lunch.dto';
import { LunchType } from 'src/lunch-types/lunch-types.entity';

@Injectable()
export class LunchesService {
  constructor(
    @InjectRepository(Lunch) private repo: Repository<Lunch>,
    @InjectRepository(LunchType) private lunchTypesRepo: Repository<LunchType>,
  ) {}

  findAllByPerson(personId: number) {
    return this.repo.find({ where: { persona: { id: personId } } });
  }

  // Normaliza a límites diarios en UTC para evitar desfasajes por zona horaria.
  private getDayRange(dateStr: string) {
    const date = new Date(dateStr);
    const from = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
    );
    const to = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
    );
    return { from, to };
  }

  private buildBatchTotals(lunchesArray: CreateLunchDto[]) {
    const batchTotals = new Map<string, number>();

    for (const lunch of lunchesArray) {
      const typeId = lunch.idtipoconsumo ?? 1;
      const { from } = this.getDayRange(lunch.fechahora);
      const key = `${lunch.idempleado}|${typeId}|${from.toISOString()}`;
      batchTotals.set(key, (batchTotals.get(key) ?? 0) + lunch.cantidad);
    }

    return batchTotals;
  }

  private async validateBatch(lunchesArray: CreateLunchDto[]) {
    const batchTotals = this.buildBatchTotals(lunchesArray);
    const typeIds = Array.from(new Set(lunchesArray.map((l) => l.idtipoconsumo ?? 1)));
    const types = await this.lunchTypesRepo.findBy({ id: In(typeIds) });
    const typeMaxMap = new Map<number, number>(types.map((t) => [t.id, t.maxCantidad]));

    const validations = await Promise.all(
      Array.from(batchTotals.entries()).map(async ([key, totalInBatch]) => {
        const [employeeIdStr, typeIdStr, dayIso] = key.split('|');
        const employeeId = Number(employeeIdStr);
        const typeId = Number(typeIdStr);
        const { from, to } = this.getDayRange(dayIso);

        const maxCantidad = typeMaxMap.get(typeId) ?? 0;

        const row = await this.repo
          .createQueryBuilder('alm')
          .select('COALESCE(SUM(alm.cantidad), 0)', 'consumido')
          .where('alm.idempleado = :emp', { emp: employeeId })
          .andWhere('alm.idtipoconsumo = :tipo', { tipo: typeId })
          .andWhere('alm.fechahora BETWEEN :from AND :to', { from, to })
          .getRawOne<{ consumido: string }>();

        const consumido = Number(row?.consumido ?? 0);

        return {
          key,
          employeeId,
          typeId,
          maxCantidad,
          consumido,
          totalInBatch,
        };
      }),
    );

    const errors = validations
      .filter((v) => v.maxCantidad <= 0 || v.consumido + v.totalInBatch > v.maxCantidad)
      .map((v) => {
        if (v.maxCantidad <= 0) {
          return `Empleado ${v.employeeId} tipo ${v.typeId} no tiene MaxCantidad configurado o es 0`;
        }
        return `Empleado ${v.employeeId} tipo ${v.typeId} supera max diario ${v.maxCantidad} (consumido: ${v.consumido}, intenta agregar: ${v.totalInBatch})`;
      });

    if (errors.length) {
      throw new BadRequestException({
        message: 'Se superaron los limites diarios para uno o mas consumos',
        errors,
      });
    }
  }

  async insertLunches(lunchesArray: CreateLunchDto[]) {
    await this.validateBatch(lunchesArray);

    return this.repo.save(lunchesArray);
  }
}
