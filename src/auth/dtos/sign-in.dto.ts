import { IsOptional, IsString } from "class-validator";

export class SignInDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  usuario?: string;

  @IsString()
  password: string;
}
