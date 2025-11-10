/**
 * OpenTelemetry Distributed Tracing Configuration
 * Provides distributed tracing across microservices and external calls
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import logger from './logger';

const isProduction = process.env.NODE_ENV === 'production';
const isEnabled = process.env.OTEL_ENABLED === 'true';

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK
 */
export function initOpenTelemetry() {
  if (!isEnabled) {
    logger.info('OpenTelemetry is disabled (OTEL_ENABLED not set to true)');
    return;
  }

  try {
    // Prometheus metrics exporter
    const prometheusExporter = new PrometheusExporter({
      port: parseInt(process.env.OTEL_PROMETHEUS_PORT || '9464'),
    }, () => {
      logger.info(
        { port: process.env.OTEL_PROMETHEUS_PORT || '9464' },
        'Prometheus metrics endpoint started'
      );
    });

    sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'ils-api',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      }),

      // Automatic instrumentations for common libraries
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable noisy instrumentations
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          // Configure HTTP instrumentation
          '@opentelemetry/instrumentation-http': {
            ignoreIncomingPaths: [
              '/health',
              '/api/health',
              '/metrics',
              '/favicon.ico',
            ],
          },
          // Configure Express instrumentation
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
          // Configure PostgreSQL instrumentation
          '@opentelemetry/instrumentation-pg': {
            enabled: true,
          },
          // Configure Redis instrumentation
          '@opentelemetry/instrumentation-redis-4': {
            enabled: true,
          },
        }),
      ],

      // Metrics exporter
      metricReader: prometheusExporter,
    });

    sdk.start();

    logger.info(
      {
        service: 'ils-api',
        environment: process.env.NODE_ENV,
      },
      'OpenTelemetry SDK initialized'
    );

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      try {
        await sdk?.shutdown();
        logger.info('OpenTelemetry SDK shut down successfully');
      } catch (error) {
        logger.error({ err: error }, 'Error shutting down OpenTelemetry SDK');
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize OpenTelemetry');
  }
}

/**
 * Shutdown OpenTelemetry
 */
export async function shutdownOpenTelemetry() {
  if (!sdk || !isEnabled) return;

  try {
    await sdk.shutdown();
    logger.info('OpenTelemetry shut down gracefully');
  } catch (error) {
    logger.error({ err: error }, 'Error during OpenTelemetry shutdown');
    throw error;
  }
}

export { sdk };
