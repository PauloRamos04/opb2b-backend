import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class UpdateCellDto {
  @IsNumber()
  row: number;

  @IsNumber()
  col: number;

  @IsString()
  @IsNotEmpty()
  value: string;
}