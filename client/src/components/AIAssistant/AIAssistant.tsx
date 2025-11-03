/**
 * Subscriber AI Widget Component
 * 
 * React component that displays the AI Assistant for subscriber companies.
 * Each subscriber gets their own isolated AI instance with their data.
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, Spin, Alert, Tooltip, Statistic } from 'antd';
import { RobotOutlined, SendOutlined, ReloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import './AIAssistant.css';

const { TextArea } = Input;
const { Option } = Select;

interface AIAssistantProps {
  tenantId: string;
  userId: string;
  userName: string;
  subscriptionTier: 'basic' | 'professional' | 'enterprise';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  fromCache?: boolean;
  tokensUsed?: number;
}

interface UsageStats {
  requestsCount: number;
  tokensUsed: number;
  cacheHits: number;
  remainingRequests: number;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  tenantId,
  userId,
  userName,
  subscriptionTier
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [queryType, setQueryType] = useState<'sales' | 'inventory' | 'patient_analytics' | 'ophthalmic_knowledge'>('ophthalmic_knowledge');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Feature availability based on subscription tier
  const availableFeatures = {
    basic: ['ophthalmic_knowledge'],
    professional: ['ophthalmic_knowledge', 'sales', 'inventory'],
    enterprise: ['ophthalmic_knowledge', 'sales', 'inventory', 'patient_analytics']
  };

  const features = availableFeatures[subscriptionTier];

  // Load usage stats on mount
  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/ai/usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const stats = await response.json();
        setUsageStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch usage stats:', err);
    }
  };

  const handleSendQuery = async () => {
    if (!inputQuery.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: inputQuery,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          question: inputQuery,
          query_type: queryType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        } else if (response.status === 403) {
          throw new Error('This feature is not available in your subscription plan.');
        } else {
          throw new Error(errorData.detail || 'Failed to get response from AI');
        }
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        fromCache: data.from_cache,
        tokensUsed: data.metadata?.tokens_used
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update usage stats
      fetchUsageStats();

    } catch (err: any) {
      setError(err.message);
      console.error('AI query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
  };

  const getQueryTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ophthalmic_knowledge: 'Ophthalmic Knowledge',
      sales: 'Sales Analytics',
      inventory: 'Inventory Check',
      patient_analytics: 'Patient Trends'
    };
    return labels[type] || type;
  };

  const getQueryTypeDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      ophthalmic_knowledge: 'Ask about lenses, frames, prescriptions, and optical dispensing',
      sales: 'Query your sales data, revenue trends, and top products',
      inventory: 'Check stock levels, reorder points, and supplier information',
      patient_analytics: 'Analyze patient demographics and purchasing patterns (anonymized data)'
    };
    return descriptions[type] || '';
  };

  return (
    <div className="ai-assistant-container">
      <Card
        title={
          <div className="ai-assistant-header">
            <RobotOutlined style={{ marginRight: 8 }} />
            AI Assistant
            <Badge 
              count={subscriptionTier.toUpperCase()} 
              style={{ marginLeft: 12, backgroundColor: '#52c41a' }}
            />
          </div>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={clearConversation}
            type="text"
            title="Clear conversation"
          />
        }
        className="ai-assistant-card"
      >
        {/* Usage Stats */}
        {usageStats && (
          <div className="usage-stats">
            <Statistic
              title="Requests Today"
              value={usageStats.requestsCount}
              suffix={`/ ${usageStats.remainingRequests + usageStats.requestsCount}`}
              valueStyle={{ fontSize: 14 }}
            />
            <Statistic
              title="Cache Hits"
              value={usageStats.cacheHits}
              suffix={`(${usageStats.requestsCount > 0 ? Math.round((usageStats.cacheHits / usageStats.requestsCount) * 100) : 0}%)`}
              valueStyle={{ fontSize: 14, color: '#52c41a' }}
            />
          </div>
        )}

        {/* Query Type Selector */}
        <div className="query-type-selector">
          <label>
            Query Type:
            <Tooltip title={getQueryTypeDescription(queryType)}>
              <QuestionCircleOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          </label>
          <Select
            value={queryType}
            onChange={setQueryType}
            style={{ width: '100%', marginTop: 8 }}
          >
            {features.includes('ophthalmic_knowledge') && (
              <Option value="ophthalmic_knowledge">
                {getQueryTypeLabel('ophthalmic_knowledge')}
              </Option>
            )}
            {features.includes('sales') && (
              <Option value="sales">
                {getQueryTypeLabel('sales')}
              </Option>
            )}
            {features.includes('inventory') && (
              <Option value="inventory">
                {getQueryTypeLabel('inventory')}
              </Option>
            )}
            {features.includes('patient_analytics') && (
              <Option value="patient_analytics">
                {getQueryTypeLabel('patient_analytics')}
              </Option>
            )}
          </Select>
          <p className="query-type-description">
            {getQueryTypeDescription(queryType)}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Messages Display */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <RobotOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              <p>Ask me anything about optical dispensing, your business data, or patient trends!</p>
              <div className="example-queries">
                <p><strong>Example questions:</strong></p>
                <ul>
                  <li>"What are progressive lenses?"</li>
                  <li>"What were our top 3 selling products last month?"</li>
                  <li>"Which items are low in stock?"</li>
                  <li>"What percentage of patients purchased progressive lenses?"</li>
                </ul>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.role}`}
              >
                <div className="message-header">
                  <strong>{msg.role === 'user' ? userName : 'AI Assistant'}</strong>
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">
                  {msg.content}
                </div>
                {msg.fromCache && (
                  <Badge
                    count="Cached"
                    style={{ backgroundColor: '#52c41a', marginTop: 8 }}
                  />
                )}
                {msg.tokensUsed && (
                  <span className="tokens-used">
                    {msg.tokensUsed} tokens
                  </span>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="message assistant loading">
              <Spin /> Thinking...
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-area">
          <TextArea
            value={inputQuery}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about ${getQueryTypeLabel(queryType).toLowerCase()}...`}
            autoSize={{ minRows: 2, maxRows: 4 }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendQuery}
            loading={loading}
            disabled={!inputQuery.trim()}
            style={{ marginTop: 8 }}
          >
            Send
          </Button>
        </div>

        {/* Subscription Info */}
        <div className="subscription-info">
          <p>
            <strong>Your Plan:</strong> {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
          </p>
          {subscriptionTier !== 'enterprise' && (
            <p className="upgrade-prompt">
              <a href="/subscription/upgrade">Upgrade</a> to unlock more features
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AIAssistant;
