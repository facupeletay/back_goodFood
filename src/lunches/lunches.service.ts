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

    const validations = await Promise.all(
      Array.from(batchTotals.entries()).map(async ([key, totalInBatch]) => {
        const [employeeIdStr, typeIdStr, dayIso] = key.split('|');
        const employeeId = Number(employeeIdStr);
        const typeId = Number(typeIdStr);
        const { from, to } = this.getDayRange(dayIso);

        const row = await this.repo
          .createQueryBuilder('alm')
          .leftJoin('alm.tipoconsumo', 'tipo')
          .select('COALESCE(SUM(alm.cantidad), 0)', 'consumido')
          .addSelect('MAX(tipo.MaxCantidad)', 'maxCantidad')
          .where('alm.idempleado = :emp', { emp: employeeId })
          .andWhere('alm.idtipoconsumo = :tipo', { tipo: typeId })
          .andWhere('alm.fechahora BETWEEN :from AND :to', { from, to })
          .getRawOne<{ consumido: string; maxCantidad: string }>();

        const consumido = Number(row?.consumido ?? 0);
        const maxCantidad = Number(row?.maxCantidad ?? 0);

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
      .filter((v) => v.maxCantidad > 0)
      .filter((v) => v.consumido + v.totalInBatch > v.maxCantidad)
      .map(
        (v) =>
          `Empleado ${v.employeeId} tipo ${v.typeId} supera max diario ${v.maxCantidad} (consumido: ${v.consumido}, intenta agregar: ${v.totalInBatch})`,
      );

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
