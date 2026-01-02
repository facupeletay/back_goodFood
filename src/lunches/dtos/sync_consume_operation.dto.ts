import { CreateLunchDto } from './create_lunch.dto';

export class SyncConsumeOperationDto {
  operationId: string;
  type: string;
  payload: CreateLunchDto;
  createdAt?: string;
}
