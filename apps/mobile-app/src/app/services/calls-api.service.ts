import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { resolveApiUrl } from '../config/runtime-host';
import { CallSession, CreateCallResponse } from '../models/call-session.model';

@Injectable({
  providedIn: 'root',
})
export class CallsApiService {
  private get baseUrl(): string {
    return `${resolveApiUrl()}/calls`;
  }

  constructor(private readonly http: HttpClient) {}

  create(): Observable<CreateCallResponse> {
    return this.http.post<CreateCallResponse>(`${this.baseUrl}/create`, {});
  }

  findActive(): Observable<CallSession[]> {
    return this.http.get<CallSession[]>(`${this.baseUrl}/active`);
  }

  end(sessionId: string): Observable<CallSession> {
    return this.http.patch<CallSession>(`${this.baseUrl}/${sessionId}/end`, {});
  }
}
