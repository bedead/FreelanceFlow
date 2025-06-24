import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceWithClient, Client } from "@shared/schema";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.string().min(1, "Quantity is required"),
  rate: z.string().min(1, "Rate is required"),
});

const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  number: z.string().min(1, "Invoice number is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: InvoiceWithClient | null;
  onSuccess: () => void;
}

export default function InvoiceForm({ invoice, onSuccess }: InvoiceFormProps) {
  const { toast } = useToast();

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: invoice?.clientId?.toString() || "",
      number: invoice?.number || "",
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : "",
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
      notes: invoice?.notes || "",
      lineItems: invoice?.lineItems?.map(item => ({
        description: item.description,
        quantity: item.quantity || "",
        rate: item.rate || "",
      })) || [{ description: "", quantity: "", rate: "" }],
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const lineItems = data.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        total: (parseFloat(item.quantity) * parseFloat(item.rate)).toFixed(2),
      }));

      const subtotal = lineItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
      const tax = subtotal * 0.085; // 8.5% tax
      const total = subtotal + tax;

      const invoiceData = {
        clientId: parseInt(data.clientId),
        number: data.number,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        status: "draft",
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        notes: data.notes || null,
        emailSent: false,
      };

      return apiRequest("POST", "/api/invoices", {
        invoice: invoiceData,
        lineItems,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const lineItems = form.watch("lineItems");

  const addLineItem = () => {
    const currentItems = form.getValues("lineItems");
    form.setValue("lineItems", [...currentItems, { description: "", quantity: "", rate: "" }]);
  };

  const removeLineItem = (index: number) => {
    const currentItems = form.getValues("lineItems");
    if (currentItems.length > 1) {
      form.setValue("lineItems", currentItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = (quantity: string, rate: string) => {
    const qty = parseFloat(quantity) || 0;
    const rt = parseFloat(rate) || 0;
    return qty * rt;
  };

  const subtotal = lineItems.reduce((sum, item) => {
    return sum + calculateTotal(item.quantity, item.rate);
  }, 0);

  const tax = subtotal * 0.085;
  const total = subtotal + tax;

  const onSubmit = (data: InvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    form.setValue("number", `INV-${timestamp}`);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name} {client.company && `(${client.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="INV-001" {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={generateInvoiceNumber}>
                    Generate
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
            <Button type="button" variant="outline" onClick={addLineItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {lineItems.map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="number" placeholder="Qty" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.rate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="number" placeholder="Rate" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        readOnly
                        value={formatCurrency(calculateTotal(
                          form.watch(`lineItems.${index}.quantity`),
                          form.watch(`lineItems.${index}.rate`)
                        ))}
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Invoice Totals */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (8.5%):</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createInvoiceMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
