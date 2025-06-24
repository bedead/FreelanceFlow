import { 
  users,
  clients, 
  invoices, 
  lineItems, 
  expenses,
  type User,
  type UpsertUser,
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
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Client operations
  getClients(userId: string): Promise<Client[]>;
  getClient(id: number, userId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>, userId: string): Promise<Client | undefined>;
  deleteClient(id: number, userId: string): Promise<boolean>;

  // Invoice operations
  getInvoices(userId: string): Promise<InvoiceWithClient[]>;
  getInvoice(id: number, userId: string): Promise<InvoiceWithClient | undefined>;
  createInvoice(invoice: InsertInvoice, lineItems: InsertLineItem[]): Promise<InvoiceWithClient>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, userId: string): Promise<Invoice | undefined>;
  deleteInvoice(id: number, userId: string): Promise<boolean>;

  // Line item operations
  getLineItemsByInvoice(invoiceId: number): Promise<LineItem[]>;
  updateLineItems(invoiceId: number, lineItems: InsertLineItem[]): Promise<LineItem[]>;

  // Expense operations
  getExpenses(userId: string): Promise<Expense[]>;
  getExpense(id: number, userId: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>, userId: string): Promise<Expense | undefined>;
  deleteExpense(id: number, userId: string): Promise<boolean>;

  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
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

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Client operations
  async getClients(userId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.userId, userId));
  }

  async getClient(id: number, userId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: number, clientUpdate: Partial<InsertClient>, userId: string): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(clientUpdate)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return client;
  }

  async deleteClient(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return result.rowCount > 0;
  }

  // Invoice operations
  async getInvoices(userId: string): Promise<InvoiceWithClient[]> {
    const invoiceResults = await db
      .select()
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, userId));

    const result: InvoiceWithClient[] = [];
    for (const row of invoiceResults) {
      if (row.clients) {
        const invoiceLineItems = await db
          .select()
          .from(lineItems)
          .where(eq(lineItems.invoiceId, row.invoices.id));

        result.push({
          ...row.invoices,
          client: row.clients,
          lineItems: invoiceLineItems
        });
      }
    }
    return result;
  }

  async getInvoice(id: number, userId: string): Promise<InvoiceWithClient | undefined> {
    const [invoiceResult] = await db
      .select()
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));

    if (!invoiceResult || !invoiceResult.clients) return undefined;

    const invoiceLineItems = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.invoiceId, id));

    return {
      ...invoiceResult.invoices,
      client: invoiceResult.clients,
      lineItems: invoiceLineItems
    };
  }

  async createInvoice(insertInvoice: InsertInvoice, insertLineItems: InsertLineItem[]): Promise<InvoiceWithClient> {
    const [invoice] = await db.insert(invoices).values(insertInvoice).returning();

    const createdLineItems: LineItem[] = [];
    for (const insertLineItem of insertLineItems) {
      const [lineItem] = await db
        .insert(lineItems)
        .values({ ...insertLineItem, invoiceId: invoice.id })
        .returning();
      createdLineItems.push(lineItem);
    }

    const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId));
    
    return {
      ...invoice,
      client: client!,
      lineItems: createdLineItems
    };
  }

  async updateInvoice(id: number, invoiceUpdate: Partial<InsertInvoice>, userId: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set(invoiceUpdate)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: number, userId: string): Promise<boolean> {
    // Delete associated line items first
    await db.delete(lineItems).where(eq(lineItems.invoiceId, id));
    
    // Delete the invoice
    const result = await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    return result.rowCount > 0;
  }

  // Line item operations
  async getLineItemsByInvoice(invoiceId: number): Promise<LineItem[]> {
    return await db.select().from(lineItems).where(eq(lineItems.invoiceId, invoiceId));
  }

  async updateLineItems(invoiceId: number, insertLineItems: InsertLineItem[]): Promise<LineItem[]> {
    // Delete existing line items for this invoice
    await db.delete(lineItems).where(eq(lineItems.invoiceId, invoiceId));

    // Create new line items
    const createdLineItems: LineItem[] = [];
    for (const insertLineItem of insertLineItems) {
      const [lineItem] = await db
        .insert(lineItems)
        .values({ ...insertLineItem, invoiceId })
        .returning();
      createdLineItems.push(lineItem);
    }

    return createdLineItems;
  }

  // Expense operations
  async getExpenses(userId: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async getExpense(id: number, userId: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return expense;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(insertExpense).returning();
    return expense;
  }

  async updateExpense(id: number, expenseUpdate: Partial<InsertExpense>, userId: string): Promise<Expense | undefined> {
    const [expense] = await db
      .update(expenses)
      .set(expenseUpdate)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return expense;
  }

  async deleteExpense(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return result.rowCount > 0;
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    totalRevenue: number;
    outstanding: number;
    totalClients: number;
    thisMonth: number;
    revenueGrowth: number;
    outstandingCount: number;
    activeClients: number;
    monthlyInvoices: number;
  }> {
    const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));
    const allClients = await db.select().from(clients).where(eq(clients.userId, userId));
    
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
      totalClients: allClients.length,
      thisMonth,
      revenueGrowth: 12.5, // Mock growth percentage
      outstandingCount: outstandingInvoices.length,
      activeClients: Math.floor(allClients.length * 0.6), // Mock active clients
      monthlyInvoices: thisMonthInvoices.length,
    };
  }
}

export const storage = new DatabaseStorage();
