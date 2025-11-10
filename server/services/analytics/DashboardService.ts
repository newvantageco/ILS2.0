/**
 * Dashboard Service
 *
 * Manages dashboard configurations, widgets, and layouts for
 * business intelligence visualization
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';
import { AnalyticsEngineService, MetricValue } from './AnalyticsEngineService.js';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Widget type
 */
export type WidgetType =
  | 'metric_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'table'
  | 'heatmap'
  | 'gauge'
  | 'funnel'
  | 'trend';

/**
 * Dashboard widget
 */
export interface DashboardWidget {
  id: string;
  dashboardId: string;
  type: WidgetType;
  title: string;
  description?: string;

  // Layout
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Configuration
  config: {
    metricIds?: string[];
    chartType?: string;
    colors?: string[];
    showLegend?: boolean;
    showLabels?: boolean;
    aggregation?: string;
    filters?: any[];
    refreshInterval?: number; // seconds
  };

  // Data
  data?: any;
  lastRefreshed?: Date;

  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Dashboard
 */
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  category: 'executive' | 'clinical' | 'financial' | 'operational' | 'custom';

  // Access control
  ownerId: string;
  isPublic: boolean;
  sharedWith?: string[]; // user IDs

  // Layout
  layout: {
    columns: number;
    rows: number;
  };

  widgets: string[]; // widget IDs

  // Settings
  refreshInterval: number; // seconds, 0 = manual
  theme: 'light' | 'dark' | 'auto';

  createdAt: Date;
  updatedAt?: Date;
  lastViewedAt?: Date;
}

/**
 * Dashboard template
 */
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: Dashboard['category'];
  widgets: Array<Omit<DashboardWidget, 'id' | 'dashboardId' | 'createdAt'>>;
  previewImage?: string;
}

/**
 * Dashboard Service
 */
export class DashboardService {
  /**
   * In-memory stores (use database in production)
   */
  private static dashboards = new Map<string, Dashboard>();
  private static widgets = new Map<string, DashboardWidget>();
  private static templates = new Map<string, DashboardTemplate>();

  /**
   * Default dashboards
   */
  static {
    this.initializeDefaultTemplates();
  }

  // ========== Dashboard Management ==========

  /**
   * Create dashboard
   */
  static async createDashboard(
    name: string,
    ownerId: string,
    category: Dashboard['category'] = 'custom',
    options?: {
      description?: string;
      isPublic?: boolean;
      layout?: Dashboard['layout'];
      theme?: Dashboard['theme'];
    }
  ): Promise<Dashboard> {
    const dashboard: Dashboard = {
      id: crypto.randomUUID(),
      name,
      description: options?.description,
      category,
      ownerId,
      isPublic: options?.isPublic ?? false,
      layout: options?.layout || { columns: 12, rows: 12 },
      widgets: [],
      refreshInterval: 300, // 5 minutes
      theme: options?.theme || 'light',
      createdAt: new Date(),
    };

    this.dashboards.set(dashboard.id, dashboard);

    logger.info({ dashboardId: dashboard.id, name, ownerId }, 'Dashboard created');

    return dashboard;
  }

  /**
   * Get dashboard
   */
  static async getDashboard(dashboardId: string): Promise<Dashboard | null> {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * List dashboards for user
   */
  static async listDashboards(
    userId: string,
    category?: Dashboard['category']
  ): Promise<Dashboard[]> {
    let dashboards = Array.from(this.dashboards.values()).filter(
      (d) =>
        d.ownerId === userId ||
        d.isPublic ||
        d.sharedWith?.includes(userId)
    );

    if (category) {
      dashboards = dashboards.filter((d) => d.category === category);
    }

    return dashboards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update dashboard
   */
  static async updateDashboard(
    dashboardId: string,
    updates: Partial<Omit<Dashboard, 'id' | 'ownerId' | 'createdAt'>>
  ): Promise<Dashboard | null> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return null;
    }

    Object.assign(dashboard, updates, {
      updatedAt: new Date(),
    });

    this.dashboards.set(dashboardId, dashboard);

    logger.info({ dashboardId }, 'Dashboard updated');

    return dashboard;
  }

