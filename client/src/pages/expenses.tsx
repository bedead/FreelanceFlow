import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import ExpenseForm from "@/components/expenses/expense-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@shared/schema";

export default function Expenses() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const handleCreateExpense = () => {
    setEditingExpense(null);
    setIsCreateModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingExpense(null);
  };

  const totalExpenses = expenses?.reduce((sum, expense) => 
    sum + parseFloat(expense.amount || '0'), 0
  ) || 0;

  const getCategoryColor = (category: string) => {
    const colors = {
      'office': 'bg-blue-100 text-blue-800',
      'travel': 'bg-green-100 text-green-800',
      'equipment': 'bg-purple-100 text-purple-800',
      'software': 'bg-orange-100 text-orange-800',
      'marketing': 'bg-pink-100 text-pink-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Header 
        title="Expenses" 
        subtitle="Track and manage your business expenses"
      />

      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">All Expenses</h3>
            <p className="text-sm text-gray-600">
              Total: {formatCurrency(totalExpenses)} • {expenses?.length || 0} expenses
            </p>
          </div>
          <Button onClick={handleCreateExpense}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading expenses...</div>
            ) : expenses && expenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {formatDate(expense.date.toString())}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        {expense.receipt && (
                          <p className="text-sm text-gray-500">Has receipt</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(expense.category)}>
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(parseFloat(expense.amount || '0'))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditExpense(expense)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No expenses yet</p>
                <Button onClick={handleCreateExpense}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Expense
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm 
            expense={editingExpense}
            onSuccess={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
