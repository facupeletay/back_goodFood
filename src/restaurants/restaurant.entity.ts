import { Lunch } from 'src/lunches/lunch.entity';
import { User } from 'src/users/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';

@Entity('tbl_restaurant')
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  descripcion: string;

  @ManyToMany(() => User, (user) => user.restaurantes)
  @JoinTable({
    name: 'tbl_usuarios_resto',
    joinColumn: {
      name: 'idrestaurant',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'idusuario',
      referencedColumnName: 'id',
    },
  })
  usuarios: User[];

  @OneToMany(() => Lunch, (lunch) => lunch.restaurante)
  almuerzos: Restaurant[];
}
