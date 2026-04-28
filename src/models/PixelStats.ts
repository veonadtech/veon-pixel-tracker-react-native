export interface PixelStats {
  totalAppearances: number;
  isCurrentlyVisible: boolean;
  refreshEnabled: boolean;
  nextRefreshInMs: number;
  nextRefreshInSeconds: number;
}
