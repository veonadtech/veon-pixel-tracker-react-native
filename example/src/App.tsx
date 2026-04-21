import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import VeonPixelTracker from 'veon-pixel-tracker-rn';
import { PixelTrackerView } from 'veon-pixel-tracker-rn';

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      try {
        console.log('Initializing SDK...');
        await VeonPixelTracker.initialize('https://api.example.com', true);
        const initialized = await VeonPixelTracker.isInitialized();
        if (initialized) {
          console.log('✅ SDK initialized successfully');
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('❌ Initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initSDK();

    return () => {
      VeonPixelTracker.shutdown();
    };
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pixel Tracker Demo</Text>
      <Text style={styles.subtitle}>Scroll down to see the pixel</Text>

      <View style={styles.spacer} />

      <PixelTrackerView
        pixelId="demo_pixel"
        refreshTimeSeconds={5}
        pixelSize={40}
        visibilityThreshold={1}
        color="#FF0000"
        onEvent={(event) => {
          console.log('📱 Pixel event:', event.type, event.timestamp);
        }}
      />

      <View style={styles.spacer} />
      <Text style={styles.footer}>Pixel is at the bottom</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    height: 800,
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
