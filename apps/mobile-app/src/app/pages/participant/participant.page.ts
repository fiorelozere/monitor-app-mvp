import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refresh } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { CallSession } from '../../models/call-session.model';
import { CallsApiService } from '../../services/calls-api.service';
import {
  JitsiJoinError,
  JitsiNativeUnavailableError,
  JitsiService,
} from '../../services/jitsi.service';
import { UiFeedbackService } from '../../services/ui-feedback.service';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.page.html',
  styleUrls: ['./participant.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class ParticipantPage implements OnInit, OnDestroy {
  inCall = false;
  leaving = false;
  starting = false;
  joining = false;
  loadingCalls = false;
  activeCalls: CallSession[] = [];
  sessionId: string | null = null;
  roomUuid: string | null = null;

  constructor(
    private readonly callsApi: CallsApiService,
    private readonly jitsiService: JitsiService,
    private readonly uiFeedback: UiFeedbackService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly location: Location
  ) {
    addIcons({ refresh });
  }

  ngOnInit(): void {
    void this.bootstrap();
  }

  ngOnDestroy(): void {
    this.syncFullscreenLayout(false);
    void this.jitsiService.leaveConference();
  }

  async leaveCall(): Promise<void> {
    if (this.leaving || !this.inCall) {
      return;
    }
    this.leaving = true;
    try {
      await this.jitsiService.leaveConference();
      await this.finishLeaveCall();
    } finally {
      this.leaving = false;
    }
  }

  async handleRefresh(event: CustomEvent): Promise<void> {
    await this.loadActiveCalls();
    const refresher = event.target as HTMLIonRefresherElement;
    refresher.complete();
  }

  async startCall(): Promise<void> {
    if (this.inCall || this.starting) {
      return;
    }
    this.starting = true;
    try {
      const created = await firstValueFrom(this.callsApi.create());
      await this.enterCall(created.roomUuid, created.id);
    } catch (err) {
      await this.uiFeedback.showError(this.joinErrorMessage(err, 'start'));
      this.clearState();
    } finally {
      this.starting = false;
    }
  }

  async joinCall(call: CallSession): Promise<void> {
    if (this.inCall || this.joining) {
      return;
    }
    this.joining = true;
    try {
      await this.enterCall(call.roomUuid, call.id);
    } catch (err) {
      await this.uiFeedback.showError(this.joinErrorMessage(err, 'join'));
      this.clearState();
    } finally {
      this.joining = false;
    }
  }

  joinUrl(call: CallSession): string {
    return this.buildJoinUrl(call.roomUuid, call.id);
  }

  currentJoinUrl(): string | null {
    if (!this.roomUuid || !this.sessionId) {
      return null;
    }
    return this.buildJoinUrl(this.roomUuid, this.sessionId);
  }

  isLocalhostHost(): boolean {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  }

  formatCreatedAt(value: string): string {
    return new Date(value).toLocaleString();
  }

  async loadActiveCalls(): Promise<void> {
    this.loadingCalls = true;
    try {
      this.activeCalls = await firstValueFrom(this.callsApi.findActive());
    } catch {
      await this.uiFeedback.showError('Could not load active calls.');
      this.activeCalls = [];
    } finally {
      this.loadingCalls = false;
    }
  }

  private async bootstrap(): Promise<void> {
    await this.loadActiveCalls();
    const room = this.route.snapshot.queryParamMap.get('room');
    const session = this.route.snapshot.queryParamMap.get('session');
    if (room && session) {
      await this.tryRejoinFromUrl(room, session);
    }
  }

  private async tryRejoinFromUrl(room: string, session: string): Promise<void> {
    const match = this.activeCalls.find(
      (c) => c.roomUuid === room && c.id === session
    );
    if (!match) {
      await this.uiFeedback.showError('This call is no longer active.');
      await this.clearCallQueryParams();
      return;
    }
    try {
      await this.enterCall(match.roomUuid, match.id, false);
    } catch (err) {
      await this.uiFeedback.showError(this.joinErrorMessage(err, 'rejoin'));
      this.clearState();
    }
  }

  private async enterCall(
    roomUuid: string,
    sessionId: string,
    updateUrl = true
  ): Promise<void> {
    this.sessionId = sessionId;
    this.roomUuid = roomUuid;
    this.inCall = true;
    this.syncFullscreenLayout(true);
    if (updateUrl) {
      this.setCallQueryParams(roomUuid, sessionId);
    }
    await this.jitsiService.joinConference({
      roomName: roomUuid,
      onConferenceLeft: () => {
        void this.handleLeaveCall();
      },
    });
  }

  private async handleLeaveCall(): Promise<void> {
    if (this.leaving || !this.inCall) {
      return;
    }
    this.leaving = true;
    try {
      await this.finishLeaveCall();
    } finally {
      this.leaving = false;
    }
  }

  private async finishLeaveCall(): Promise<void> {
    this.clearState();
    await this.clearCallQueryParams();
    await this.loadActiveCalls();
  }

  private clearState(): void {
    this.sessionId = null;
    this.roomUuid = null;
    this.inCall = false;
    this.syncFullscreenLayout(false);
  }

  private setCallQueryParams(roomUuid: string, sessionId: string): void {
    const tree = this.router.createUrlTree(['/tabs/participant'], {
      queryParams: { room: roomUuid, session: sessionId },
    });
    this.location.replaceState(this.router.serializeUrl(tree));
  }

  private async clearCallQueryParams(): Promise<void> {
    await this.router.navigate(['/tabs/participant'], {
      queryParams: {},
      replaceUrl: true,
    });
  }

  private syncFullscreenLayout(active?: boolean): void {
    const on = active ?? this.inCall;
    document.body.classList.toggle('participant-in-call', on);
  }

  private buildJoinUrl(roomUuid: string, sessionId: string): string {
    const tree = this.router.createUrlTree(['/tabs/participant'], {
      queryParams: { room: roomUuid, session: sessionId },
    });
    return `${window.location.origin}${this.router.serializeUrl(tree)}`;
  }

  private joinErrorMessage(
    err: unknown,
    action: 'start' | 'join' | 'rejoin'
  ): string {
    if (
      err instanceof JitsiNativeUnavailableError ||
      err instanceof JitsiJoinError
    ) {
      return JitsiService.formatJoinError(err);
    }
    if (action === 'start') {
      return 'Could not start call. Is the backend running?';
    }
    if (action === 'rejoin') {
      return 'Could not rejoin call. Check Jitsi and try again.';
    }
    return JitsiService.formatJoinError(err);
  }
}
