import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Send, FileText, Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import type { InvoiceWithClient } from "@shared/schema";

interface InvoiceListProps {
  invoices: InvoiceWithClient[];
  isLoading: boolean;
  onEditInvoice: (invoice: InvoiceWithClient) => void;
  onSendInvoice: (invoiceId: number) => void;
}

export default function InvoiceList({ 
  invoices, 
  isLoading, 
  onEditInvoice, 
  onSendInvoice 
}: InvoiceListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadPDF = (invoice: InvoiceWithClient) => {
    generateInvoicePDF(invoice);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Loading invoices...
        </CardContent>
      </Card>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No invoices yet</p>
          <p className="text-sm text-gray-400">
            Create your first invoice to get started with billing your clients.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{invoice.number}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(invoice.issueDate.toString())}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{invoice.client.name}</p>
                    {invoice.client.company && (
                      <p className="text-sm text-gray-500">{invoice.client.company}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(invoice.total || '0'))}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={
                    new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' 
                      ? 'text-red-600 font-medium' 
                      : 'text-gray-900'
                  }>
                    {formatDate(invoice.dueDate.toString())}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditInvoice(invoice)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPDF(invoice)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {invoice.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSendInvoice(invoice.id)}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
