import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import VeonPixelTracker, { PixelTrackerView } from 'veon-pixel-tracker-rn';
import type { PixelEventData, PixelStats } from 'veon-pixel-tracker-rn';

const PIXELS = [
  {
    id: 'pixel_1',
    refreshTimeSeconds: 10,
    pixelSize: 40,
    visibilityThreshold: 1,
    color: '#FF0000',
    label: '🔴 Pixel 1',
  },
  {
    id: 'pixel_2',
    refreshTimeSeconds: 5,
    pixelSize: 40,
    visibilityThreshold: 30,
    color: '#00AA00',
    label: '🟢 Pixel 2',
  },
];

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, PixelStats>>({});
  const [destroyedPixels, setDestroyedPixels] = useState<Set<string>>(
    new Set()
  );
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      try {
        await VeonPixelTracker.initialize('https://api.example.com', true);
        const initialized = await VeonPixelTracker.isInitialized();
        if (initialized) setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };
    initSDK();

    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      VeonPixelTracker.shutdown();
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const fetchStats = async () => {
      const newStats: Record<string, PixelStats> = {};
      for (const pixel of PIXELS) {
        try {
          const s = await VeonPixelTracker.getPixelStats(pixel.id);
          if (s) newStats[pixel.id] = s;
        } catch {
          // Ignore stats fetch errors
        }
      }
      setStats(newStats);
    };

    statsIntervalRef.current = setInterval(fetchStats, 2000);
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, [isInitialized]);

  const handleEvent = useCallback(
    (pixelId: string) => (event: PixelEventData) => {
      console.log(`📍 ${pixelId}: ${event.type}`);
    },
    []
  );

  const handleStart = useCallback(async (pixelId: string) => {
    try {
      await VeonPixelTracker.startPixel(pixelId);
    } catch (_error) {
      console.warn(`Start failed for ${pixelId}:`, _error);
    }
  }, []);

  const handleStop = useCallback(async (pixelId: string) => {
    try {
      await VeonPixelTracker.stopPixel(pixelId);
    } catch (_error) {
      console.warn(`Stop failed for ${pixelId}:`, _error);
    }
  }, []);

  const handleDestroy = useCallback(async (pixelId: string) => {
    try {
      await VeonPixelTracker.destroyPixel(pixelId);
      setDestroyedPixels((prev) => new Set(prev).add(pixelId));
    } catch (_error) {
      console.warn(`Destroy failed for ${pixelId}:`, _error);
    }
  }, []);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.statsPanel}>
          <Text style={styles.statsPanelTitle}>
            📊 Pixel Statistics (native SDK)
          </Text>
          <View style={styles.statsRow}>
            {PIXELS.map((pixel) => {
              const s = stats[pixel.id];
              const isDestroyed = destroyedPixels.has(pixel.id);

              return (
                <View key={pixel.id} style={styles.statsCard}>
                  <Text style={styles.statsCardTitle}>{pixel.label}</Text>

                  {isDestroyed ? (
                    <Text style={styles.destroyedText}>Destroyed</Text>
                  ) : (
                    <>
                      <Text style={styles.statsText}>
                        Appearances: {s?.totalAppearances ?? '—'}
                      </Text>
                      <Text style={styles.statsText}>
                        Visible:{' '}
                        {s ? (s.isCurrentlyVisible ? 'Yes' : 'No') : '—'}
                      </Text>
                      <Text style={styles.statsText}>
                        Refresh: {s ? (s.refreshEnabled ? 'On' : 'Off') : '—'}
                      </Text>
                      <Text style={styles.statsText}>
                        Next in:{' '}
                        {s ? `${Math.round(s.nextRefreshInSeconds)}s` : '—'}
                      </Text>
                    </>
                  )}

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[
                        styles.btn,
                        styles.btnGreen,
                        isDestroyed && styles.btnDisabled,
                      ]}
                      onPress={() => handleStart(pixel.id)}
                      disabled={isDestroyed}
                    >
                      <Text style={styles.btnText}>Start</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.btn,
                        styles.btnOrange,
                        isDestroyed && styles.btnDisabled,
                      ]}
                      onPress={() => handleStop(pixel.id)}
                      disabled={isDestroyed}
                    >
                      <Text style={styles.btnText}>Stop</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.btn,
                        styles.btnRed,
                        isDestroyed && styles.btnDisabled,
                      ]}
                      onPress={() => handleDestroy(pixel.id)}
                      disabled={isDestroyed}
                    >
                      <Text style={styles.btnText}>Destroy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          <Text style={styles.title}>Pixel Tracker Demo</Text>
          <Text style={styles.subtitle}>Scroll down to see the pixels</Text>

          <View style={styles.spacer} />

          <View style={styles.pixelsContainer}>
            <Text style={styles.pixelsLabel}>Ad Tracking Pixels</Text>
            <View style={styles.pixelsRow}>
              {PIXELS.map((pixel, index) => {
                const isDestroyed = destroyedPixels.has(pixel.id);
                if (isDestroyed) return null;
                return (
                  <View
                    key={pixel.id}
                    style={index > 0 ? styles.marginLeft : undefined}
                  >
                    <PixelTrackerView
                      pixelId={pixel.id}
                      refreshTimeSeconds={pixel.refreshTimeSeconds}
                      pixelSize={pixel.pixelSize}
                      visibilityThreshold={pixel.visibilityThreshold}
                      color={pixel.color}
                      onEvent={handleEvent(pixel.id)}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.spacerBottom} />
          <Text style={styles.footer}>End of page</Text>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  statsPanel: {
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 12,
  },
  statsPanelTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  statsCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsText: {
    fontSize: 11,
    color: '#555',
    marginTop: 2,
  },
  destroyedText: {
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 4,
    fontStyle: 'italic',
  },

  btnRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  btnGreen: { backgroundColor: '#34C759' },
  btnOrange: { backgroundColor: '#FF9500' },
  btnRed: { backgroundColor: '#FF3B30' },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },

  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  spacer: {
    height: 1200,
  },
  spacerBottom: {
    height: 40,
  },

  pixelsContainer: {
    alignItems: 'center',
  },
  pixelsLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  pixelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marginLeft: {
    marginLeft: 8,
  },

  footer: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
});

export default App;
