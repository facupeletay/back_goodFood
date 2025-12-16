import { Person } from 'src/people/person.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity('tbl_sucursal')
export class Branch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sucursal: string;

  @OneToMany(() => Person, (person) => person.sucursal)
  people: Person[];
}
