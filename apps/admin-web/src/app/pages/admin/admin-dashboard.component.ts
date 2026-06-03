import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { adminJitsiConfig } from '../../config/jitsi-presets';
import { CallSession } from '../../models/call-session.model';
import { CallsApiService } from '../../services/calls-api.service';
import {
  JitsiContainerNotReadyError,
  JitsiService,
} from '../../services/jitsi.service';
import { UiFeedbackService } from '../../services/ui-feedback.service';
import { JitsiMeetExternalAPI } from '../../types/jitsi-external-api';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('jitsiContainer', { static: false })
  jitsiContainer?: ElementRef<HTMLDivElement>;

  activeCalls: CallSession[] = [];
  loading = false;
  selectedCall: CallSession | null = null;
  monitoring = false;
  terminating = false;

  private readonly injector = inject(Injector);
  private readonly cdr = inject(ChangeDetectorRef);
  private api: JitsiMeetExternalAPI | null = null;

  constructor(
    private readonly callsApi: CallsApiService,
    private readonly jitsiService: JitsiService,
    private readonly uiFeedback: UiFeedbackService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly location: Location
  ) {}

  ngOnInit(): void {
    void this.bootstrap();
  }

  ngOnDestroy(): void {
    this.disposeMeeting();
  }

  async loadActiveCalls(): Promise<void> {
    this.loading = true;
    try {
      this.activeCalls = await firstValueFrom(this.callsApi.findActive());
    } catch {
      await this.uiFeedback.showError('Could not load active calls.');
      this.activeCalls = [];
    } finally {
      this.loading = false;
    }
  }

  async selectCall(call: CallSession): Promise<void> {
    if (this.selectedCall?.id === call.id && this.monitoring) {
      return;
    }
    this.disposeMeeting();
    this.selectedCall = call;
    try {
      await this.jitsiService.loadApi();
      this.monitoring = true;
      this.setMonitorQueryParams(call);
      await this.scheduleEmbed(call.roomUuid);
    } catch (err) {
      await this.uiFeedback.showError(JitsiService.formatJoinError(err));
      this.selectedCall = null;
      this.monitoring = false;
      await this.clearMonitorQueryParams();
    }
  }

  intervene(): void {
    if (!this.api) {
      return;
    }
    this.api.executeCommand('toggleAudio');
  }

  async terminateCall(): Promise<void> {
    if (!this.api || !this.selectedCall || this.terminating) {
      return;
    }
    this.terminating = true;
    const sessionId = this.selectedCall.id;
    try {
      this.api.executeCommand('endConference');
      await firstValueFrom(this.callsApi.end(sessionId));
      await this.uiFeedback.showMessage('Call terminated.');
    } catch {
      await this.uiFeedback.showError(
        'Terminate failed. Check backend and try again.'
      );
    } finally {
      this.disposeMeeting();
      this.selectedCall = null;
      this.monitoring = false;
      this.terminating = false;
      await this.clearMonitorQueryParams();
      await this.loadActiveCalls();
    }
  }

  formatCreatedAt(value: string): string {
    return new Date(value).toLocaleString();
  }

  private async bootstrap(): Promise<void> {
    await this.loadActiveCalls();
    const room = this.route.snapshot.queryParamMap.get('room');
    const session = this.route.snapshot.queryParamMap.get('session');
    if (!room || !session) {
      return;
    }
    const match = this.activeCalls.find(
      (c) => c.roomUuid === room && c.id === session
    );
    if (match) {
      await this.selectCall(match);
    } else {
      await this.uiFeedback.showError('Call is no longer active.');
      await this.clearMonitorQueryParams();
    }
  }

  private scheduleEmbed(roomUuid: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cdr.detectChanges();
      afterNextRender(
        () => {
          try {
            this.embedMeeting(roomUuid);
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        { injector: this.injector }
      );
    });
  }

  private embedMeeting(roomUuid: string): void {
    const parent = this.jitsiContainer?.nativeElement;
    if (!parent) {
      throw new JitsiContainerNotReadyError();
    }
    parent.innerHTML = '';
    this.api = this.jitsiService.embed({
      roomName: roomUuid,
      parentNode: parent,
      configOverwrite: adminJitsiConfig.configOverwrite,
      interfaceConfigOverwrite: adminJitsiConfig.interfaceConfigOverwrite,
      displayName: 'Monitor',
    });
  }

  private disposeMeeting(): void {
    this.jitsiService.dispose(this.api);
    this.api = null;
    const parent = this.jitsiContainer?.nativeElement;
    if (parent) {
      parent.innerHTML = '';
    }
  }

  private setMonitorQueryParams(call: CallSession): void {
    const tree = this.router.createUrlTree([], {
      queryParams: { room: call.roomUuid, session: call.id },
    });
    this.location.replaceState(this.router.serializeUrl(tree));
  }

  private async clearMonitorQueryParams(): Promise<void> {
    await this.router.navigate([], {
      queryParams: {},
      replaceUrl: true,
    });
  }
}
