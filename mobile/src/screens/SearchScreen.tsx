import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/tokens';
import { getApiClient } from '../services/api';

interface ApiJob {
  id: string;
  routeOrder: number;
  status: 'pending' | 'in_progress' | 'complete' | 'cancelled';
  customer: { name: string; address: string } | null;
  lastVisit: { date: string; isFlagged: boolean } | null;
  completedAt: string | null;
  startedAt: string | null;
}

interface Job {
  id: string;
  name: string;
  address: string;
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function SearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const today = new Date();
      const response = await getApiClient().get<{ ok: boolean; data: ApiJob[] }>('/technician/jobs', {
        date: toLocalDateStr(today),
      });
      const lower = q.toLowerCase();
      const filtered = (response.data ?? [])
        .filter((job) => {
          const name = job.customer?.name ?? '';
          const address = job.customer?.address ?? '';
          return name.toLowerCase().includes(lower) || address.toLowerCase().includes(lower);
        })
        .map((job) => ({
          id: job.id,
          name: job.customer?.name ?? 'Unknown',
          address: job.customer?.address ?? '',
        }));
      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!text.trim()) {
      setHasSearched(false);
      setResults([]);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      search(text.trim());
    }, 300);
  };

  const handleJobPress = (jobId: string) => {
    // @ts-ignore
    navigation.navigate('M5', { jobId });
  };

  const renderJob = ({ item }: { item: Job }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleJobPress(item.id)}>
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardAddr}>{item.address}</Text>
    </TouchableOpacity>
  );

  const showIdle = !query.trim();
  const showEmpty = hasSearched && !loading && results.length === 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers or addresses..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={handleQueryChange}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
      ) : showIdle ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Search by customer name or address</Text>
        </View>
      ) : showEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No results</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderJob}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E2E4E8',
  },
  header: {
    padding: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F3',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  searchWrap: {
    backgroundColor: '#F5F5F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    fontSize: 14,
    color: '#111827',
  },
  scrollContent: {
    padding: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F5F5F3',
    gap: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cardAddr: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F5F5F3',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
