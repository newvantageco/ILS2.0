/**
 * pgvector Integration Tests
 *
 * Tests vector similarity search functionality with pgvector extension.
 * Requires pgvector to be installed and database to be set up.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { db } from '../../server/db';
import { aiKnowledgeBase } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { embeddingService } from '../../server/services/EmbeddingService';
import {
  searchKnowledgeBaseByEmbedding,
  createKnowledgeBaseWithEmbedding,
  getEntriesWithoutEmbedding,
  getEmbeddingStats,
  findSimilarDocuments,
} from '../../server/storage-vector';
import crypto from 'crypto';

describe('pgvector Integration Tests', () => {
  const testCompanyId = `test-company-${crypto.randomUUID()}`;
  const testUserId = `test-user-${crypto.randomUUID()}`;
  const createdIds: string[] = [];

  // Test documents about optometry
  const testDocuments = [
    {
      filename: 'progressive-lenses.txt',
      content: 'Progressive lenses are ideal for presbyopia patients over 40 years old. They provide seamless transition between near, intermediate, and distance vision.',
      category: 'lenses',
    },
    {
      filename: 'single-vision.txt',
      content: 'Single vision lenses correct myopia (nearsightedness) or hyperopia (farsightedness). They have one prescription power throughout the entire lens.',
      category: 'lenses',
    },
    {
      filename: 'blue-light.txt',
      content: 'Blue light blocking coatings reduce eye strain from digital screens and computers. Recommended for patients who work long hours on computers.',
      category: 'coatings',
    },
    {
      filename: 'astigmatism.txt',
      content: 'Astigmatism is corrected with cylindrical lenses that compensate for irregular corneal curvature. Cylinder and axis values specify the correction needed.',
      category: 'conditions',
    },
  ];

  beforeAll(async () => {
    // Create test knowledge base entries
    console.log('\n📦 Creating test knowledge base entries...');

    for (const doc of testDocuments) {
      // Generate embedding
      const embedding = await embeddingService.generateEmbedding(doc.content);

      // Create entry
      const entry = await createKnowledgeBaseWithEmbedding({
        companyId: testCompanyId,
        uploadedBy: testUserId,
        filename: doc.filename,
        fileType: 'txt',
        content: doc.content,
        embedding,
        category: doc.category,
        isActive: true,
        processingStatus: 'completed',
      });

      createdIds.push(entry.id);
      console.log(`✅ Created: ${doc.filename}`);
    }

    console.log(`✓ Created ${createdIds.length} test entries\n`);
  });

  afterAll(async () => {
    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await db.delete(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.companyId, testCompanyId));
    console.log('✓ Cleanup complete\n');
  });

  describe('Vector Similarity Search', () => {
    it('should find relevant documents using vector similarity', async () => {
      const query = 'What lenses are best for older patients with reading problems?';
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const results = await searchKnowledgeBaseByEmbedding(
        testCompanyId,
        queryEmbedding,
        { limit: 5, threshold: 0.5 }
      );

      // Should find results
      expect(results.length).toBeGreaterThan(0);

      // Top result should be about progressive lenses (most relevant)
      expect(results[0].filename).toBe('progressive-lenses.txt');

      // Should have similarity scores
      expect(results[0].similarity).toBeGreaterThan(0.5);
      expect(results[0].similarity).toBeLessThanOrEqual(1.0);

      console.log(`\n📊 Query: "${query}"`);
      console.log('Results:');
      results.forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.filename} (${(r.similarity * 100).toFixed(1)}% similar)`);
      });
    });

    it('should return results sorted by similarity (highest first)', async () => {
      const query = 'computer screen eye strain protection';
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const results = await searchKnowledgeBaseByEmbedding(
        testCompanyId,
        queryEmbedding,
        { limit: 10 }
      );

      // Check that results are sorted descending by similarity
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }

      // Top result should be about blue light (most relevant)
      expect(results[0].filename).toBe('blue-light.txt');
    });

    it('should respect similarity threshold', async () => {
      const query = 'weather forecast for tomorrow';  // Unrelated query
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const results = await searchKnowledgeBaseByEmbedding(
        testCompanyId,
        queryEmbedding,
        { limit: 10, threshold: 0.8 }  // High threshold
      );

      // Should find few or no results (unrelated query)
      expect(results.length).toBeLessThan(2);
    });

    it('should respect tenant isolation', async () => {
      const otherCompanyId = `other-company-${crypto.randomUUID()}`;
      const query = 'progressive lenses';
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const results = await searchKnowledgeBaseByEmbedding(
        otherCompanyId,
        queryEmbedding,
        { limit: 10 }
      );

      // Should find no results from other company
      expect(results.length).toBe(0);
    });

    it('should filter by category', async () => {
      const query = 'lens options';
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const results = await searchKnowledgeBaseByEmbedding(
        testCompanyId,
        queryEmbedding,
        { limit: 10, category: 'lenses' }
      );

      // All results should be in 'lenses' category
      results.forEach(result => {
        expect(result.category).toBe('lenses');
      });
    });

    it('should handle empty query', async () => {
      await expect(
        embeddingService.generateEmbedding('')
      ).rejects.toThrow();
    });

    it('should handle invalid embedding dimensions', async () => {
      const invalidEmbedding = new Array(768).fill(0); // Wrong dimensions

      await expect(
        searchKnowledgeBaseByEmbedding(testCompanyId, invalidEmbedding)
      ).rejects.toThrow('Invalid embedding dimensions');
    });
  });

  describe('Embedding Statistics', () => {
    it('should return accurate embedding statistics', async () => {
      const stats = await getEmbeddingStats(testCompanyId);

      expect(stats.total).toBe(testDocuments.length);
      expect(stats.withEmbedding).toBe(testDocuments.length);
      expect(stats.withoutEmbedding).toBe(0);
      expect(stats.migrationProgress).toBe('100%');
    });
  });

  describe('Similar Documents', () => {
    it('should find similar documents to a given document', async () => {
      // Find document about progressive lenses
      const [sourceDoc] = await db
        .select()
        .from(aiKnowledgeBase)
        .where(
          and(
            eq(aiKnowledgeBase.companyId, testCompanyId),
            eq(aiKnowledgeBase.filename, 'progressive-lenses.txt')
          )
        );

      expect(sourceDoc).toBeDefined();

      // Find similar documents
      const similarDocs = await findSimilarDocuments(
        sourceDoc.id,
        testCompanyId,
        { limit: 3, threshold: 0.3 }
      );

      // Should find other lens-related documents
      expect(similarDocs.length).toBeGreaterThan(0);

      // Should not include the source document itself
      expect(similarDocs.every(doc => doc.id !== sourceDoc.id)).toBe(true);

      // Single vision lens should be most similar (also about lenses)
      expect(similarDocs[0].filename).toBe('single-vision.txt');
    });
  });

  describe('Embedding Service', () => {
    it('should generate embeddings with correct dimensions', async () => {
      const text = 'Test text for embedding';
      const embedding = await embeddingService.generateEmbedding(text);

      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(1536); // OpenAI ada-002 dimensions
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
    });

    it('should generate batch embeddings', async () => {
      const texts = [
        'First test text',
        'Second test text',
        'Third test text',
      ];

      const embeddings = await embeddingService.generateEmbeddings(texts);

      expect(embeddings.length).toBe(texts.length);
      embeddings.forEach(embedding => {
        expect(embedding.length).toBe(1536);
      });
    });

    it('should calculate cosine similarity correctly', async () => {
      const text1 = 'Progressive lenses for presbyopia';
      const text2 = 'Progressive lenses for older patients';
      const text3 = 'Computer screen blue light filter';

      const [emb1, emb2, emb3] = await embeddingService.generateEmbeddings([text1, text2, text3]);

      const sim1_2 = embeddingService.calculateSimilarity(emb1, emb2);
      const sim1_3 = embeddingService.calculateSimilarity(emb1, emb3);

      // Similar texts should have higher similarity
      expect(sim1_2).toBeGreaterThan(sim1_3);

      // Similarity should be between 0 and 1
      expect(sim1_2).toBeGreaterThan(0);
      expect(sim1_2).toBeLessThanOrEqual(1);
    });

    it('should use embedding cache', async () => {
      const text = 'Test text for caching';

      // First call (should generate)
      const start1 = Date.now();
      await embeddingService.generateEmbedding(text);
      const time1 = Date.now() - start1;

      // Second call (should use cache)
      const start2 = Date.now();
      await embeddingService.generateEmbedding(text);
      const time2 = Date.now() - start2;

      // Cached call should be significantly faster
      expect(time2).toBeLessThan(time1);
      console.log(`\n⚡ Cache performance: ${time1}ms → ${time2}ms (${((1 - time2/time1) * 100).toFixed(0)}% faster)`);
    });
  });

  describe('Knowledge Base Creation', () => {
    it('should create knowledge base entry with embedding', async () => {
      const content = 'Test document content for knowledge base';
      const embedding = await embeddingService.generateEmbedding(content);

      const entry = await createKnowledgeBaseWithEmbedding({
        companyId: testCompanyId,
        uploadedBy: testUserId,
        filename: 'test-doc.txt',
        fileType: 'txt',
        content,
        embedding,
        category: 'test',
        isActive: true,
        processingStatus: 'completed',
      });

      expect(entry.id).toBeDefined();
      expect(entry.companyId).toBe(testCompanyId);
      expect(entry.content).toBe(content);
      expect(entry.embedding).toBeDefined();

      // Cleanup
      await db.delete(aiKnowledgeBase).where(eq(aiKnowledgeBase.id, entry.id));
    });

    it('should reject entry with invalid embedding dimensions', async () => {
      const invalidEmbedding = new Array(768).fill(0);

      await expect(
        createKnowledgeBaseWithEmbedding({
          companyId: testCompanyId,
          uploadedBy: testUserId,
          filename: 'invalid.txt',
          fileType: 'txt',
          content: 'Test content',
          embedding: invalidEmbedding,
        })
      ).rejects.toThrow('Invalid embedding');
    });
  });
});
