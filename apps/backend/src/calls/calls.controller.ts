import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallSession } from './call-session.entity';

@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('create')
  async create(): Promise<{ id: string; roomUuid: string }> {
    const session = await this.callsService.create();
    return { id: session.id, roomUuid: session.roomUuid };
  }

  @Get('active')
  async findActive(): Promise<CallSession[]> {
    return this.callsService.findActive();
  }

  @Patch(':id/end')
  async end(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CallSession> {
    return this.callsService.end(id);
  }
}
