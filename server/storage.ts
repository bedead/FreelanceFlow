import { 
  clients, 
  invoices, 
  lineItems, 
  expenses,
  type Client, 
  type InsertClient,
  type Invoice,
  type InsertInvoice,
  type LineItem,
  type InsertLineItem,
  type Expense,
  type InsertExpense,
  type InvoiceWithClient
} from "@shared/schema";

export interface IStorage {
  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Invoice operations
  getInvoices(): Promise<InvoiceWithClient[]>;
  getInvoice(id: number): Promise<InvoiceWithClient | undefined>;
  createInvoice(invoice: InsertInvoice, lineItems: InsertLineItem[]): Promise<InvoiceWithClient>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;

  // Line item operations
  getLineItemsByInvoice(invoiceId: number): Promise<LineItem[]>;
  updateLineItems(invoiceId: number, lineItems: InsertLineItem[]): Promise<LineItem[]>;

  // Expense operations
  getExpenses(): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalRevenue: number;
    outstanding: number;
    totalClients: number;
    thisMonth: number;
    revenueGrowth: number;
    outstandingCount: number;
    activeClients: number;
    monthlyInvoices: number;
  }>;
}

export class MemStorage implements IStorage {
  private clients: Map<number, Client>;
  private invoices: Map<number, Invoice>;
  private lineItems: Map<number, LineItem>;
  private expenses: Map<number, Expense>;
  private currentClientId: number;
  private currentInvoiceId: number;
  private currentLineItemId: number;
  private currentExpenseId: number;

  constructor() {
    this.clients = new Map();
    this.invoices = new Map();
    this.lineItems = new Map();
    this.expenses = new Map();
    this.currentClientId = 1;
    this.currentInvoiceId = 1;
    this.currentLineItemId = 1;
    this.currentExpenseId = 1;
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = { ...insertClient, id };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, clientUpdate: Partial<InsertClient>): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...clientUpdate };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  async getInvoices(): Promise<InvoiceWithClient[]> {
    const invoiceList = Array.from(this.invoices.values());
    const result: InvoiceWithClient[] = [];

    for (const invoice of invoiceList) {
      const client = this.clients.get(invoice.clientId);
      const invoiceLineItems = Array.from(this.lineItems.values())
        .filter(item => item.invoiceId === invoice.id);
      
      if (client) {
        result.push({
          ...invoice,
          client,
          lineItems: invoiceLineItems
        });
      }
    }

    return result;
  }

  async getInvoice(id: number): Promise<InvoiceWithClient | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    const client = this.clients.get(invoice.clientId);
    if (!client) return undefined;

    const invoiceLineItems = Array.from(this.lineItems.values())
      .filter(item => item.invoiceId === invoice.id);

    return {
      ...invoice,
      client,
      lineItems: invoiceLineItems
    };
  }

  async createInvoice(insertInvoice: InsertInvoice, insertLineItems: InsertLineItem[]): Promise<InvoiceWithClient> {
    const id = this.currentInvoiceId++;
    const invoice: Invoice = { ...insertInvoice, id };
    this.invoices.set(id, invoice);

    const createdLineItems: LineItem[] = [];
    for (const insertLineItem of insertLineItems) {
      const lineItemId = this.currentLineItemId++;
      const lineItem: LineItem = { ...insertLineItem, id: lineItemId, invoiceId: id };
      this.lineItems.set(lineItemId, lineItem);
      createdLineItems.push(lineItem);
    }

    const client = this.clients.get(invoice.clientId)!;
    return {
      ...invoice,
      client,
      lineItems: createdLineItems
    };
  }

  async updateInvoice(id: number, invoiceUpdate: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existing = this.invoices.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...invoiceUpdate };
    this.invoices.set(id, updated);
    return updated;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    // Also delete associated line items
    const lineItemsToDelete = Array.from(this.lineItems.entries())
      .filter(([_, item]) => item.invoiceId === id)
      .map(([itemId]) => itemId);
    
    lineItemsToDelete.forEach(itemId => this.lineItems.delete(itemId));
    
    return this.invoices.delete(id);
  }

  async getLineItemsByInvoice(invoiceId: number): Promise<LineItem[]> {
    return Array.from(this.lineItems.values())
      .filter(item => item.invoiceId === invoiceId);
  }

  async updateLineItems(invoiceId: number, insertLineItems: InsertLineItem[]): Promise<LineItem[]> {
    // Delete existing line items for this invoice
    const existingIds = Array.from(this.lineItems.entries())
      .filter(([_, item]) => item.invoiceId === invoiceId)
      .map(([id]) => id);
    
    existingIds.forEach(id => this.lineItems.delete(id));

    // Create new line items
    const createdLineItems: LineItem[] = [];
    for (const insertLineItem of insertLineItems) {
      const id = this.currentLineItemId++;
      const lineItem: LineItem = { ...insertLineItem, id, invoiceId };
      this.lineItems.set(id, lineItem);
      createdLineItems.push(lineItem);
    }

    return createdLineItems;
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const expense: Expense = { ...insertExpense, id };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, expenseUpdate: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...expenseUpdate };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  async getDashboardStats() {
    const allInvoices = Array.from(this.invoices.values());
    const allExpenses = Array.from(this.expenses.values());
    
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
    const outstandingInvoices = allInvoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue');
    
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    const outstanding = outstandingInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthInvoices = allInvoices.filter(inv => {
      const invDate = new Date(inv.issueDate);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    });
    
    const thisMonth = thisMonthInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    
    return {
      totalRevenue,
      outstanding,
      totalClients: this.clients.size,
      thisMonth,
      revenueGrowth: 12.5, // Mock growth percentage
      outstandingCount: outstandingInvoices.length,
      activeClients: Math.floor(this.clients.size * 0.6), // Mock active clients
      monthlyInvoices: thisMonthInvoices.length,
    };
  }
}

export const storage = new MemStorage();
