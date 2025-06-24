import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import ClientForm from "@/components/clients/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Mail, Phone, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Client } from "@shared/schema";

export default function Clients() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const handleCreateClient = () => {
    setEditingClient(null);
    setIsCreateModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingClient(null);
  };

  return (
    <>
      <Header 
        title="Clients" 
        subtitle="Manage your client database and billing information"
      />

      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">All Clients</h3>
            <p className="text-sm text-gray-600">
              {clients?.length || 0} clients total
            </p>
          </div>
          <Button onClick={handleCreateClient}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading clients...</div>
            ) : clients && clients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Billing Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          {client.address && (
                            <p className="text-sm text-gray-500">{client.address}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.company ? (
                          <Badge variant="secondary">{client.company}</Badge>
                        ) : (
                          <span className="text-gray-400">No company</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-3 h-3 mr-1" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-3 h-3 mr-1" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.billingRate ? (
                          <span className="font-medium">
                            {formatCurrency(parseFloat(client.billingRate))}/hr
                          </span>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClient(client)}
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
                <p className="text-gray-500 mb-4">No clients yet</p>
                <Button onClick={handleCreateClient}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Client
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
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
          </DialogHeader>
          <ClientForm 
            client={editingClient}
            onSuccess={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
