import { Test, TestingModule } from '@nestjs/testing';
import { LunchTypesController } from './lunch-types.controller';
import { LunchTypesService } from './lunch-types.service';

describe('LunchTypesController', () => {
  let controller: LunchTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LunchTypesController],
      providers: [LunchTypesService],
    }).compile();

    controller = module.get<LunchTypesController>(LunchTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
