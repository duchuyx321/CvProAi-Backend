import { IntersectionType } from '@nestjs/swagger';
import { QueryDto } from './query.dto';
import { QueryTimeDto } from './queryTime.dto';

export class QueryWithTimeDto extends IntersectionType(
    QueryDto,
    QueryTimeDto,
) {}
