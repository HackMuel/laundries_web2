import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CustomersModule } from '../customers/customers.module';
import { OrdersModule } from '../orders/orders.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [CustomersModule, OrdersModule, ServicesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
