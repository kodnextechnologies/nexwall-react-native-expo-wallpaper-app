import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import type { Category, Wallpaper } from './src/api/nexwall';
import { colors } from './src/components';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { PreviewScreen } from './src/screens/PreviewScreen';
import { WallpapersScreen } from './src/screens/WallpapersScreen';

// A three-screen app doesn't need a navigation library: a small stack is enough.
type Route =
  | { name: 'categories' }
  | { name: 'wallpapers'; category: Category | null }
  | { name: 'preview'; wallpaper: Wallpaper };

export default function App() {
  const [stack, setStack] = useState<Route[]>([{ name: 'categories' }]);
  const push = (route: Route) => setStack((s) => [...s, route]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  // Android hardware back button.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length <= 1) return false;
      back();
      return true;
    });
    return () => sub.remove();
  }, [stack.length]);

  const current = stack[stack.length - 1];
  const wallpapersRoute = stack.find((r) => r.name === 'wallpapers');

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.container}>
        {/* Screens below the top stay mounted (just hidden), so going back
            doesn't refetch and use API quota again. */}
        <View style={wallpapersRoute ? styles.hidden : styles.flex}>
          <CategoriesScreen onOpen={(category) => push({ name: 'wallpapers', category })} />
        </View>
        {wallpapersRoute ? (
          <WallpapersScreen
            category={wallpapersRoute.category}
            onBack={back}
            onOpen={(wallpaper) => push({ name: 'preview', wallpaper })}
          />
        ) : null}
      </SafeAreaView>
      {current.name === 'preview' ? (
        <View style={StyleSheet.absoluteFill}>
          <PreviewScreen wallpaper={current.wallpaper} onBack={back} />
        </View>
      ) : null}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  hidden: { display: 'none' },
});
