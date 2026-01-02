import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Lunch } from './lunch.entity';
import { CreateLunchDto } from './dtos/create_lunch.dto';
import { LunchType } from 'src/lunch-types/lunch-types.entity';
import { SyncConsumeOperationDto } from './dtos/sync_consume_operation.dto';
import { Branch } from 'src/branches/branch.entity';
import { Person } from 'src/people/person.entity';
import { User } from 'src/users/user.entity';

type SyncConsumeStatus = 'ACCEPTED' | 'REJECTED';

type SyncConsumeResult = {
  operationId: string;
  status: SyncConsumeStatus;
  reason?: string;
};

@Injectable()
export class LunchesService {
  constructor(@InjectRepository(Lunch) private repo: Repository<Lunch>) {}

  findAllByPerson(personId: number) {
    return this.repo.find({ where: { persona: { id: personId } } });
  }

  async findDaily() {
    const { from, to } = this.getDayRange(new Date().toISOString());
    return this.repo
      .createQueryBuilder('alm')
      .select([
        'alm.id',
        'alm.idempleado',
        'alm.fechahora',
        'alm.cantidad',
        'alm.idusuario',
        'alm.idrestaurant',
        'alm.idtipoconsumo',
      ])
      .where('alm.fechahora BETWEEN :from AND :to', { from, to })
      .getMany();
  }

  // Normaliza a limites diarios en UTC-3 (Argentina) para evitar desfasajes por zona horaria.
  private getDayRange(dateStr: string) {
    const date = new Date(dateStr);
    const offsetMs = 3 * 60 * 60 * 1000;
    const local = new Date(date.getTime() - offsetMs);
    const year = local.getUTCFullYear();
    const month = local.getUTCMonth();
    const day = local.getUTCDate();
    const from = new Date(Date.UTC(year, month, day, 3, 0, 0, 0));
    const to = new Date(Date.UTC(year, month, day + 1, 2, 59, 59, 999));
    return { from, to };
  }

  private buildBatchTotals(lunchesArray: CreateLunchDto[]) {
    const batchTotals = new Map<
      string,
      { total: number; indexes: number[]; sample: CreateLunchDto }
    >();

    lunchesArray.forEach((lunch, idx) => {
      const typeId = lunch.idtipoconsumo ?? 1;
      const { from } = this.getDayRange(lunch.fechahora);
      const key = `${lunch.idempleado}|${typeId}|${from.toISOString()}`;
      const current = batchTotals.get(key) ?? {
        total: 0,
        indexes: [],
        sample: lunch,
      };
      current.total += lunch.cantidad;
      current.indexes.push(idx);
      // keep first sample only; it's just for context
      batchTotals.set(key, current);
    });

    return batchTotals;
  }

  private isValidDateString(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    return !Number.isNaN(Date.parse(value));
  }

  private isValidSyncPayload(payload: CreateLunchDto | undefined | null): payload is CreateLunchDto {
    if (!payload) {
      return false;
    }
    const hasValidNumber = (value: unknown) =>
      typeof value === 'number' && Number.isFinite(value);
    if (
      !hasValidNumber(payload.idempleado) ||
      !hasValidNumber(payload.cantidad) ||
      payload.cantidad <= 0 ||
      !hasValidNumber(payload.idrestaurant) ||
      !this.isValidDateString(payload.fechahora)
    ) {
      return false;
    }
    if (
      payload.idtipoconsumo !== undefined &&
      !hasValidNumber(payload.idtipoconsumo)
    ) {
      return false;
    }
    return true;
  }

