import { Branch } from 'src/branches/branch.entity';
import { Lunch } from 'src/lunches/lunch.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('tbl_padron')
export class Person {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  legajo: number; //22 largo

  @Column()
  apellidonombre: string; // 200

  @Column()
  centrocosto: string; //100

  @Column()
  maxalmuerzos: number;

  @Column()
  pass: string; //20

  @Column({ name: 'sucursal' })
  idSucursal: number;

  @ManyToOne(() => Branch, (branch) => branch.people)
  @JoinColumn({ name: 'sucursal' })
  sucursal: Branch;

  @OneToMany(() => Lunch, (lunch) => lunch.persona)
  almuerzos: Lunch[];
}
