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

    // Process order items
    let total = 0;
    if (createOrderDto.items && createOrderDto.items.length > 0) {
      // Save items one by one to ensure orderId is set
      for (const item of createOrderDto.items) {
        const service = await this.servicesService.findOne(item.serviceId);
        if (!service) {
          throw new NotFoundException(`Service with ID ${item.serviceId} not found`);
        }

        const price = service.price;
        const itemTotal = price * item.quantity;
        total += itemTotal;

        // Create and immediately save each item
        const orderItem = this.orderItemsRepository.create({
          orderId: savedOrder.id, // Explicitly set the orderId
          serviceId: item.serviceId,
          quantity: item.quantity,
          price,
          total: itemTotal,
        });

        await this.orderItemsRepository.save(orderItem);
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
    const order = await this.findOne(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (updateOrderDto.status !== undefined) order.status = updateOrderDto.status;
    if (updateOrderDto.note !== undefined) order.note = updateOrderDto.note;
    if (updateOrderDto.customerId !== undefined) order.customerId = updateOrderDto.customerId;
    if (updateOrderDto.paymentMethod) order.paymentMethod = updateOrderDto.paymentMethod;
    if (updateOrderDto.deliveryDate) order.deliveryDate = updateOrderDto.deliveryDate;

    if (updateOrderDto.isPaid === true && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = new Date();
    }

    // Fix for handling order items - ensure orderId is set
    if (updateOrderDto.items && updateOrderDto.items.length > 0) {
      // First, remove existing items
      await this.orderItemsRepository.delete({ orderId: id });

      // Calculate new total
      let total = 0;

      // Create and save items one by one to ensure orderId is set
      for (const item of updateOrderDto.items) {
        const service = await this.servicesService.findOne(item.serviceId);
        if (!service) {
          throw new NotFoundException(`Service with ID ${item.serviceId} not found`);
        }

        const price = service.price;
        const itemTotal = price * item.quantity;
        total += itemTotal;

        // Create and immediately save each item with explicit orderId
        const orderItem = this.orderItemsRepository.create({
          orderId: id,
          serviceId: item.serviceId,
          quantity: item.quantity,
          price,
          total: itemTotal,
        });

        await this.orderItemsRepository.save(orderItem);
      }

      // Update order total
      order.totalAmount = total;
    }

    return this.ordersRepository.save(order);
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
}
