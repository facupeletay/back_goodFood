import { Lunch } from 'src/lunches/lunch.entity';
import { Restaurant } from 'src/restaurants/restaurant.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';

@Entity('tbl_usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  usuario: string;

  @Column()
  password: string;

  @OneToMany(() => Lunch, (lunch) => lunch.usuario)
  almuerzos: Lunch[];

  @ManyToMany(() => Restaurant, (restaurant) => restaurant.usuarios)
  restaurantes: Restaurant[];
}
