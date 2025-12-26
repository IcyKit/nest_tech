import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { Booking } from './booking.entity';
import { Event } from '../events/event.entity';
import { ReserveBookingDto } from './dto/reserve-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  async reserve(dto: ReserveBookingDto): Promise<Booking> {
    const lockKey = `booking:lock:${dto.event_id}:${dto.user_id}`;
    const eventCacheKey = `event:${dto.event_id}`;
    const bookingCheckKey = `booking:check:${dto.event_id}:${dto.user_id}`;

    const lockAcquired = await this.redis.set(
      lockKey,
      '1',
      'EX',
      10,
      'NX',
    );

    if (!lockAcquired) {
      throw new ConflictException(
        'Booking request is already being processed',
      );
    }

    try {
      const cachedBookingCheck = await this.redis.get(bookingCheckKey);
      if (cachedBookingCheck === '1') {
        throw new ConflictException(
          `User ${dto.user_id} has already booked a seat for event ${dto.event_id}`,
        );
      }

      let event = JSON.parse(await this.redis.get(eventCacheKey) || 'null');
      
      if (!event) {
        event = await this.eventsRepository.findOne({
          where: { id: dto.event_id },
        });

        if (!event) {
          throw new BadRequestException(`Event with id ${dto.event_id} not found`);
        }

        await this.redis.set(
          eventCacheKey,
          JSON.stringify(event),
          'EX',
          3600,
        );
      }

      const existingBooking = await this.bookingsRepository.findOne({
        where: {
          eventId: dto.event_id,
          userId: dto.user_id,
        },
      });

      if (existingBooking) {
        await this.redis.set(bookingCheckKey, '1', 'EX', 86400);
        throw new ConflictException(
          `User ${dto.user_id} has already booked a seat for event ${dto.event_id}`,
        );
      }

      const bookedCountKey = `event:booked:${dto.event_id}`;
      let bookedCount = parseInt(await this.redis.get(bookedCountKey) || '0');

      if (bookedCount === 0) {
        bookedCount = await this.bookingsRepository.count({
          where: { eventId: dto.event_id },
        });
        await this.redis.set(bookedCountKey, bookedCount.toString(), 'EX', 3600);
      }

      if (bookedCount >= event.totalSeats) {
        throw new BadRequestException('No available seats for this event');
      }

      const booking = this.bookingsRepository.create({
        eventId: dto.event_id,
        userId: dto.user_id,
      });

      const savedBooking = await this.bookingsRepository.save(booking);

      await this.redis.incr(bookedCountKey);
      await this.redis.set(bookingCheckKey, '1', 'EX', 86400);

      return savedBooking;
    } finally {
      await this.redis.del(lockKey);
    }
  }
}

