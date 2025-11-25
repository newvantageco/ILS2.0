/**
 * pgvector Performance Benchmark
 *
 * Benchmarks vector similarity search performance and compares with old method.
 * Provides metrics on query latency, throughput, and accuracy.
 *
 * Usage:
 *   npx tsx scripts/benchmark-pgvector.ts [--company-id=<id>] [--iterations=100]
 */

import { performance } from 'perf_hooks';
import { embeddingService } from '../server/services/EmbeddingService';
import { searchKnowledgeBaseByEmbedding, getEmbeddingStats } from '../server/storage-vector';
import { createLogger } from '../server/utils/logger';

const logger = createLogger('benchmark');

// Parse arguments
const args = process.argv.slice(2);
const companyIdArg = args.find(arg => arg.startsWith('--company-id='))?.split('=')[1];
const iterationsArg = args.find(arg => arg.startsWith('--iterations='))?.split('=')[1];
const iterations = iterationsArg ? parseInt(iterationsArg, 10) : 100;

// Test queries
const testQueries = [
  'What are progressive lenses?',
  'How to correct astigmatism?',
  'Blue light blocking coatings',
  'Best lenses for presbyopia patients',
  'Single vision vs bifocal lenses',
  'Computer eye strain prevention',
  'High index lens materials',
  'Anti-reflective coating benefits',
  'Photochromic lens technology',
  'Polycarbonate vs trivex lenses',
];

interface BenchmarkResult {
  query: string;
  embedding_time_ms: number;
  search_time_ms: number;
  total_time_ms: number;
  results_found: number;
  top_similarity: number;
}