  private async validateBatch(lunchesArray: CreateLunchDto[], manager: EntityManager) {
    const batchTotals = this.buildBatchTotals(lunchesArray);
    const typeIds = Array.from(new Set(lunchesArray.map((l) => l.idtipoconsumo ?? 1)));
    const lunchTypeRepo = manager.getRepository(LunchType);
    const lunchRepo = manager.getRepository(Lunch);

    const types = await lunchTypeRepo.findBy({ id: In(typeIds) });
    const typeMaxMap = new Map<number, number>(types.map((t) => [t.id, t.maxCantidad]));

    const validations = await Promise.all(
      Array.from(batchTotals.entries()).map(async ([key, info]) => {
        const [employeeIdStr, typeIdStr, dayIso] = key.split('|');
        const employeeId = Number(employeeIdStr);
        const typeId = Number(typeIdStr);
        const { from, to } = this.getDayRange(dayIso);

        const maxCantidad = typeMaxMap.get(typeId) ?? 0;

        const row = await lunchRepo
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
          totalInBatch: info.total,
          indexes: info.indexes,
          dayIso,
        };
      }),
    );

    const errors = validations
      .filter((v) => v.maxCantidad <= 0 || v.consumido + v.totalInBatch > v.maxCantidad)
      .map((v) => ({
        employeeId: v.employeeId,
        typeId: v.typeId,
        day: v.dayIso,
        indexes: v.indexes,
        consumido: v.consumido,
        agrega: v.totalInBatch,
        max: v.maxCantidad,
        reason:
          v.maxCantidad <= 0 ? 'max_cantidad_no_configurado' : 'supera_max_diario',
        message:
          v.maxCantidad <= 0
            ? `Empleado ${v.employeeId} tipo ${v.typeId} no tiene MaxCantidad configurado o es 0`
            : `Empleado ${v.employeeId} tipo ${v.typeId} supera max diario ${v.maxCantidad} (consumido: ${v.consumido}, intenta agregar: ${v.totalInBatch})`,
      }));

