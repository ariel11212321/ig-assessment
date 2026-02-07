import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'shortNumber', standalone: true })
export class ShortNumberPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0';
    if (value < 1000) return value.toString();
    if (value < 1000000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (value < 1000000000) return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    return (value / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
}
