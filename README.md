# Veon Pixel Tracker React Native

React Native plugin for Veon Pixel Tracker SDK.
This plugin allows you to track pixel visibility events in your React Native applications with the same functionality as the native Android SDK.

## Features

- ✅ Initialize Pixel Tracker SDK with custom configuration
- ✅ Create and manage tracking pixels
- ✅ Real-time visibility events (appearance, disappearance, refresh)
- ✅ Native View Manager integration for accurate visibility detection
- ✅ Supports New Architecture (Fabric) and Old Architecture
- ✅ Comprehensive statistics and monitoring
- ✅ Full control over refresh intervals and visibility thresholds

## Requirements

### Android

- `minSdkVersion` at least `24`
- `compileSdkVersion` at least `36`
- `Java Version` at least `17`
- `Kotlin Version` at least `2.0.0`

### iOS

- ⬜ Not implemented yet

## Installation

```sh
npm install veon-pixel-tracker-rn
```

or

```sh
yarn add veon-pixel-tracker-rn
```

### Android Setup

Add the package to your `MainApplication.kt`:

```kotlin
import com.veonpixeltrackerrn.VeonPixelTrackerRnPackage

// in packageList:
packageList.apply {
  add(VeonPixelTrackerRnPackage())
}
```

## Platform Support

- Android ✅
- iOS ⬜ (Coming soon)

## Quick Start

### Initialize the SDK

```typescript
import VeonPixelTracker from 'veon-pixel-tracker-rn';

// Call once at app startup, before rendering any PixelTrackerView
try {
  await VeonPixelTracker.initialize(
    'https://your-pixel-endpoint.com/v1/pixel-event',
    true // debug mode, set false in production
  );

  if (await VeonPixelTracker.isInitialized()) {
    console.log('✅ PixelTracker initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize PixelTracker', error);
}
```

### Create a Pixel View and get Pixel Stats (optionally)

```typescript
import React from 'react';
import { ScrollView } from 'react-native';
import VeonPixelTracker, { PixelTrackerView } from 'veon-pixel-tracker-rn';
import type { PixelEventData, PixelStats } from 'veon-pixel-tracker-rn';

export default function App() {
  const [pixelStats, setPixelStats] = React.useState<PixelStats | null>(null);

  React.useEffect(() => {
    // Initialize SDK
    VeonPixelTracker.initialize(
      'https://your-pixel-endpoint.com/v1/pixel-event',
      true
    );

    // Fetch stats periodically
    const interval = setInterval(async () => {
      const stats = await VeonPixelTracker.getPixelStats('home_screen_pixel');
      if (stats) setPixelStats(stats);
    }, 2000);

    return () => {
      clearInterval(interval);
      VeonPixelTracker.shutdown();
    };
  }, []);

  return (
    <ScrollView>
      {/* Your content here */}

      {/* Display pixel statistics */}
      {pixelStats && (
        <View>
          <Text>Appearances: {pixelStats.totalAppearances}</Text>
          <Text>Visible: {pixelStats.isCurrentlyVisible ? 'Yes' : 'No'}</Text>
        </View>
      )}

      {/* Pixel positioned below the fold — requires scrolling to become visible */}
      <PixelTrackerView
        pixelId="home_screen_pixel"
        refreshTimeSeconds={5}
        pixelSize={40}       // use 1 in production
        visibilityThreshold={5}
        color="#FF0000"      // Use visible color for debug only
        onEvent={(event: PixelEventData) => {
          if (event.type === 'appearance') {
            console.log('✅ Pixel visible!');
          } else if (event.type === 'disappearance') {
            console.log('👻 Pixel hidden');
          } else if (event.type === 'refresh') {
            console.log('🔄 Pixel refreshed');
          } else if (event.type === 'error') {
            console.error('Pixel error:', event.error);
          }
        }}
      />
    </ScrollView>
  );
}
```

### Control Pixel Programmatically

```typescript
import VeonPixelTracker from 'veon-pixel-tracker-rn';

const pixelId = 'my_pixel';

// Start pixel tracking (auto-starts by default)
await VeonPixelTracker.startPixel(pixelId);

// Stop pixel tracking
await VeonPixelTracker.stopPixel(pixelId);

// Update refresh interval
await VeonPixelTracker.updateRefreshTime(pixelId, 10); // 10 seconds

// Get pixel statistics
const stats = await VeonPixelTracker.getPixelStats(pixelId);
console.log(`Total appearances: ${stats?.totalAppearances}`);

// Destroy pixel (remove from memory)
await VeonPixelTracker.destroyPixel(pixelId);
```

### Listen to SDK Events globally

```typescript
import VeonPixelTracker from 'veon-pixel-tracker-rn';

// Subscribe to all pixel events
const subscription = VeonPixelTracker.events.addListener(
  'onPixelEvent',
  (event) => {
    console.log(`Pixel ${event.pixelId}: ${event.type} at ${event.timestamp}`);
  }
);

// Don't forget to remove listener on cleanup
subscription.remove();
```

### Shutdown

