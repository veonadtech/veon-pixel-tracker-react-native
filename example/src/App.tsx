import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import VeonPixelTracker from 'veon-pixel-tracker-rn';
import { PixelTrackerView } from 'veon-pixel-tracker-rn';
import type { PixelEventData } from 'veon-pixel-tracker-rn';

interface PixelStats {
  totalAppearances: number;
  isCurrentlyVisible: boolean;
  lastEvent: string;
  refreshCount: number;
}

const defaultStats: PixelStats = {
  totalAppearances: 0,
  isCurrentlyVisible: false,
  lastEvent: '—',
  refreshCount: 0,
};

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixel1Stats, setPixel1Stats] = useState<PixelStats>(defaultStats);
  const [pixel2Stats, setPixel2Stats] = useState<PixelStats>(defaultStats);

  useEffect(() => {
    const initSDK = async () => {
      try {
        await VeonPixelTracker.initialize(
          'https://pixel-tracker.veonadtech.com/v1/pixel-event',
          true
        );
        const initialized = await VeonPixelTracker.isInitialized();
        if (initialized) setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initSDK();
    return () => {
      VeonPixelTracker.shutdown();
    };
  }, []);

  const handlePixel1Event = useCallback((event: PixelEventData) => {
    console.log('🔴 Pixel 1:', event.type);
    setPixel1Stats((prev) => ({
      totalAppearances:
        event.type === 'appearance'
          ? prev.totalAppearances + 1
          : prev.totalAppearances,
      isCurrentlyVisible:
        event.type === 'appearance'
          ? true
          : event.type === 'disappearance'
            ? false
            : prev.isCurrentlyVisible,
      lastEvent: event.type,
      refreshCount:
        event.type === 'refresh' ? prev.refreshCount + 1 : prev.refreshCount,
    }));
  }, []);

  const handlePixel2Event = useCallback((event: PixelEventData) => {
    console.log('🟢 Pixel 2:', event.type);
    setPixel2Stats((prev) => ({
      totalAppearances:
        event.type === 'appearance'
          ? prev.totalAppearances + 1
          : prev.totalAppearances,
      isCurrentlyVisible:
        event.type === 'appearance'
          ? true
          : event.type === 'disappearance'
            ? false
            : prev.isCurrentlyVisible,
      lastEvent: event.type,
      refreshCount:
        event.type === 'refresh' ? prev.refreshCount + 1 : prev.refreshCount,
    }));
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
        <Text style={styles.loadingText}>Initializing Pixel Tracker...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.statsPanel}>
          <Text style={styles.statsPanelTitle}>📊 Pixel Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <Text style={styles.statsCardTitle}>🔴 Pixel 1</Text>
              <Text style={styles.statsText}>
                Appearances: {pixel1Stats.totalAppearances}
              </Text>
              <Text style={styles.statsText}>
                Refreshes: {pixel1Stats.refreshCount}
              </Text>
              <Text style={styles.statsText}>
                Visible: {pixel1Stats.isCurrentlyVisible ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.statsText}>
                Last: {pixel1Stats.lastEvent}
              </Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={styles.statsCardTitle}>🟢 Pixel 2</Text>
              <Text style={styles.statsText}>
                Appearances: {pixel2Stats.totalAppearances}
              </Text>
              <Text style={styles.statsText}>
                Refreshes: {pixel2Stats.refreshCount}
              </Text>
              <Text style={styles.statsText}>
                Visible: {pixel2Stats.isCurrentlyVisible ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.statsText}>
                Last: {pixel2Stats.lastEvent}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          <Text style={styles.title}>Pixel Tracker Demo</Text>
          <Text style={styles.subtitle}>Scroll down to see the pixels</Text>

          <View style={styles.spacer} />

          <View style={styles.pixelsContainer}>
            <Text style={styles.pixelsLabel}>Ad Tracking Pixels</Text>
            <View style={styles.pixelsRow}>
              <PixelTrackerView
                pixelId="pixel_1"
                refreshTimeSeconds={10}
                pixelSize={30}
                visibilityThreshold={5}
                color="#FF0000"
                onEvent={handlePixel1Event}
              />
              <View style={styles.pixelSpacer} />
              <PixelTrackerView
                pixelId="pixel_2"
                refreshTimeSeconds={5}
                pixelSize={30}
                visibilityThreshold={5}
                color="#00FF00"
                onEvent={handlePixel2Event}
              />
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
    fontSize: 14,
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
    height: 1000,
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
  pixelSpacer: {
    width: 8,
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
