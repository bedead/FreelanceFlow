import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Clock, 
  Users, 
  Calendar,
  FileText,
  Plus,
  UserPlus,
  Receipt
} from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceWithClient } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    select: (data: InvoiceWithClient[]) => data.slice(0, 3).sort((a, b) => 
      new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
    ),
  });

  const { data: upcomingDueDates } = useQuery({
    queryKey: ["/api/invoices"],
    select: (data: InvoiceWithClient[]) => 
      data
        .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDueDateText = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `In ${diffDays} days`;
    return 'Overdue';
  };

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Welcome back! Here's your business overview."
      />

      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statsLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    <span className="inline-flex items-center">
                      ↗ {stats?.revenueGrowth || 0}% from last month
                    </span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statsLoading ? '...' : formatCurrency(stats?.outstanding || 0)}
                  </p>
                  <p className="text-sm text-amber-600 mt-1">
                    {stats?.outstandingCount || 0} pending invoices
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statsLoading ? '...' : stats?.totalClients || 0}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {stats?.activeClients || 0} active this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statsLoading ? '...' : formatCurrency(stats?.thisMonth || 0)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {stats?.monthlyInvoices || 0} invoices sent
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Invoices */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Invoices</CardTitle>
                <Link href="/invoices">
                  <Button variant="ghost" size="sm">View all</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {invoicesLoading ? (
                  <p className="text-gray-500 text-center py-8">Loading invoices...</p>
                ) : recentInvoices && recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{invoice.number}</p>
                          <p className="text-sm text-gray-600">{invoice.client.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(parseFloat(invoice.total || '0'))}
                        </p>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No invoices yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Upcoming Due Dates */}
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle>Upcoming Due Dates</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {upcomingDueDates && upcomingDueDates.length > 0 ? (
                    upcomingDueDates.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{invoice.client.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(parseFloat(invoice.total || '0'))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-amber-600">
                            {getDueDateText(invoice.dueDate.toString())}
                          </p>
                          <p className="text-xs text-gray-500">{invoice.number}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No upcoming due dates</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Link href="/invoices">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Invoice
                    </Button>
                  </Link>
                  <Link href="/clients">
                    <Button variant="secondary" className="w-full">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Client
                    </Button>
                  </Link>
                  <Link href="/expenses">
                    <Button variant="secondary" className="w-full">
                      <Receipt className="w-4 h-4 mr-2" />
                      Log Expense
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
