import React, { useEffect } from 'react';
import { requireNativeComponent, View, type ViewStyle } from 'react-native';
import type { PixelEventData } from '../models/PixelEvent';
import VeonPixelTracker from '../VeonPixelTracker';

const NATIVE_VIEW_NAME = 'PixelTrackerView';

const NativePixelTrackerView = requireNativeComponent<{
  pixelId: string;
  refreshTimeSeconds?: number;
  pixelSize?: number;
  visibilityThreshold?: number;
  color?: string;
  style?: ViewStyle;
}>(NATIVE_VIEW_NAME);

interface PixelTrackerViewProps {
  pixelId: string;
  refreshTimeSeconds?: number;
  pixelSize?: number;
  visibilityThreshold?: number;
  color?: string;
  style?: ViewStyle;
  onEvent?: (event: PixelEventData) => void;
}

export const PixelTrackerView: React.FC<PixelTrackerViewProps> = ({
  pixelId,
  refreshTimeSeconds = 5,
  pixelSize = 40,
  visibilityThreshold = 1,
  color = '#FF0000',
  style,
  onEvent,
}) => {
  useEffect(() => {
    if (!onEvent) return;

    const subscription = VeonPixelTracker.events.addListener(
      'onPixelEvent',
      (event: unknown) => {
        const pixelEvent = event as PixelEventData;
        if (pixelEvent.pixelId === pixelId) {
          onEvent(pixelEvent);
        }
      }
    );

    return () => subscription.remove();
  }, [pixelId, onEvent]);

  return (
    <View style={[{ width: pixelSize, height: pixelSize }, style]}>
      <NativePixelTrackerView
        pixelId={pixelId}
        refreshTimeSeconds={refreshTimeSeconds}
        pixelSize={pixelSize}
        visibilityThreshold={visibilityThreshold}
        color={color}
        style={{ flex: 1 }}
      />
    </View>
  );
};
