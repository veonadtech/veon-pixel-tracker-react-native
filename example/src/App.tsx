import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Button,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import VeonPixelTracker, {
  PixelTrackerView,
  PixelController,
  type PixelEventData,
  type PixelStats,
} from 'veon-pixel-tracker-rn';

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [controller, setController] = useState<PixelController | null>(null);
  const [stats, setStats] = useState<PixelStats | null>(null);

  const [refreshTime, setRefreshTime] = useState(5);

  const controllerRef = useRef<PixelController | null>(null);

  useEffect(() => {
    controllerRef.current = controller;
  }, [controller]);

  useEffect(() => {
    const init = async () => {
      await VeonPixelTracker.initialize('https://api.example.com', true);

      const ok = await VeonPixelTracker.isInitialized();
      setIsInitialized(ok);
    };

    init();

    return () => {
      controllerRef.current?.destroy();
      VeonPixelTracker.shutdown();
    };
  }, []);

  const updateStats = useCallback(async () => {
    const c = controllerRef.current;
    if (!c) return;

    try {
      const s = await c.getStats();
      setStats(s);
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }, []);

  const handleEvent = useCallback(
    (event: PixelEventData) => {
      if (
        event.type === 'appearance' ||
        event.type === 'refresh' ||
        event.type === 'disappearance'
      ) {
        updateStats();
      }
    },
    [updateStats]
  );

  if (!isInitialized) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Initializing...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.controls}>
          <Text style={styles.title}>Controls</Text>

          <View style={styles.row}>
            <Button
              title="Start"
              onPress={() => controllerRef.current?.start()}
              disabled={!controller}
            />
            <Button
              title="Stop"
              onPress={() => controllerRef.current?.stop()}
              disabled={!controller}
            />
            <Button
              title="Destroy"
              onPress={() => {
                controllerRef.current?.destroy();
                setController(null);
                setStats(null);
              }}
              disabled={!controller}
            />
          </View>

          <View style={styles.row}>
            <Button
              title="-"
              onPress={() => {
                const val = Math.max(0, refreshTime - 1);
                setRefreshTime(val);
                controllerRef.current?.updateRefreshTime(val);
              }}
            />
            <Text style={styles.refresh}>{refreshTime}s</Text>
            <Button
              title="+"
              onPress={() => {
                const val = refreshTime + 1;
                setRefreshTime(val);
                controllerRef.current?.updateRefreshTime(val);
              }}
            />
          </View>
        </View>

        <View style={styles.stats}>
          <Text style={styles.title}>Stats (native SDK)</Text>

          {!stats ? (
            <Text>No stats</Text>
          ) : (
            <>
              <Text>Appearances: {stats.totalAppearances}</Text>
              <Text>Visible: {stats.isCurrentlyVisible ? 'Yes' : 'No'}</Text>
              <Text>
                Refresh enabled: {stats.refreshEnabled ? 'Yes' : 'No'}
              </Text>
              <Text>Next refresh: {stats.nextRefreshInSeconds}s</Text>
            </>
          )}
        </View>

        <ScrollView>
          <View style={{ height: 1000 }} />

          <View style={styles.pixelContainer}>
            <PixelTrackerView
              pixelId="demo_pixel"
              refreshTimeSeconds={refreshTime}
              pixelSize={40}
              visibilityThreshold={1}
              color="#FF0000"
              onPixelCreated={(c: PixelController) => {
                setController(c);

                c.setVisibilityCheckInterval(3);
                c.start();

                updateStats();
              }}
              onEvent={handleEvent}
            />
          </View>

          <View style={{ height: 500 }} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  controls: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  stats: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },

  row: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 5,
    alignItems: 'center',
  },

  refresh: {
    fontSize: 16,
    marginHorizontal: 10,
  },

  pixelContainer: {
    alignItems: 'center',
  },
});