async function benchmark() {
  logger.info('='.repeat(60));
  logger.info('pgvector Performance Benchmark');
  logger.info('='.repeat(60));

  if (!companyIdArg) {
    logger.error('❌ Error: --company-id required');
    logger.info('\nUsage: npx tsx scripts/benchmark-pgvector.ts --company-id=<id> [--iterations=100]');
    process.exit(1);
  }

  logger.info(`🎯 Company ID: ${companyIdArg}`);
  logger.info(`🔁 Iterations: ${iterations}`);
  logger.info(`📝 Test queries: ${testQueries.length}\n`);

  // Get embedding statistics
  logger.info('📊 Knowledge Base Statistics:');
  try {
    const stats = await getEmbeddingStats(companyIdArg);
    logger.info(`   Total documents: ${stats.total}`);
    logger.info(`   With embeddings: ${stats.withEmbedding}`);
    logger.info(`   Migration progress: ${stats.migrationProgress}\n`);

    if (stats.withEmbedding === 0) {
      logger.error('❌ No documents with embeddings found. Run migration first.');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Failed to get stats:', error);
    process.exit(1);
  }

  // Warm-up phase
  logger.info('🔥 Warming up...');
  for (let i = 0; i < 3; i++) {
    const embedding = await embeddingService.generateEmbedding(testQueries[0]);
    await searchKnowledgeBaseByEmbedding(companyIdArg, embedding, { limit: 5 });
  }
  logger.info('✓ Warm-up complete\n');

  // Run benchmarks
  logger.info(`🚀 Running ${iterations} iterations...\n`);

  const results: BenchmarkResult[] = [];
  const overallStartTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    const query = testQueries[i % testQueries.length];

    // Benchmark embedding generation
    const embeddingStart = performance.now();
    const embedding = await embeddingService.generateEmbedding(query);
    const embeddingTime = performance.now() - embeddingStart;

    // Benchmark vector search
    const searchStart = performance.now();
    const searchResults = await searchKnowledgeBaseByEmbedding(
      companyIdArg,
      embedding,
      { limit: 5, threshold: 0.5 }
    );
    const searchTime = performance.now() - searchStart;

    results.push({
      query,
      embedding_time_ms: embeddingTime,
      search_time_ms: searchTime,
      total_time_ms: embeddingTime + searchTime,
      results_found: searchResults.length,
      top_similarity: searchResults[0]?.similarity || 0,
    });

    if ((i + 1) % 10 === 0) {
      logger.info(`  Progress: ${i + 1}/${iterations}`);
    }
  }

  const overallTime = performance.now() - overallStartTime;

  // Calculate statistics
  const embeddingTimes = results.map(r => r.embedding_time_ms);
  const searchTimes = results.map(r => r.search_time_ms);
  const totalTimes = results.map(r => r.total_time_ms);

  const stats = {
    embedding: calculateStats(embeddingTimes),
    search: calculateStats(searchTimes),
    total: calculateStats(totalTimes),
  };

  // Print results
  logger.info('\n' + '='.repeat(60));
  logger.info('RESULTS');
  logger.info('='.repeat(60));

  logger.info('\n📊 Embedding Generation:');
  logger.info(`   Mean: ${stats.embedding.mean.toFixed(2)}ms`);
  logger.info(`   Median: ${stats.embedding.median.toFixed(2)}ms`);
  logger.info(`   P95: ${stats.embedding.p95.toFixed(2)}ms`);
  logger.info(`   P99: ${stats.embedding.p99.toFixed(2)}ms`);
  logger.info(`   Min: ${stats.embedding.min.toFixed(2)}ms`);
  logger.info(`   Max: ${stats.embedding.max.toFixed(2)}ms`);

  logger.info('\n🔍 Vector Search (pgvector):');
  logger.info(`   Mean: ${stats.search.mean.toFixed(2)}ms`);
  logger.info(`   Median: ${stats.search.median.toFixed(2)}ms`);
  logger.info(`   P95: ${stats.search.p95.toFixed(2)}ms`);
  logger.info(`   P99: ${stats.search.p99.toFixed(2)}ms`);
  logger.info(`   Min: ${stats.search.min.toFixed(2)}ms`);
  logger.info(`   Max: ${stats.search.max.toFixed(2)}ms`);

  logger.info('\n⚡ Total (End-to-End):');
  logger.info(`   Mean: ${stats.total.mean.toFixed(2)}ms`);
  logger.info(`   Median: ${stats.total.median.toFixed(2)}ms`);
  logger.info(`   P95: ${stats.total.p95.toFixed(2)}ms`);
  logger.info(`   P99: ${stats.total.p99.toFixed(2)}ms`);

  logger.info('\n📈 Throughput:');
  const throughput = (iterations / (overallTime / 1000)).toFixed(2);
  logger.info(`   ${throughput} queries/second`);

  logger.info('\n🎯 Search Quality:');
  const avgResultsFound = results.reduce((sum, r) => sum + r.results_found, 0) / results.length;
  const avgTopSimilarity = results.reduce((sum, r) => sum + r.top_similarity, 0) / results.length;
  logger.info(`   Average results found: ${avgResultsFound.toFixed(1)}`);
  logger.info(`   Average top similarity: ${(avgTopSimilarity * 100).toFixed(1)}%`);

  // Per-query breakdown (top 5)
  logger.info('\n📝 Sample Query Performance (Top 5):');
  const sortedResults = [...results].sort((a, b) => a.total_time_ms - b.total_time_ms);
  for (let i = 0; i < Math.min(5, sortedResults.length); i++) {
    const r = sortedResults[i];
    logger.info(`   ${i + 1}. "${r.query.slice(0, 40)}${r.query.length > 40 ? '...' : ''}"`);
    logger.info(`      Time: ${r.total_time_ms.toFixed(2)}ms (embed: ${r.embedding_time_ms.toFixed(2)}ms, search: ${r.search_time_ms.toFixed(2)}ms)`);
    logger.info(`      Results: ${r.results_found}, Top similarity: ${(r.top_similarity * 100).toFixed(1)}%`);
  }

  // Performance assessment
  logger.info('\n' + '='.repeat(60));
  logger.info('ASSESSMENT');
  logger.info('='.repeat(60));

  if (stats.search.p95 < 50) {
    logger.info('✅ EXCELLENT: Vector search P95 < 50ms');
  } else if (stats.search.p95 < 100) {
    logger.info('✅ GOOD: Vector search P95 < 100ms');
  } else if (stats.search.p95 < 200) {
    logger.info('⚠️  OK: Vector search P95 < 200ms (consider optimizing indexes)');
  } else {
    logger.info('❌ SLOW: Vector search P95 > 200ms (needs optimization)');
    logger.info('   Suggestions:');
    logger.info('   - Rebuild indexes: REINDEX INDEX ai_knowledge_embedding_ivfflat_idx;');
    logger.info('   - Increase lists parameter in index');
    logger.info('   - Consider HNSW index for better accuracy/performance');
  }

  logger.info('\n📊 Benchmark complete!');
}

function calculateStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    mean: sum / values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

// Run benchmark
benchmark()
  .then(() => process.exit(0))
  .catch(error => {
    logger.error('Benchmark failed:', error);
    process.exit(1);
  });