    if (errors.length) {
      throw new BadRequestException({
        message: 'Se superaron los limites diarios para uno o mas consumos',
        errors,
      });
    }
  }

  async insertLunches(lunchesArray: CreateLunchDto[]) {
    return this.repo.manager.transaction(async (manager) => {
      await this.validateBatch(lunchesArray, manager);
      return manager.getRepository(Lunch).save(lunchesArray);
    });
  }

  async syncBootstrap(userId: number) {
    const manager = this.repo.manager;
    const lunchTypeRepo = manager.getRepository(LunchType);
    const userRepo = manager.getRepository(User);

    const [branches, people, lunchTypes, consumptions, user] = await Promise.all([
      manager.getRepository(Branch).find(),
      manager.getRepository(Person).find(),
      lunchTypeRepo
        .createQueryBuilder('lunchType')
        .where('lunchType.Activo = :activo', { activo: 'T' })
        .getMany(),
      this.findDaily(),
      userRepo.findOne({ where: { id: userId }, relations: ['restaurantes'] }),
    ]);

    return {
      branches,
      lastUpdates: [],
      lunches: [],
      people,
      restaurants: user?.restaurantes ?? [],
      lunchTypes,
      consumptions,
      user: user ? { id: user.id, username: user.usuario } : null,
    };
  }

  async syncConsume(operations: SyncConsumeOperationDto[], userId: number) {
    return this.repo.manager.transaction(async (manager) => {
      const results: SyncConsumeResult[] = new Array(operations.length);
      const seenOperationIds = new Set<string>();
      const validOps: Array<{
        index: number;
        operationId: string;
        payload: CreateLunchDto;
        typeId: number;
        key: string;
        from: Date;
        to: Date;
      }> = [];

      operations.forEach((operation, index) => {
        const operationId = operation?.operationId;
        if (!operationId || typeof operationId !== 'string') {
          results[index] = {
            operationId: operationId ?? '',
            status: 'REJECTED',
            reason: 'operation_id_invalido',
          };
          return;
        }

        if (seenOperationIds.has(operationId)) {
          results[index] = {
            operationId,
            status: 'REJECTED',
            reason: 'operation_id_duplicado',
          };
          return;
        }
        seenOperationIds.add(operationId);

        if (operation.type !== 'create_lunch') {
          results[index] = {
            operationId,
            status: 'REJECTED',
            reason: 'tipo_no_soportado',
          };
          return;
        }

        if (!this.isValidSyncPayload(operation.payload)) {
          results[index] = {
            operationId,
            status: 'REJECTED',
            reason: 'payload_invalido',
          };
          return;
        }

        const payload = operation.payload;
        const typeId = payload.idtipoconsumo ?? 1;
        const { from, to } = this.getDayRange(payload.fechahora);
        const key = `${payload.idempleado}|${typeId}|${from.toISOString()}`;

        validOps.push({
          index,
          operationId,
          payload,
          typeId,
          key,
          from,
          to,
        });
      });

      if (!validOps.length) {
        return { results };
      }

      const operationIds = validOps.map((op) => op.operationId);
      const typeIds = Array.from(new Set(validOps.map((op) => op.typeId)));
      const lunchTypeRepo = manager.getRepository(LunchType);
      const lunchRepo = manager.getRepository(Lunch);

      const existingOps = await lunchRepo.find({
        select: ['operationId'],
        where: { operationId: In(operationIds) },
      });
      const existingOpIds = new Set(
        existingOps
          .map((op) => op.operationId)
          .filter((opId): opId is string => Boolean(opId)),
      );

      const types = await lunchTypeRepo.findBy({ id: In(typeIds) });
      const typeMaxMap = new Map<number, number>(
        types.map((type) => [type.id, type.maxCantidad]),
      );

      const groupMap = new Map<
        string,
        { employeeId: number; typeId: number; from: Date; to: Date }
      >();
      validOps.forEach((op) => {
        if (!groupMap.has(op.key)) {
          groupMap.set(op.key, {
            employeeId: op.payload.idempleado,
            typeId: op.typeId,
            from: op.from,
            to: op.to,
          });
        }
      });

      const consumidoMap = new Map<string, number>();
      await Promise.all(
        Array.from(groupMap.entries()).map(async ([key, info]) => {
          const row = await lunchRepo
            .createQueryBuilder('alm')
            .select('COALESCE(SUM(alm.cantidad), 0)', 'consumido')
            .where('alm.idempleado = :emp', { emp: info.employeeId })
            .andWhere('alm.idtipoconsumo = :tipo', { tipo: info.typeId })
            .andWhere('alm.fechahora BETWEEN :from AND :to', {
              from: info.from,
              to: info.to,
            })
            .getRawOne<{ consumido: string }>();

          const consumido = Number(row?.consumido ?? 0);
          consumidoMap.set(key, consumido);
        }),
      );

      const acceptedTotals = new Map<string, number>();
      const toInsert: Array<CreateLunchDto & { idusuario: number; operationId?: string }> = [];

      validOps.forEach((op) => {
        if (existingOpIds.has(op.operationId)) {
          results[op.index] = {
            operationId: op.operationId,
            status: 'ACCEPTED',
          };
          return;
        }

        const maxCantidad = typeMaxMap.get(op.typeId) ?? 0;
        if (maxCantidad <= 0) {
          results[op.index] = {
            operationId: op.operationId,
            status: 'REJECTED',
            reason: 'max_cantidad_no_configurado',
          };
          return;
        }

        const consumido = consumidoMap.get(op.key) ?? 0;
        const accepted = acceptedTotals.get(op.key) ?? 0;
        const projected = consumido + accepted + op.payload.cantidad;

        if (projected > maxCantidad) {
          results[op.index] = {
            operationId: op.operationId,
            status: 'REJECTED',
            reason: 'rechazado_por_consumo_diario_excedido',
          };
          return;
        }

        acceptedTotals.set(op.key, accepted + op.payload.cantidad);
        results[op.index] = {
          operationId: op.operationId,
          status: 'ACCEPTED',
        };
        toInsert.push({
          ...op.payload,
          idusuario: userId,
          idtipoconsumo: op.typeId,
          operationId: op.operationId,
        });
      });

      if (toInsert.length) {
        await manager.getRepository(Lunch).save(toInsert);
      }

      return { results };
    });
  }
}
