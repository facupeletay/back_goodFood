import { Test, TestingModule } from '@nestjs/testing';
import { LunchesController } from './lunches.controller';

describe('LunchesController', () => {
  let controller: LunchesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LunchesController],
    }).compile();

    controller = module.get<LunchesController>(LunchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