  /**
   * Delete dashboard
   */
  static async deleteDashboard(dashboardId: string): Promise<boolean> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return false;
    }

    // Delete all widgets
    dashboard.widgets.forEach((widgetId) => {
      this.widgets.delete(widgetId);
    });

    this.dashboards.delete(dashboardId);

    logger.info({ dashboardId }, 'Dashboard deleted');

    return true;
  }

  /**
   * Share dashboard
   */
  static async shareDashboard(
    dashboardId: string,
    userIds: string[]
  ): Promise<Dashboard | null> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return null;
    }

    dashboard.sharedWith = Array.from(new Set([...(dashboard.sharedWith || []), ...userIds]));
    dashboard.updatedAt = new Date();

    this.dashboards.set(dashboardId, dashboard);

    logger.info({ dashboardId, userIds }, 'Dashboard shared');

    return dashboard;
  }

  // ========== Widget Management ==========

  /**
   * Add widget to dashboard
   */
  static async addWidget(
    dashboardId: string,
    widget: Omit<DashboardWidget, 'id' | 'dashboardId' | 'createdAt'>
  ): Promise<DashboardWidget | null> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return null;
    }

    const newWidget: DashboardWidget = {
      id: crypto.randomUUID(),
      dashboardId,
      ...widget,
      createdAt: new Date(),
    };

    this.widgets.set(newWidget.id, newWidget);

    dashboard.widgets.push(newWidget.id);
    dashboard.updatedAt = new Date();
    this.dashboards.set(dashboardId, dashboard);

    logger.info({ dashboardId, widgetId: newWidget.id, type: widget.type }, 'Widget added');

    return newWidget;
  }

  /**
   * Get widget
   */
  static async getWidget(widgetId: string): Promise<DashboardWidget | null> {
    return this.widgets.get(widgetId) || null;
  }

  /**
   * Get dashboard widgets
   */
  static async getDashboardWidgets(dashboardId: string): Promise<DashboardWidget[]> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return [];
    }

    return dashboard.widgets
      .map((id) => this.widgets.get(id))
      .filter((w): w is DashboardWidget => w !== undefined)
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  }

  /**
   * Update widget
   */
  static async updateWidget(
    widgetId: string,
    updates: Partial<Omit<DashboardWidget, 'id' | 'dashboardId' | 'createdAt'>>
  ): Promise<DashboardWidget | null> {
    const widget = this.widgets.get(widgetId);

    if (!widget) {
      return null;
    }

    Object.assign(widget, updates, {
      updatedAt: new Date(),
    });

    this.widgets.set(widgetId, widget);

    return widget;
  }

  /**
   * Delete widget
   */
  static async deleteWidget(widgetId: string): Promise<boolean> {
    const widget = this.widgets.get(widgetId);

    if (!widget) {
      return false;
    }

    const dashboard = this.dashboards.get(widget.dashboardId);

    if (dashboard) {
      dashboard.widgets = dashboard.widgets.filter((id) => id !== widgetId);
      dashboard.updatedAt = new Date();
      this.dashboards.set(dashboard.id, dashboard);
    }

    this.widgets.delete(widgetId);

    logger.info({ widgetId, dashboardId: widget.dashboardId }, 'Widget deleted');

    return true;
  }

  /**
   * Refresh widget data
   */
  static async refreshWidgetData(widgetId: string): Promise<DashboardWidget | null> {
    const widget = this.widgets.get(widgetId);

    if (!widget) {
      return null;
    }

    // Fetch fresh data based on widget type
    try {
      let data: any;

      if (widget.config.metricIds && widget.config.metricIds.length > 0) {
        // Fetch metric values
        const metricValues = await Promise.all(
          widget.config.metricIds.map((metricId) =>
            AnalyticsEngineService.getMetricValue(metricId, 'month')
          )
        );

        data = metricValues.filter((v): v is MetricValue => v !== null);
      }

      widget.data = data;
      widget.lastRefreshed = new Date();
      widget.updatedAt = new Date();

      this.widgets.set(widgetId, widget);

      return widget;
    } catch (error) {
      logger.error({ error, widgetId }, 'Failed to refresh widget data');
      return widget;
    }
  }

  /**
   * Refresh all dashboard widgets
   */
  static async refreshDashboard(dashboardId: string): Promise<Dashboard | null> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return null;
    }

    // Refresh all widgets in parallel
    await Promise.all(
      dashboard.widgets.map((widgetId) => this.refreshWidgetData(widgetId))
    );

    dashboard.lastViewedAt = new Date();
    this.dashboards.set(dashboardId, dashboard);

    logger.info({ dashboardId, widgetCount: dashboard.widgets.length }, 'Dashboard refreshed');

    return dashboard;
  }

  // ========== Templates ==========

  /**
   * Initialize default templates
   */
  private static initializeDefaultTemplates(): void {
    // Executive Dashboard Template
    this.templates.set('executive', {
      id: 'executive',
      name: 'Executive Dashboard',
      description: 'High-level KPIs and business metrics',
      category: 'executive',
      widgets: [
        {
          type: 'metric_card',
          title: 'Total Revenue',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: { metricIds: ['revenue_total'] },
        },
        {
          type: 'metric_card',
          title: 'Active Patients',
          position: { x: 3, y: 0, width: 3, height: 2 },
          config: { metricIds: ['patients_active'] },
        },
        {
          type: 'metric_card',
          title: 'Appointments Today',
          position: { x: 6, y: 0, width: 3, height: 2 },
          config: { metricIds: ['appointments_today'] },
        },
        {
          type: 'metric_card',
          title: 'Revenue per Patient',
          position: { x: 9, y: 0, width: 3, height: 2 },
          config: { metricIds: ['revenue_per_patient'] },
        },
        {
          type: 'line_chart',
          title: 'Revenue Trend',
          position: { x: 0, y: 2, width: 6, height: 4 },
          config: { metricIds: ['revenue_total'], showLegend: true },
        },
        {
          type: 'bar_chart',
          title: 'Appointments by Type',
          position: { x: 6, y: 2, width: 6, height: 4 },
          config: { metricIds: ['appointments_by_type'] },
        },
      ],
    });

    // Clinical Dashboard Template
    this.templates.set('clinical', {
      id: 'clinical',
      name: 'Clinical Operations',
      description: 'Patient care and clinical metrics',
      category: 'clinical',
      widgets: [
        {
          type: 'metric_card',
          title: 'Patient Visits Today',
          position: { x: 0, y: 0, width: 4, height: 2 },
          config: { metricIds: ['visits_today'] },
        },
        {
          type: 'metric_card',
          title: 'Avg Wait Time',
          position: { x: 4, y: 0, width: 4, height: 2 },
          config: { metricIds: ['wait_time_avg'] },
        },
        {
          type: 'metric_card',
          title: 'Patient Satisfaction',
          position: { x: 8, y: 0, width: 4, height: 2 },
          config: { metricIds: ['satisfaction_score'] },
        },
      ],
    });

    // Financial Dashboard Template
    this.templates.set('financial', {
      id: 'financial',
      name: 'Financial Performance',
      description: 'Revenue, collections, and financial metrics',
      category: 'financial',
      widgets: [
        {
          type: 'metric_card',
          title: 'Monthly Revenue',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: { metricIds: ['revenue_monthly'] },
        },
        {
          type: 'metric_card',
          title: 'Outstanding AR',
          position: { x: 3, y: 0, width: 3, height: 2 },
          config: { metricIds: ['ar_outstanding'] },
        },
        {
          type: 'metric_card',
          title: 'Collection Rate',
          position: { x: 6, y: 0, width: 3, height: 2 },
          config: { metricIds: ['collection_rate'] },
        },
        {
          type: 'metric_card',
          title: 'Claims Pending',
          position: { x: 9, y: 0, width: 3, height: 2 },
          config: { metricIds: ['claims_pending'] },
        },
      ],
    });
  }

  /**
   * Get template
   */
  static async getTemplate(templateId: string): Promise<DashboardTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  /**
   * List templates
   */
  static async listTemplates(): Promise<DashboardTemplate[]> {
    return Array.from(this.templates.values());
  }

  /**
   * Create dashboard from template
   */
  static async createFromTemplate(
    templateId: string,
    name: string,
    ownerId: string
  ): Promise<Dashboard | null> {
    const template = this.templates.get(templateId);

    if (!template) {
      return null;
    }

    // Create dashboard
    const dashboard = await this.createDashboard(name, ownerId, template.category, {
      description: template.description,
    });

    // Add widgets from template
    for (const widgetTemplate of template.widgets) {
      await this.addWidget(dashboard.id, widgetTemplate);
    }

    logger.info({ dashboardId: dashboard.id, templateId }, 'Dashboard created from template');

    return dashboard;
  }

  // ========== Export/Import ==========

  /**
   * Export dashboard configuration
   */
  static async exportDashboard(dashboardId: string): Promise<any> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return null;
    }

    const widgets = await this.getDashboardWidgets(dashboardId);

    return {
      dashboard: {
        name: dashboard.name,
        description: dashboard.description,
        category: dashboard.category,
        layout: dashboard.layout,
        refreshInterval: dashboard.refreshInterval,
        theme: dashboard.theme,
      },
      widgets: widgets.map((w) => ({
        type: w.type,
        title: w.title,
        description: w.description,
        position: w.position,
        config: w.config,
      })),
    };
  }

  /**
   * Import dashboard configuration
   */
  static async importDashboard(
    config: any,
    ownerId: string
  ): Promise<Dashboard | null> {
    const dashboard = await this.createDashboard(
      config.dashboard.name,
      ownerId,
      config.dashboard.category,
      {
        description: config.dashboard.description,
        layout: config.dashboard.layout,
        theme: config.dashboard.theme,
      }
    );

    // Add widgets
    for (const widgetConfig of config.widgets) {
      await this.addWidget(dashboard.id, widgetConfig);
    }

    logger.info({ dashboardId: dashboard.id }, 'Dashboard imported');

    return dashboard;
  }
}
