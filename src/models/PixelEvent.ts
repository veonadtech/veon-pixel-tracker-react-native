export type PixelEventType =
  | 'appearance'
  | 'disappearance'
  | 'refresh'
  | 'error';

export interface PixelEventData {
  type: PixelEventType;
  pixelId: string;
  timestamp: number;
  error?: string;
}

export class PixelEvent {
  readonly type: PixelEventType;
  readonly pixelId: string;
  readonly timestamp: number;
  readonly error?: string;

  constructor(data: PixelEventData) {
    this.type = data.type;
    this.pixelId = data.pixelId;
    this.timestamp = data.timestamp;
    this.error = data.error;
  }

  get isAppearance(): boolean {
    return this.type === 'appearance';
  }

  get isDisappearance(): boolean {
    return this.type === 'disappearance';
  }

  get isRefresh(): boolean {
    return this.type === 'refresh';
  }

  get isError(): boolean {
    return this.type === 'error';
  }
}
