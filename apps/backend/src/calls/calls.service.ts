import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { CallSession } from './call-session.entity';

@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(CallSession)
    private readonly callSessionRepository: Repository<CallSession>,
  ) {}

  async create(): Promise<CallSession> {
    const roomUuid = `call-${randomUUID()}`;
    const session = this.callSessionRepository.create({
      roomUuid,
      status: 'active',
      masterFilePath: null,
    });
    return this.callSessionRepository.save(session);
  }

  async findActive(): Promise<CallSession[]> {
    return this.callSessionRepository.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  async end(id: string): Promise<CallSession> {
    const session = await this.callSessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Call session ${id} not found`);
    }
    session.status = 'ended';
    return this.callSessionRepository.save(session);
  }

  async assignMasterFilePath(
    sessionId: string,
    masterFilePath: string,
  ): Promise<CallSession | null> {
    const session = await this.callSessionRepository.findOne({
      where: { id: sessionId, status: 'active' },
    });
    if (!session || session.masterFilePath) {
      return null;
    }
    session.masterFilePath = masterFilePath;
    return this.callSessionRepository.save(session);
  }
}
