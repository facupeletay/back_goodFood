import { IsDateString, IsNumber, IsOptional } from 'class-validator';

export class CreateLunchDto {
  @IsNumber()
  cantidad: number;

  @IsNumber()
  idempleado: number;

  @IsDateString()
  fechahora: string;

  @IsNumber()
  idrestaurant: number;

  @IsNumber()
  @IsOptional()
  idtipoconsumo: number = 1;
}
