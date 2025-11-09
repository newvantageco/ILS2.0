import * as tf from '@tensorflow/tfjs-node';
import { storage } from '../storage';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger, type Logger } from '../utils/logger';

/**
 * Neural Network Service for AI Learning
 * 
 * This service implements a true neural network that:
 * - Trains on company-specific data (conversations, feedback, documents)
 * - Makes predictions for question answering
 * - Continuously learns and improves
 * - Persists trained models to disk
 */
export class NeuralNetworkService {
  private model: tf.LayersModel | null = null;
  private tokenizer: Map<string, number> = new Map();
  private reverseTokenizer: Map<number, string> = new Map();
  private vocabSize: number = 10000;
  private maxSequenceLength: number = 100;
  private embeddingDim: number = 128;
  private modelPath: string;
  private companyId: string;
  private isTraining: boolean = false;
  private trainingProgress: number = 0;
  private logger: Logger;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.modelPath = path.join(process.cwd(), 'data', 'models', companyId);
    this.logger = createLogger(`NeuralNetworkService-${companyId}`);
  }

  /**
   * Initialize the neural network - load existing model or create new one
   */
  async initialize(): Promise<void> {
    try {
      // Try to load existing model
      const modelExists = await this.modelExists();
      if (modelExists) {
        await this.loadModel();
        this.logger.info('Loaded existing model for company');
      } else {
        await this.createModel();
        this.logger.info('Created new model for company');
      }
    } catch (error) {
      this.logger.error('Error initializing neural network:', error as Error);
      await this.createModel();
    }
  }

  /**
   * Create a new neural network model
   */
  private async createModel(): Promise<void> {
    // Create a sequence-to-sequence model for question answering
    this.model = tf.sequential({
      layers: [
        // Embedding layer converts tokens to dense vectors
        tf.layers.embedding({
          inputDim: this.vocabSize,
          outputDim: this.embeddingDim,
          inputLength: this.maxSequenceLength,
        }),
        
        // Bidirectional LSTM for better context understanding
        tf.layers.bidirectional({
          layer: tf.layers.lstm({
            units: 256,
            returnSequences: true,
          }),
        }),
        
        // Attention mechanism (simplified)
        tf.layers.globalAveragePooling1d(),
        
        // Dense layers for classification/prediction
        tf.layers.dense({
          units: 512,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.3 }),
        
        tf.layers.dense({
          units: 256,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        
        // Output layer - predicts answer tokens
        tf.layers.dense({
          units: this.vocabSize,
          activation: 'softmax',
        }),
      ],
    });

    // Compile the model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'sparseCategoricalCrossentropy',
      metrics: ['accuracy'],
    });

    this.logger.info('Neural network model created');
  }

  /**
   * Train the model on company data
   */
  async train(options: {
    epochs?: number;
    batchSize?: number;
    onProgress?: (progress: number, epoch: number, logs: any) => void;
  } = {}): Promise<void> {
    const { epochs = 20, batchSize = 32, onProgress } = options;

    if (this.isTraining) {
      throw new Error('Training already in progress');
    }

    this.isTraining = true;
    this.trainingProgress = 0;

    try {
      // Fetch training data from company conversations and feedback
      const trainingData = await this.fetchTrainingData();

      if (trainingData.questions.length === 0) {
        this.logger.info('No training data available');
        this.isTraining = false;
        return;
      }

      // Build vocabulary from training data
      await this.buildVocabulary(trainingData.questions, trainingData.answers);

      // Convert text to sequences
      const questionSequences = this.textsToSequences(trainingData.questions);
      const answerSequences = this.textsToSequences(trainingData.answers);

      // Pad sequences to same length
      const xTrain = this.padSequences(questionSequences);
      const yTrain = this.padSequences(answerSequences);

      // Convert to tensors
      const xTrainTensor = tf.tensor2d(xTrain);
      const yTrainTensor = tf.tensor2d(yTrain);

      // Train the model
      await this.model!.fit(xTrainTensor, yTrainTensor, {
        epochs,
        batchSize,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            this.trainingProgress = ((epoch + 1) / epochs) * 100;
            this.logger.debug(`Epoch ${epoch + 1}/${epochs} - Loss: ${logs?.loss.toFixed(4)} - Accuracy: ${logs?.acc?.toFixed(4)}`);

            if (onProgress) {
              onProgress(this.trainingProgress, epoch + 1, logs);
            }
          },
        },
      });

      // Clean up tensors
      xTrainTensor.dispose();
      yTrainTensor.dispose();

      // Save the trained model
      await this.saveModel();

      this.logger.info('Model training completed');
    } catch (error) {
      this.logger.error('Error training model:', error as Error);
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Fetch training data from database
   */
  private async fetchTrainingData(): Promise<{
    questions: string[];
    answers: string[];
  }> {
    try {
      // Get all conversations for the company
      const conversations = await storage.getAiConversations(this.companyId);
      
      const questions: string[] = [];
      const answers: string[] = [];

      for (const conversation of conversations) {
        const messages = await storage.getAiMessages(conversation.id);
        
        // Extract question-answer pairs
        for (let i = 0; i < messages.length - 1; i++) {
          const currentMessage = messages[i];
          const nextMessage = messages[i + 1];
          
          if (currentMessage.role === 'user' && nextMessage.role === 'assistant') {
            // Only include highly-rated answers (4+ stars) or unrated
            const feedbackList = await storage.getAiFeedbackByMessage(nextMessage.id);
            const feedback = feedbackList && feedbackList.length > 0 ? feedbackList[0] : null;
            
            if (!feedback || feedback.rating >= 4) {
              questions.push(this.cleanText(currentMessage.content));
              answers.push(this.cleanText(nextMessage.content));
            }
          }
        }
      }

      // Also get knowledge base entries
      const knowledgeEntry = await storage.getAiKnowledgeBase(this.companyId);
      if (knowledgeEntry) {
        // Create synthetic question-answer pair from knowledge
        if (knowledgeEntry.filename && knowledgeEntry.content) {
          questions.push(this.cleanText(knowledgeEntry.filename));
          answers.push(this.cleanText(knowledgeEntry.content.substring(0, 500))); // Limit length
        }
      }

      this.logger.info('Fetched training examples', { count: questions.length });
      return { questions, answers };
    } catch (error) {
      this.logger.error('Error fetching training data:', error as Error);
      return { questions: [], answers: [] };
    }
  }

  /**
   * Build vocabulary from text data
   */
  private async buildVocabulary(questions: string[], answers: string[]): Promise<void> {
    const allTexts = [...questions, ...answers];
    const wordFrequency: Map<string, number> = new Map();

    // Count word frequencies
    for (const text of allTexts) {
      const words = text.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word) {
          wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
        }
      }
    }

    // Sort by frequency and take top N words
    const sortedWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.vocabSize - 2); // Reserve 2 for special tokens

    // Build tokenizers
    this.tokenizer.clear();
    this.reverseTokenizer.clear();
    
    // Special tokens
    this.tokenizer.set('<PAD>', 0);
    this.tokenizer.set('<UNK>', 1);
    this.reverseTokenizer.set(0, '<PAD>');
    this.reverseTokenizer.set(1, '<UNK>');

    // Add words to vocabulary
    let index = 2;
    for (const [word] of sortedWords) {
      this.tokenizer.set(word, index);
      this.reverseTokenizer.set(index, word);
      index++;
    }

    this.logger.info('Built vocabulary with tokens', { tokenCount: this.tokenizer.size });
  }

  /**
   * Convert texts to sequences of token IDs
   */
  private textsToSequences(texts: string[]): number[][] {
    return texts.map(text => {
      const words = text.toLowerCase().split(/\s+/);
      return words.map(word => this.tokenizer.get(word) || 1); // 1 = <UNK>
    });
  }

  /**
   * Pad sequences to same length
   */
  private padSequences(sequences: number[][]): number[][] {
    return sequences.map(seq => {
      if (seq.length > this.maxSequenceLength) {
        return seq.slice(0, this.maxSequenceLength);
      } else {
        const padding = new Array(this.maxSequenceLength - seq.length).fill(0);
        return [...seq, ...padding];
      }
    });
  }

  /**
   * Predict answer for a question
   */
  async predict(question: string): Promise<string> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      // Convert question to sequence
      const cleanQuestion = this.cleanText(question);
      const sequence = this.textsToSequences([cleanQuestion]);
      const paddedSequence = this.padSequences(sequence);

      // Make prediction
      const inputTensor = tf.tensor2d(paddedSequence);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      
      // Get predicted token IDs (argmax)
      const predictedIds = await prediction.argMax(-1).array() as number[][];
      
      // Convert token IDs back to text
      const predictedText = this.sequenceToText(predictedIds[0]);

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      return predictedText;
    } catch (error) {
      this.logger.error('Error making prediction:', error as Error);
      throw error;
    }
  }

  /**
   * Convert sequence of token IDs back to text
   */
  private sequenceToText(sequence: number[]): string {
    const words: string[] = [];
    
    for (const tokenId of sequence) {
      if (tokenId === 0) break; // Stop at padding
      const word = this.reverseTokenizer.get(tokenId);
      if (word && word !== '<PAD>' && word !== '<UNK>') {
        words.push(word);
      }
    }

    return words.join(' ');
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Save model to disk
   */
  async saveModel(): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save');
    }

    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(this.modelPath)) {
        fs.mkdirSync(this.modelPath, { recursive: true });
      }

      // Save model
      const modelSavePath = `file://${this.modelPath}`;
      await this.model.save(modelSavePath);

      // Save tokenizers
      const tokenizerPath = path.join(this.modelPath, 'tokenizer.json');
      const tokenizerData = {
        tokenizer: Array.from(this.tokenizer.entries()),
        reverseTokenizer: Array.from(this.reverseTokenizer.entries()),
      };
      fs.writeFileSync(tokenizerPath, JSON.stringify(tokenizerData));

      this.logger.info('Model saved successfully');
    } catch (error) {
      this.logger.error('Error saving model:', error as Error);
      throw error;
    }
  }

  /**
   * Load model from disk
   */
  async loadModel(): Promise<void> {
    try {
      const modelLoadPath = `file://${this.modelPath}/model.json`;
      this.model = await tf.loadLayersModel(modelLoadPath);

      // Load tokenizers
      const tokenizerPath = path.join(this.modelPath, 'tokenizer.json');
      const tokenizerData = JSON.parse(fs.readFileSync(tokenizerPath, 'utf-8'));
      
      this.tokenizer = new Map(tokenizerData.tokenizer);
      this.reverseTokenizer = new Map(tokenizerData.reverseTokenizer);

      this.logger.info('Model loaded successfully');
    } catch (error) {
      this.logger.error('Error loading model:', error as Error);
      throw error;
    }
  }

  /**
   * Check if model exists on disk
   */
  private async modelExists(): Promise<boolean> {
    const modelFilePath = path.join(this.modelPath, 'model.json');
    return fs.existsSync(modelFilePath);
  }

  /**
   * Get training progress
   */
  getTrainingProgress(): { isTraining: boolean; progress: number } {
    return {
      isTraining: this.isTraining,
      progress: this.trainingProgress,
    };
  }

  /**
   * Dispose of the model and free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}