```typescript
await VeonPixelTracker.shutdown();
```

## API Reference

### VeonPixelTracker

| Method                                         | Description                                                         |
|------------------------------------------------|---------------------------------------------------------------------|
| `initialize(baseUrl, debug)`                   | Initialize the SDK. Must be called before using `PixelTrackerView`  |
| `isInitialized()`                              | Returns `true` if SDK is initialized                                |
| `shutdown()`                                   | Shutdown SDK and cleanup all pixels                                 |
| `startPixel(pixelId)`                          | Start tracking for specific pixel (auto-starts by default)          |
| `stopPixel(pixelId)`                           | Stop tracking for specific pixel                                    |
| `destroyPixel(pixelId)`                        | Destroy pixel and remove from memory                                |
| `updateRefreshTime(pixelId, seconds)`          | Update refresh interval for a pixel                                 |
| `setVisibilityCheckInterval(pixelId, seconds)` | Update visibility check interval for a pixel                        |
| `getPixelStats(pixelId)`                       | Get statistics for a specific pixel (returns PixelStats or null)    |
| `events`                                       | `NativeEventEmitter` — subscribe to SDK events                      |

### PixelTrackerView Props

| Prop                  | Type                              | Default   | Description                                      |
|-----------------------|-----------------------------------|-----------|--------------------------------------------------|
| `pixelId`             | `string`                          | required  | Unique identifier for the pixel                  |
| `refreshTimeSeconds`  | `number`                          | `5`       | Interval between refresh events (seconds)        |
| `pixelSize`           | `number`                          | `40`      | Width and height of the pixel view (px)          |
| `visibilityThreshold` | `number`                          | `1`       | Minimum visible area in px to trigger appearance |
| `color`               | `string`                          | `#FF0000` | Color of the pixel view (use for debug only)     |
| `style`               | `ViewStyle`                       | —         | Additional styles                                |
| `onEvent`             | `(event: PixelEventData) => void` | —         | Callback for pixel events                        |

### PixelEventData

| Field       | Type                                                      | Description                                  |
|-------------|-----------------------------------------------------------|----------------------------------------------|
| `type`      | `'appearance' \| 'disappearance' \| 'refresh' \| 'error'` | Event type                                   |
| `pixelId`   | `string`                                                  | ID of the pixel that fired the event         |
| `timestamp` | `string`                                                  | Event timestamp                              |
| `error`     | `string \| undefined`                                     | Error message (only when `type === 'error'`) |

### PixelStats

| Field                  | Type        | Description                                |
|------------------------|-------------|--------------------------------------------|
| `totalAppearances`     | `'number' ` | Total number of times pixel became visible |
| `isCurrentlyVisible`   | `boolean`   | Whether pixel is currently visible         |
| `refreshEnabled`       | `boolean`   | Whether refresh is enabled                 |
| `nextRefreshInMs`      | `number`    | Milliseconds until next refresh            |
| `nextRefreshInSeconds` | `number`    | Seconds until next refresh                 |

## Verifying Events Are Sent to Server

To verify that pixel events are actually being sent to your server, run:

```sh
adb logcat -s PixelNetworkManager
```

Example output for a successful request:

``` text
D PixelNetworkManager: Sending event to https://your-pixel-tracker.com/v1/event/index
D PixelNetworkManager: Event: pixelId=pixel_1, type=REFRESH, timestamp=1776918004047
D PixelNetworkManager: Response code: 200
D PixelNetworkManager: Response body: {"success":true,"id":1492}
```

## Debug Logs

Enable debug mode during initialization to get detailed native logs:

```typescript
VeonPixelTracker.initialize('https://...', true);
```

To see all pixel tracking logs:

```sh
adb logcat -s PixelNetworkManager,PixelTracker
```

## Troubleshooting

### SDK not initialized

- Ensure `initialize()` is called before rendering `PixelTrackerView`
- Check that `baseUrl` is correct and accessible

### Pixel not detecting visibility

- Verify pixel is positioned inside a scrollable area below the fold
- Check that `pixelSize` is large enough to be detected (`>= visibilityThreshold`)
- Make sure you've scrolled the pixel into view
- Make sure `VeonPixelTrackerRnPackage` is registered in `MainApplication.kt`

### Statistics not showing
- Ensure pixel has been visible at least once
- Use getPixelStats(pixelId) after pixel has appeared
- Check that you're using the correct pixelId
- Verify SDK is initialized

### Events not firing

- Confirm SDK is initialized before the view mounts
- Check `adb logcat -s PixelNetworkManager` to see if native events are firing
- Verify the pixel is actually scrolled into view

## Example App

- Check the example folder for a complete working example demonstrating:
- SDK initialization
- Pixel creation with custom props
- Real-time statistics display
- Programmatic pixel control
- Event handling

## Support

Issues: [GitHub Issues](https://github.com/veonadtech/veon-pixel-tracker-react-native/issues)

## About Veon

Veon provides cutting-edge advertising technology solutions. Visit [veonadtech.com](https://veonadtech.com/en) to learn more.

## License

MIT
