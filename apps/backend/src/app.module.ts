import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallsModule } from './calls/calls.module';
import { CallSession } from './calls/call-session.entity';
import { RecordingsModule } from './recordings/recordings.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
      username: process.env.DATABASE_USER ?? 'monitor',
      password: process.env.DATABASE_PASSWORD ?? 'monitor',
      database: process.env.DATABASE_NAME ?? 'monitor',
      entities: [CallSession],
      synchronize: true,
    }),
    CallsModule,
    RecordingsModule,
  ],
})
export class AppModule {}
