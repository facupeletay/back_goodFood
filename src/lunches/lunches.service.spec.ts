import { Test, TestingModule } from '@nestjs/testing';
import { LunchesService } from './lunches.service';

describe('LunchesService', () => {
  let service: LunchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LunchesService],
    }).compile();

    service = module.get<LunchesService>(LunchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
