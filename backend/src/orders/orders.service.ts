import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CustomersService } from '../customers/customers.service';
import { ServicesService } from '../services/services.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { generateOrderNumber } from '../utils/order-number';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    private customersService: CustomersService,
    private servicesService: ServicesService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Log the incoming DTO for debugging
    console.log('Create Order DTO:', JSON.stringify(createOrderDto, null, 2));

    const customer = await this.customersService.findOne(createOrderDto.customerId);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${createOrderDto.customerId} not found`);
    }

    // Create order first
    const order = this.ordersRepository.create({
      customerId: createOrderDto.customerId,
      note: createOrderDto.note,
      orderNumber: await generateOrderNumber(),
      status: OrderStatus.PENDING,
      isPaid: createOrderDto.isPaid || false,
      paymentMethod: createOrderDto.paymentMethod,
      deliveryDate: createOrderDto.deliveryDate,
      totalAmount: 0,
    });

    // Save order first to get its ID
    const savedOrder = await this.ordersRepository.save(order);

    // Log the saved order for debugging
    console.log('Saved Order:', JSON.stringify(savedOrder, null, 2));

    // Process order items
    let total = 0;
    if (createOrderDto.items && createOrderDto.items.length > 0) {
      for (const item of createOrderDto.items) {
        const service = await this.servicesService.findOne(item.serviceId);
        if (!service) {
          throw new NotFoundException(`Service with ID ${item.serviceId} not found`);
        }

        const price = service.price;
        const itemTotal = price * item.quantity;
        total += itemTotal;

        // Save directly instead of creating and then saving
        await this.orderItemsRepository.save({
          orderId: savedOrder.id, // Make sure we use the ID from the saved order
          serviceId: item.serviceId,
          quantity: item.quantity,
          price,
          total: itemTotal,
        });
      }
    }

    // Update order with total amount and save again
    savedOrder.totalAmount = total;
    if (savedOrder.isPaid) {
      savedOrder.paidAt = new Date();
    }

    return this.ordersRepository.save(savedOrder);
  }

  async findAll(status?: OrderStatus): Promise<Order[]> {
    const query = this.ordersRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.service', 'service')
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      query.where('order.status = :status', { status });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.service'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    console.log(`Updating order ${id} with data:`, JSON.stringify(updateOrderDto, null, 2));
    
    // First find the order to ensure it exists
    const order = await this.findOne(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Update basic order fields
    if (updateOrderDto.status !== undefined) order.status = updateOrderDto.status;
    if (updateOrderDto.note !== undefined) order.note = updateOrderDto.note;
    if (updateOrderDto.customerId !== undefined) order.customerId = updateOrderDto.customerId;
    if (updateOrderDto.paymentMethod) order.paymentMethod = updateOrderDto.paymentMethod;
    if (updateOrderDto.deliveryDate) order.deliveryDate = updateOrderDto.deliveryDate;

    if (updateOrderDto.isPaid === true && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = new Date();
    }

    // Save order first to ensure we have the ID
    const savedOrder = await this.ordersRepository.save(order);

    // Handle order items if provided
    if (updateOrderDto.items && updateOrderDto.items.length > 0) {
      try {
        console.log(`Removing existing items for order ${id}`);
        // First delete existing items using a direct query to ensure clean slate
        await this.orderItemsRepository.createQueryBuilder()
          .delete()
          .where("orderId = :orderId", { orderId: id })
          .execute();
          
        console.log(`Adding ${updateOrderDto.items.length} new items`);
        
        // Calculate new total
        let total = 0;
        
        // Create and insert new items directly using query builder
        for (const item of updateOrderDto.items) {
          const service = await this.servicesService.findOne(item.serviceId);
          if (!service) {
            throw new NotFoundException(`Service with ID ${item.serviceId} not found`);
          }
          
          const price = service.price;
          const itemTotal = price * item.quantity;
          total += itemTotal;
          
          // Insert using direct query builder to avoid entity issues
          await this.orderItemsRepository.createQueryBuilder()
            .insert()
            .into('order_items')
            .values({
              id: this.generateUUID(),
              orderId: id,
              serviceId: item.serviceId,
              quantity: item.quantity,
              price: price,
              total: itemTotal
            })
            .execute();
            
          console.log(`Added item for service ${item.serviceId}`);
        }
        
        // Update the total amount
        console.log(`Setting total amount to ${total}`);
        await this.ordersRepository
          .createQueryBuilder()
          .update()
          .set({ totalAmount: total })
          .where("id = :id", { id })
          .execute();
          
      } catch (error) {
        console.error('Error processing order items:', error);
        throw error;
      }
    }

    // Return the updated order with refreshed data
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.ordersRepository.remove(order);
  }

  async getOrderCount(): Promise<number> {
    return this.ordersRepository.count();
  }

  async getPendingOrderCount(): Promise<number> {
    return this.ordersRepository.count({ where: { status: OrderStatus.PENDING } });
  }

  async getTotalRevenue(): Promise<number> {
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.isPaid = :isPaid', { isPaid: true })
      .getRawOne();

    return result.total ? parseFloat(result.total) : 0;
  }

  async getRevenueData(months: number = 6): Promise<any> {
    const today = new Date();
    const labels = [];
    const revenue = [];
    const orders = [];

    // Generate last n months
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      labels.push(monthName);

      const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
      const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      // Get revenue for the month
      const revenueResult = await this.ordersRepository
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'total')
        .where('order.createdAt >= :startDate', { startDate })
        .andWhere('order.createdAt <= :endDate', { endDate })
        .getRawOne();

      revenue.push(revenueResult.total ? parseFloat(revenueResult.total) : 0);

      // Get order count for the month
      const orderCount = await this.ordersRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
        },
      });

      orders.push(orderCount);
    }

    return { labels, revenue, orders };
  }

  // Add this helper method to generate UUIDs
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
