import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignInDto } from "./dtos/sign-in.dto";
import { AuthGuard } from "./guards/auth.guard";
import { SkipAuth } from "./decorators/public-route-decorator";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @SkipAuth()
  @Post("login")
  signIn(@Body() signInDto: SignInDto) {
    const username = signInDto.username ?? signInDto.usuario;
    if (!username) {
      throw new BadRequestException("username/usuario es requerido");
    }
    return this.authService.signIn(username, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get("profile")
  getProfile(@Request() req) {
    return req.user;
  }
}
