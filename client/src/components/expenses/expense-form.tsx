import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Expense } from "@shared/schema";

const expenseFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  date: z.preprocess(
    (val) => (typeof val === "string" || val instanceof Date ? new Date(val) : val),
    z.date({ required_error: "Date is required" })
  ),
  receipt: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

const expenseCategories = [
  { value: "office", label: "Office Supplies" },
  { value: "travel", label: "Travel" },
  { value: "equipment", label: "Equipment" },
  { value: "software", label: "Software" },
  { value: "marketing", label: "Marketing" },
  { value: "meals", label: "Meals & Entertainment" },
  { value: "utilities", label: "Utilities" },
  { value: "other", label: "Other" },
];

interface ExpenseFormProps {
  expense?: Expense | null;
  onSuccess: () => void;
}

export default function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const { toast } = useToast();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: expense?.description || "",
      amount: expense?.amount ? expense.amount.toString() : "",
      category: expense?.category || "",
      date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : "",
      receipt: expense?.receipt || "",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const expenseData = {
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: new Date(data.date),
        receipt: data.receipt || null,
      };

      if (expense) {
        return apiRequest("PUT", `/api/expenses/${expense.id}`, expenseData);
      } else {
        return apiRequest("POST", "/api/expenses", expenseData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Success",
        description: expense ? "Expense updated successfully" : "Expense created successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: expense ? "Failed to update expense" : "Failed to create expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea placeholder="Office supplies for Q1..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="150.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receipt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receipt URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/receipt.pdf" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createExpenseMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {createExpenseMutation.isPending 
              ? (expense ? "Updating..." : "Creating...") 
              : (expense ? "Update Expense" : "Create Expense")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
