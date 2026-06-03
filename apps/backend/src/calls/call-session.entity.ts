import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('call_sessions')
export class CallSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  roomUuid: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  masterFilePath: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
