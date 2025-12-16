import {Test, TestingModule} from '@nestjs/testing';
import {LunchTypesService} from './lunch-types.service';

describe('LunchTypesService', () => {
  let service: LunchTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LunchTypesService],
    }).compile();

    service = module.get<LunchTypesService>(LunchTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
