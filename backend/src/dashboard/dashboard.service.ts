import { Injectable } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { OrdersService } from '../orders/orders.service';
import { ServicesService } from '../services/services.service';

@Injectable()
export class DashboardService {
  constructor(
    private customersService: CustomersService,
    private ordersService: OrdersService,
    private servicesService: ServicesService,
  ) {}

  async getDashboardStats() {
    const [totalCustomers, totalOrders, totalRevenue, pendingOrders, revenueData] = await Promise.all([
      this.customersService.getCustomerCount(),
      this.ordersService.getOrderCount(),
      this.ordersService.getTotalRevenue(),
      this.ordersService.getPendingOrderCount(),
      this.ordersService.getRevenueData(6), // Last 6 months
    ]);

    return {
      totalCustomers,
      totalOrders,
      totalRevenue,
      pendingOrders,
      revenueData,
    };
  }
}
