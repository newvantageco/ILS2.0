import { useState } from 'react';
import { Sparkles, Send, TrendingUp, AlertCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export function AISpotlight() {
  const [query, setQuery] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const exampleQueries = [
    "Show me my top-selling frames this month",
    "Which products are low stock?",
    "What's my revenue trend?",
    "Who are my most frequent patients?",
  ];

  const handleTryExample = (example: string) => {
    setQuery(example);
    setShowResponse(true);
    
    // Reset after 5 seconds
    setTimeout(() => {
      setShowResponse(false);
      setQuery('');
    }, 5000);
  };

  const handleAIQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsLoading(true);
    try {
      // Call the AI assistant API
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: queryText,
          context: 'landing_page_demo'
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const aiResponse = await response.json();
      setResponse(aiResponse.response);
    } catch (error) {
      // Fallback to demo data for landing page
      const fallbackResponse: Record<string, any> = {
    "Show me my top-selling frames this month": {
      title: "Top 5 Frames This Month",
      items: [
        { name: "Ray-Ban RB2140", sold: 23, revenue: "£3,450" },
        { name: "Oakley Holbrook", sold: 18, revenue: "£2,880" },
        { name: "Persol PO3019", sold: 15, revenue: "£2,250" },
        { name: "Tom Ford TF5401", sold: 12, revenue: "£1,920" },
        { name: "Prada PR 17WS", sold: 10, revenue: "£1,600" },
      ]
    },
    "Which products are low stock?": {
      title: "Low Stock Alert",
      items: [
        { name: "Ray-Ban RB2140", stock: 3, threshold: 10 },
        { name: "Varilux lenses", stock: 5, threshold: 15 },
        { name: "Lens cleaning solution", stock: 2, threshold: 20 },
      ]
    }
  };

      setResponse(fallbackResponse[queryText as keyof typeof fallbackResponse] || "I'm sorry, I couldn't process that request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Use the response state (either from AI or fallback)
  const currentResponse = response;

  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Your AI-Powered Practice Assistant
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stop digging through reports. Just ask in plain English.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Interactive Demo */}
          <Card className="shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              {/* Chat Interface */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">ILS AI Assistant</div>
                    <div className="text-xs text-white/80">Always ready to help</div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white min-h-[300px]">
                {/* Messages */}
                <div className="space-y-4 mb-6">
                  {!showResponse ? (
                    <div className="text-center py-8">
                      <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Ask me anything about your practice
                      </p>
                      <p className="text-sm text-gray-500">
                        Try one of these examples:
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white rounded-lg px-4 py-3 max-w-md">
                          {query}
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-md">
                          {currentResponse && (
                            <div>
                              <div className="font-semibold text-gray-900 mb-3">
                                {currentResponse.title}
                              </div>
                              
                              {query.includes("top-selling") && (
                                <div className="space-y-2">
                                  {currentResponse.items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded text-sm">
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {index + 1}. {item.name}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {item.sold} sold
                                        </div>
                                      </div>
                                      <div className="font-bold text-green-600">
                                        {item.revenue}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {query.includes("low stock") && (
                                <div className="space-y-2">
                                  {currentResponse.items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded text-sm border-l-4 border-red-500">
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {item.name}
                                        </div>
                                        <div className="text-xs text-red-600">
                                          Only {item.stock} left (min: {item.threshold})
                                        </div>
                                      </div>
                                      <AlertCircle className="h-5 w-5 text-red-500" />
                                    </div>
                                  ))}
                                  <div className="mt-3 pt-3 border-t border-gray-300">
                                    <p className="text-sm text-gray-600">
                                      💡 Recommendation: Consider reordering these items soon
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Example Queries */}
                {!showResponse && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {exampleQueries.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => handleTryExample(example)}
                        className="text-left p-3 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all text-sm text-gray-700 hover:text-blue-900"
                      >
                        💬 {example}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask anything..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && query) {
                        handleTryExample(query);
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => query && handleTryExample(query)}
                    disabled={!query}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Natural Language</h4>
                <p className="text-sm text-gray-600">
                  Ask questions in plain English, no technical jargon required
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Instant Insights</h4>
                <p className="text-sm text-gray-600">
                  Get answers in seconds, not hours of manual report generation
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Proactive Alerts</h4>
                <p className="text-sm text-gray-600">
                  AI notifies you about issues before they become problems
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
              Try AI Demo
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-gray-600 mt-4">
              Available with Full Experience plan
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
