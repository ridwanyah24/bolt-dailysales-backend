import { NestInterceptor, ExecutionContext, CallHandler, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Prisma } from '@prisma/client';

function convertDecimal(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === 'object') {
    if (value instanceof Prisma.Decimal) {
      return Number(value);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Array.isArray(value)) {
      return value.map(convertDecimal);
    }
    for (const key of Object.keys(value)) {
      value[key] = convertDecimal(value[key]);
    }
  }
  return value;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data === undefined || data === null) return data;
        return convertDecimal(JSON.parse(JSON.stringify(data)));
      }),
    );
  }
}
