import React, { useEffect, useRef } from 'react';
import {
  requireNativeComponent,
  View,
  type ViewStyle,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';

import type { PixelEventData } from '../models/PixelEvent';
import PixelController from '../core/PixelController';

const NATIVE_VIEW_NAME = 'PixelTrackerView';

const NativePixelTrackerView = requireNativeComponent<{
  pixelId: string;
  refreshTimeSeconds?: number;
  pixelSize?: number;
  visibilityThreshold?: number;
  color?: string;
  style?: ViewStyle;
}>(NATIVE_VIEW_NAME);

const emitter = new NativeEventEmitter(NativeModules.VeonPixelTrackerRn);

interface PixelTrackerViewProps {
  pixelId: string;
  refreshTimeSeconds?: number;
  pixelSize?: number;
  visibilityThreshold?: number;
  color?: string;
  style?: ViewStyle;

  onEvent?: (event: PixelEventData) => void;

  onPixelCreated?: (controller: PixelController) => void;
}

export const PixelTrackerView: React.FC<PixelTrackerViewProps> = ({
  pixelId,
  refreshTimeSeconds = 5,
  pixelSize = 40,
  visibilityThreshold = 1,
  color = '#FF0000',
  style,
  onEvent,
  onPixelCreated,
}) => {
  const onEventRef = useRef(onEvent);
  const onCreatedRef = useRef(onPixelCreated);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onCreatedRef.current = onPixelCreated;
  }, [onPixelCreated]);

  useEffect(() => {
    // ================= PIXEL EVENTS =================

    const eventSub = emitter.addListener('onPixelEvent', (event: any) => {
      const e = event as PixelEventData;

      if (e.pixelId === pixelId) {
        onEventRef.current?.(e);
      }
    });

    // ================= CONTROLLER CREATED =================

    const createdSub = emitter.addListener('onPixelCreated', (event: any) => {
      const e = event as { pixelId: string };

      if (e.pixelId === pixelId) {
        const controller = new PixelController(pixelId);
        onCreatedRef.current?.(controller);
      }
    });

    return () => {
      eventSub.remove();
      createdSub.remove();
    };
  }, [pixelId]);

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
