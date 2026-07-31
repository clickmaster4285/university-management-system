// src/routes/app.finance.tsx
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  PiggyBank,
  RefreshCw,
  Plus,
  X,
  Save,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Search
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { financeAPI, Finance, Invoice, BudgetAllocation } from "@/lib/api/finance";

export const Route = createFileRoute("/app/finance")({
  head: () => ({
    meta: [
      { title: "Finance — ScholarOS" },
      { name: "description", content: "Income, expenses, payroll, budgets, tax, invoices, and refunds." },
      { property: "og:title", content: "Finance — ScholarOS" },
      { property: "og:description", content: "Financial operations." },
    ],
  }),
  component: FinancePage,
});

function FinancePage() {
  const [financeData, setFinanceData] = useState<Finance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    vendor: '',
    amount: 0,
    status: 'Pending' as Invoice['status'],
    dueDate: '',
    description: '',
    category: 'Other'
  });

  // Budget form state
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[]>([]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await financeAPI.getAll();
      if (response && response.success) {
        setFinanceData(response.data);
        setBudgetAllocations(response.data.budgetAllocation || []);
        console.log('✅ Loaded finance data');
      } else {
        setError('No data received');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch finance data:', error);
      let errorMsg = 'Failed to load finance data';
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMsg = 'Cannot connect to backend. Make sure the backend is running on the configured API port.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // Handle invoice form input
  const handleInvoiceInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoiceForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  // Open add invoice modal
  const openAddInvoice = () => {
    setEditingInvoice(null);
    setInvoiceForm({
      vendor: '',
      amount: 0,
      status: 'Pending',
      dueDate: '',
      description: '',
      category: 'Other'
    });
    setIsInvoiceModalOpen(true);
  };

  // Open edit invoice modal
  const openEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      vendor: invoice.vendor,
      amount: invoice.amount,
      status: invoice.status,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      description: invoice.description || '',
      category: invoice.category || 'Other'
    });
    setIsInvoiceModalOpen(true);
  };

  // Close invoice modal
  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setEditingInvoice(null);
  };

  // Handle invoice submit
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!invoiceForm.vendor || !invoiceForm.amount) {
        toast.error('Vendor and Amount are required');
        setIsSubmitting(false);
        return;
      }

      if (editingInvoice) {
        // Update invoice status only (simplified)
        await financeAPI.updateInvoiceStatus(editingInvoice.invoiceId, invoiceForm.status);
        toast.success('Invoice status updated successfully!');
      } else {
        // Create new invoice
        await financeAPI.addInvoice(invoiceForm);
        toast.success('Invoice added successfully!');
      }

      closeInvoiceModal();
      await fetchFinanceData();
    } catch (error: any) {
      console.error('Failed to save invoice:', error);
      toast.error(error.message || 'Failed to save invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete invoice
  const handleDeleteInvoice = async (invoiceId: string, vendor: string) => {
    if (!confirm(`Are you sure you want to delete invoice from "${vendor}"?`)) return;
    
    try {
      await financeAPI.deleteInvoice(invoiceId);
      toast.success('Invoice deleted successfully');
      await fetchFinanceData();
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      toast.error(error.message || 'Failed to delete invoice');
    }
  };

  // Handle budget update
  const handleBudgetChange = (index: number, field: keyof BudgetAllocation, value: string | number) => {
    const newAllocations = [...budgetAllocations];
    newAllocations[index] = {
      ...newAllocations[index],
      [field]: field === 'percentage' ? parseFloat(value as string) || 0 : value
    };
    setBudgetAllocations(newAllocations);
  };

  // Save budget allocations
  const handleBudgetSave = async () => {
    try {
      setIsSubmitting(true);
      await financeAPI.updateBudget(budgetAllocations);
      toast.success('Budget allocation updated successfully!');
      setIsBudgetModalOpen(false);
      await fetchFinanceData();
    } catch (error: any) {
      console.error('Failed to update budget:', error);
      toast.error(error.message || 'Failed to update budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Finance" subtitle="Loading financial data...">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading financial data...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Finance" subtitle="Error loading data">
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load data</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{error}</p>
          <Button onClick={fetchFinanceData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell 
      title="Finance" 
      subtitle={`${financeData?.fiscalYear || '2024'} · ${financeData?.invoices?.length || 0} invoices`}
      actions={
        <>
          <Button 
            onClick={openAddInvoice}
            className="gradient-brand text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Invoice
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchFinanceData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          label="Revenue YTD" 
          value={`PKR ${(financeData?.revenueYTD || 0).toLocaleString()}`} 
          icon={TrendingUp} 
          tone="success" 
          trend={15.2} 
        />
        <KpiCard 
          label="Expenses" 
          value={`PKR ${(financeData?.expenses || 0).toLocaleString()}`} 
          icon={TrendingDown} 
          tone="destructive" 
          trend={4.7} 
        />
        <KpiCard 
          label="Net Income" 
          value={`PKR ${(financeData?.netIncome || 0).toLocaleString()}`} 
          icon={PiggyBank} 
          tone="brand" 
        />
        <KpiCard 
          label="Invoices Sent" 
          value={financeData?.totalInvoices || 0} 
          icon={Receipt} 
          tone="info" 
        />
      </div>

      {/* Chart */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Income vs expenses</CardTitle>
              <CardDescription>PKR millions, last 12 months</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info('Export feature coming soon')}>
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pl-0">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={financeData?.monthlyData || []}>
              <defs>
                <linearGradient id="fr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                formatter={(value: number) => [`PKR ${value.toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--success)" fill="url(#fr)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="var(--destructive)" fill="url(#fe)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Budget Allocation */}
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Budget allocation</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsBudgetModalOpen(true)}>
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(financeData?.budgetAllocation || []).map((b) => (
              <div key={b.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.name}</span>
                  <span className="tabular-nums font-medium">PKR {b.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full gradient-brand" style={{ width: `${b.percentage}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent invoices</CardTitle>
              <Button variant="outline" size="sm" onClick={openAddInvoice}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(financeData?.invoices || []).slice(0, 5).map((i) => (
              <div key={i.invoiceId} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 group hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{i.vendor}</span>
                    <Badge variant={i.status === 'Paid' ? 'default' : 'outline'} className="text-[10px]">
                      {i.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{i.invoiceId}</div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <div className="text-sm font-semibold tabular-nums">PKR {i.amount.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'No due date'}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => openEditInvoice(i)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteInvoice(i.invoiceId, i.vendor)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(financeData?.invoices?.length || 0) === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No invoices yet</p>
                <Button variant="link" size="sm" onClick={openAddInvoice} className="mt-2">
                  Add your first invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Invoice Modal */}
      {isInvoiceModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeInvoiceModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingInvoice ? 'Edit Invoice' : 'Add New Invoice'}
              </h2>
              <Button variant="ghost" size="sm" onClick={closeInvoiceModal} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Input
                  id="vendor"
                  name="vendor"
                  value={invoiceForm.vendor}
                  onChange={handleInvoiceInput}
                  placeholder="Enter vendor name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PKR) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={invoiceForm.amount}
                  onChange={handleInvoiceInput}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  value={invoiceForm.category}
                  onChange={handleInvoiceInput}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Salaries">Salaries</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Research">Research</option>
                  <option value="Scholarships">Scholarships</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={invoiceForm.status}
                  onChange={handleInvoiceInput}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={handleInvoiceInput}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={invoiceForm.description}
                  onChange={handleInvoiceInput}
                  placeholder="Invoice description..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeInvoiceModal}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-brand text-white border-0" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingInvoice ? 'Update' : 'Add'} Invoice
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {isBudgetModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBudgetModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Budget Allocation</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsBudgetModalOpen(false)} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {budgetAllocations.map((allocation, index) => (
                <div key={allocation.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{allocation.name}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={allocation.percentage}
                        onChange={(e) => handleBudgetChange(index, 'percentage', e.target.value)}
                        className="w-20 text-sm"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Input
                    type="number"
                    value={allocation.amount}
                    onChange={(e) => handleBudgetChange(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="text-sm"
                    placeholder="Amount"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsBudgetModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" className="gradient-brand text-white border-0" onClick={handleBudgetSave} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}