import { useState } from 'react';
import { ShoppingCart, Package, Users, CheckCircle, Glasses, Factory, Store } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

export function FeatureShowcase() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Every Part of the Optical Industry
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're an eye care professional, lab, or supplier, ILS has you covered
          </p>
        </div>

        <Tabs defaultValue="ecps" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-12 h-auto">
            <TabsTrigger value="ecps" className="text-lg py-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Glasses className="mr-2 h-5 w-5" />
              For ECPs
            </TabsTrigger>
            <TabsTrigger value="labs" className="text-lg py-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Factory className="mr-2 h-5 w-5" />
              For Labs
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="text-lg py-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Store className="mr-2 h-5 w-5" />
              For Suppliers
            </TabsTrigger>
          </TabsList>

          {/* ECPs Tab */}
          <TabsContent value="ecps">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Built for Eye Care Professionals
                  </h3>
                  <p className="text-gray-600">
                    Everything you need to run a modern optical practice, from patient exams to final sale
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Complete POS System</h4>
                      <p className="text-gray-600 text-sm">
                        Process sales, manage inventory, and track revenue all in one place
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Digital Prescriptions</h4>
                      <p className="text-gray-600 text-sm">
                        Store and manage all patient prescriptions digitally with easy access
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Smart Ordering</h4>
                      <p className="text-gray-600 text-sm">
                        Order lenses and products from connected labs and suppliers instantly
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Patient Management</h4>
                      <p className="text-gray-600 text-sm">
                        Track appointments, exam history, and follow-ups in one dashboard
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="shadow-xl">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 aspect-[4/3] flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="bg-white rounded-lg p-6 shadow-lg">
                        <div className="text-sm font-semibold text-gray-500 mb-4">ECP Dashboard</div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-blue-100 rounded p-3">
                            <div className="text-2xl font-bold text-blue-900">247</div>
                            <div className="text-xs text-gray-600">Active Patients</div>
                          </div>
                          <div className="bg-green-100 rounded p-3">
                            <div className="text-2xl font-bold text-green-900">£4.2k</div>
                            <div className="text-xs text-gray-600">Today's Sales</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-8 bg-gray-100 rounded"></div>
                          <div className="h-8 bg-gray-100 rounded"></div>
                          <div className="h-8 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="labs">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Digital Workflows for Modern Labs
                  </h3>
                  <p className="text-gray-600">
                    Streamline production from order receipt to quality check to shipping
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Automated Job Tracking</h4>
                      <p className="text-gray-600 text-sm">
                        Track every job from order to quality check to shipping automatically
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Factory className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Production Management</h4>
                      <p className="text-gray-600 text-sm">
                        Manage jobs through surfacing, edging, coating with real-time status
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Quality Control</h4>
                      <p className="text-gray-600 text-sm">
                        Digital QC checklists, approvals, and documentation at every stage
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Direct Practice Connections</h4>
                      <p className="text-gray-600 text-sm">
                        Receive orders directly from connected ECPs with all prescription details
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="shadow-xl">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 aspect-[4/3] flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="bg-white rounded-lg p-6 shadow-lg">
                        <div className="text-sm font-semibold text-gray-500 mb-4">Lab Production Board</div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-yellow-100 rounded p-2">
                            <div className="text-lg font-bold text-yellow-900">12</div>
                            <div className="text-xs text-gray-600">Pending</div>
                          </div>
                          <div className="bg-blue-100 rounded p-2">
                            <div className="text-lg font-bold text-blue-900">8</div>
                            <div className="text-xs text-gray-600">In Progress</div>
                          </div>
                          <div className="bg-green-100 rounded p-2">
                            <div className="text-lg font-bold text-green-900">24</div>
                            <div className="text-xs text-gray-600">Completed</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="h-6 w-6 bg-blue-200 rounded"></div>
                            <div className="flex-1 h-6 bg-gray-100 rounded"></div>
                          </div>
                          <div className="flex gap-2">
                            <div className="h-6 w-6 bg-yellow-200 rounded"></div>
                            <div className="flex-1 h-6 bg-gray-100 rounded"></div>
                          </div>
                          <div className="flex gap-2">
                            <div className="h-6 w-6 bg-green-200 rounded"></div>
                            <div className="flex-1 h-6 bg-gray-100 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    B2B Commerce for Optical Suppliers
                  </h3>
                  <p className="text-gray-600">
                    Connect directly with practices and streamline your B2B operations
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Digital Catalog</h4>
                      <p className="text-gray-600 text-sm">
                        Showcase your full product range to connected practices with pricing
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Automated Ordering</h4>
                      <p className="text-gray-600 text-sm">
                        Receive and process orders automatically with real-time notifications
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Analytics Dashboard</h4>
                      <p className="text-gray-600 text-sm">
                        Track best-sellers, inventory levels, and customer trends in real-time
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Direct Practice Relationships</h4>
                      <p className="text-gray-600 text-sm">
                        Build lasting B2B connections with practices through the marketplace
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="shadow-xl">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 aspect-[4/3] flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="bg-white rounded-lg p-6 shadow-lg">
                        <div className="text-sm font-semibold text-gray-500 mb-4">Supplier Dashboard</div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-purple-100 rounded p-3">
                            <div className="text-2xl font-bold text-purple-900">143</div>
                            <div className="text-xs text-gray-600">Products Listed</div>
                          </div>
                          <div className="bg-green-100 rounded p-3">
                            <div className="text-2xl font-bold text-green-900">38</div>
                            <div className="text-xs text-gray-600">Connected Practices</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-xs">Ray-Ban RB2140</span>
                            <span className="text-xs font-bold">£89</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-xs">Oakley Holbrook</span>
                            <span className="text-xs font-bold">£120</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-xs">Persol PO3019</span>
                            <span className="text-xs font-bold">£145</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
