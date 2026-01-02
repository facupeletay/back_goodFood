import { Person } from 'src/people/person.entity';
import { Restaurant } from 'src/restaurants/restaurant.entity';
import { User } from 'src/users/user.entity';
import { LunchType } from 'src/lunch-types/lunch-types.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('tbl_almuerzos')
export class Lunch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  idempleado: number;

  @ManyToOne(() => Person, (person) => person.almuerzos)
  @JoinColumn({ name: 'idempleado' })
  persona: Person;

  @Column({ type: 'timestamp' })
  fechahora: Date;

  @Column()
  cantidad: number;

  @ManyToOne(() => User, (user) => user.almuerzos)
  @JoinColumn({ name: 'idusuario' })
  usuario: User;

  @Column()
  idusuario: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.almuerzos)
  @JoinColumn({ name: 'idrestaurant' })
  restaurante: Restaurant;

  @Column()
  idrestaurant: number;

  @Column()
  idtipoconsumo: number;

  @ManyToOne(() => LunchType, (lunchType) => lunchType.almuerzos)
  @JoinColumn({ name: 'idtipoconsumo' })
  tipoconsumo: LunchType;

  @Column({ nullable: true, unique: true })
  operationId?: string;
}
