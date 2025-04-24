import { IsNotEmpty, IsString, IsArray, ValidateNested, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsNotEmpty()
  quantity: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  note?: string;
  
  @IsOptional()
  @IsString()
  paymentMethod?: string;
  
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
  
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deliveryDate?: Date;
}
