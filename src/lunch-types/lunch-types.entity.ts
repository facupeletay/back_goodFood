import { Lunch } from 'src/lunches/lunch.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';

@Entity('tbl_tipoconsumo')
export class LunchType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'char', length: 50 })
  tipoconsumo: string;

  @Column({ type: 'time', default: '00:00:00' })
  desde: string;

  @Column({ type: 'time', default: '00:00:00' })
  hasta: string;

  @Column({ type: 'char', length: 1, default: 'T', name: 'Activo' })
  activo: string;
  
  @Column({ name: 'MaxCantidad', type: 'int', default: 0 })
  maxCantidad: number;

  @OneToMany(() => Lunch, (lunch) => lunch.tipoconsumo)
  almuerzos: Lunch[];
}
