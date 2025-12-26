import { Controller, Post, Body } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { ReserveBookingDto } from './dto/reserve-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('reserve')
  async reserve(@Body() dto: ReserveBookingDto) {
    return await this.bookingsService.reserve(dto);
  }
}

