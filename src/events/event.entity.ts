import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Booking } from '../bookings/booking.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'int', name: 'total_seats' })
  totalSeats: number;

  @OneToMany(() => Booking, (booking) => booking.event)
  bookings: Booking[];
}

