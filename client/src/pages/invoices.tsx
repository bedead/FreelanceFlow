import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import InvoiceForm from "@/components/invoices/invoice-form";
import InvoiceList from "@/components/invoices/invoice-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceWithClient } from "@shared/schema";

export default function Invoices() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithClient | null>(null);
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery<InvoiceWithClient[]>({
    queryKey: ["/api/invoices"],
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to send invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      });
    },
  });

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setIsCreateModalOpen(true);
  };

  const handleEditInvoice = (invoice: InvoiceWithClient) => {
    setEditingInvoice(invoice);
    setIsCreateModalOpen(true);
  };

  const handleSendInvoice = (invoiceId: number) => {
    sendInvoiceMutation.mutate(invoiceId);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingInvoice(null);
  };

  return (
    <>
      <Header 
        title="Invoices" 
        subtitle="Manage your invoices and track payments"
        onCreateInvoice={handleCreateInvoice}
      />

      <main className="p-6">
        <InvoiceList 
          invoices={invoices || []}
          isLoading={isLoading}
          onEditInvoice={handleEditInvoice}
          onSendInvoice={handleSendInvoice}
        />
      </main>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
            </DialogTitle>
          </DialogHeader>
          <InvoiceForm 
            invoice={editingInvoice}
            onSuccess={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
