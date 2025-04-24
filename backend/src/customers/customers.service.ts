import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // Check if customer with email already exists
    const existingCustomer = await this.customersRepository.findOne({
      where: { email: createCustomerDto.email },
    });

    if (existingCustomer) {
      throw new ConflictException('Customer with this email already exists');
    }

    const customer = this.customersRepository.create(createCustomerDto);
    return this.customersRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return this.customersRepository.find();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: { id },
      relations: ['orders'],
    });
    
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingCustomer = await this.customersRepository.findOne({
        where: { email: updateCustomerDto.email },
      });
      
      if (existingCustomer) {
        throw new ConflictException('Email already in use');
      }
    }
    
    Object.assign(customer, updateCustomerDto);
    return this.customersRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customersRepository.remove(customer);
  }

  async getCustomerCount(): Promise<number> {
    return this.customersRepository.count();
  }

  async search(term: string): Promise<Customer[]> {
    return this.customersRepository
      .createQueryBuilder('customer')
      .where('LOWER(customer.firstName) LIKE LOWER(:term)', { term: `%${term}%` })
      .orWhere('LOWER(customer.lastName) LIKE LOWER(:term)', { term: `%${term}%` })
      .orWhere('LOWER(customer.email) LIKE LOWER(:term)', { term: `%${term}%` })
      .orWhere('customer.phone LIKE :term', { term: `%${term}%` })
      .getMany();
  }
}
