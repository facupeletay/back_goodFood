import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Utc3Interceptor } from './common/interceptors/utc3.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  app.useGlobalInterceptors(new Utc3Interceptor());
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log('App statrted in port:', port);
}
bootstrap();
