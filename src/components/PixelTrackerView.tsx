import React, { useRef, useEffect } from 'react';
import { View, findNodeHandle, type ViewStyle } from 'react-native';
import PixelController from '../core/PixelController';
import type { PixelEventData } from '../models/PixelEvent';

interface PixelTrackerViewProps {
  pixelId: string;
  refreshTimeSeconds?: number;
  pixelSize?: number;
  visibilityThreshold?: number;
  color?: string;
  style?: ViewStyle;
  onPixelCreated?: (controller: PixelController) => void;
  onEvent?: (event: PixelEventData) => void;
}

export const PixelTrackerView: React.FC<PixelTrackerViewProps> = ({
  pixelId,
  pixelSize = 40,
  color = '#FF0000',
  style,
  onPixelCreated,
}) => {
  const nativeRef = useRef(null);
  const controllerRef = useRef<PixelController | null>(null);

  useEffect(() => {
    const nativeTag = findNodeHandle(nativeRef.current);
    if (nativeTag && !controllerRef.current) {
      const controller = new PixelController(pixelId, nativeTag);
      controllerRef.current = controller;
      onPixelCreated?.(controller);
    }
  }, [pixelId, onPixelCreated]);

  return (
    <View
      ref={nativeRef}
      style={[
        { width: pixelSize, height: pixelSize, backgroundColor: color },
        style,
      ]}
    />
  );
};
