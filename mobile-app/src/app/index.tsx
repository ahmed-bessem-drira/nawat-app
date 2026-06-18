import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useChildStore } from '@/stores/childStore';

export default function IndexScreen() {
  const router = useRouter();
  const { child } = useChildStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Check if child profile exists
    if (child) {
      router.replace('/mood-check-in');
    } else {
      router.replace('/onboarding');
    }
  }, [child, router, isMounted]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F5E9' }}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={{ marginTop: 16, fontSize: 18, color: '#2E7D32' }}>Loading NAWAT FOCUS...</Text>
    </View>
  );
}
