import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async signIn(username: string, pass: string) {
    // !!** LAS CONTRASEñAS SE GUARDAN EN TEXTO PLANO EN LA BASE !!** //
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { id: user.id, username: user.usuario };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      ...payload,
    };
  }
}
