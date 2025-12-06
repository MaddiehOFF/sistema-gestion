
export type PaymentModality = 'MENSUAL' | 'QUINCENAL' | 'SEMANAL' | 'DIARIO';
export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA';

export type EmployeeRole = 'EMPRESA' | 'GERENTE' | 'COORDINADOR' | 'JEFE_COCINA' | 'ADMINISTRATIVO' | 'MOSTRADOR' | 'COCINA' | 'REPARTIDOR' | string;

// Database Configuration
export interface DatabaseConfig {
    url: string;
    key: string;
    isConfigured: boolean;
}

export interface Employee {
  id: string;
  name: string;
  position: string; // Keeps the string representation
  role?: EmployeeRole; // Strictly typed role for gamification
  monthlySalary: number; // Salary in ARS
  scheduleStart: string; // Format "HH:mm" e.g., "17:00"
  scheduleEnd: string;   // Format "HH:mm" e.g., "01:00"
  photoUrl?: string;     // Base64 string or URL
  active: boolean;
  password?: string;     // Member access password
  
  // Personal Data
  dni?: string;
  cuil?: string;
  address?: string;
  phone?: string;
  birthDate?: string;

  // Contract Data
  startDate?: string;
  interviewer?: string;
  paymentModality?: PaymentModality;
  
  // Payment Scheduling (New)
  nextPaymentDate?: string; // ISO Date
  nextPaymentMethod?: PaymentMethod;
  lastPaymentDate?: string; // ISO Date of last salary payment

  // Banking Data
  cbu?: string;
  alias?: string;
  bankName?: string;
  bankAccountHolder?: string; 
  bankAccountNumber?: string; 
  bankAccountType?: 'CAJA_AHORRO' | 'CUENTA_CORRIENTE';

  // Schedule Data
  assignedDays?: string[]; // Array of days e.g. ["Lun", "Mié", "Vie"]
}

export interface Task {
  id: string;
  employeeId: string;
  description: string;
  details?: string; // Detailed description
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED'; // Updated status
  completedAt?: string; // Time string "HH:mm"
  completedBy?: string; // Name of person who did it
  assignedBy: string; // Admin username
  date: string; // ISO Date for daily tracking
}

export interface ChecklistSnapshot {
    id: string;
    date: string; // ISO Date
    finalizedAt: string; // HH:mm
    finalizedBy: string; // Name
    employeeId: string;
    tasks: Task[];
}

export interface AdminTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Admin User ID
  createdBy: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedTime: string; // e.g., "2 horas"
  dueDate?: string;
  
  // Verification System
  completedBy?: string; // User ID who marked as done
  verifiedBy?: string;  // User ID who verified
  verifiedAt?: string;
}

export interface ForumPost {
  id: string;
  author: string;
  authorRole: string;
  date: string; // ISO String
  content: string;
  imageUrl?: string;
  likes: string[]; // Array of User IDs or Employee IDs who liked it
}

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string; // Actual arrival "HH:mm"
  checkOut: string; // Actual departure "HH:mm"
  overtimeHours: number; // Calculated hours
  overtimeAmount: number; // Calculated money in ARS
  reason: string;
  paid: boolean; // New field
  isHoliday?: boolean; // If paid double
}

export interface AbsenceRecord {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
}

export type SanctionType = 'APERCIBIMIENTO' | 'SUSPENSION' | 'DESCUENTO' | 'STRIKE' | 'OTRO';

export interface SanctionRecord {
  id: string;
  employeeId: string;
  date: string;
  type: SanctionType;
  description: string;
  amount?: number; // If it involves a fine/discount
  createdBy?: string; // Name of admin who applied it
  
  // Soft Delete Fields
  deletedAt?: string; // ISO Date
  deletedBy?: string; // Name of user who deleted it
}

export type UserRole = 'ADMIN' | 'MANAGER';

// Granular Permissions System
export interface UserPermissions {
  // HR Module
  viewHr: boolean; // See list, files
  manageHr: boolean; // Create, edit, archive employees

  // Operations Module
  viewOps: boolean; // See overtime, sanctions
  manageOps: boolean; // Create/edit overtime, apply sanctions

  // Finance Module
  viewFinance: boolean; // See Dashboard costs, Wallet balance
  manageFinance: boolean; // Create transactions, Pay payroll, Manage Wallet

  // Inventory & Stock
  viewInventory: boolean;
  manageInventory: boolean; // Open/Close shifts

  // System
  superAdmin: boolean; // Manage Users, Global Settings
}

export interface User {
  id: string;
  username: string;
  email: string; // New field
  password: string; // In a real app, this should be hashed
  role: UserRole; // Kept for legacy/label purposes
  permissions: UserPermissions; // Granular control
  name: string;
  lastLogin?: string; // New field ISO Date
}

// INVENTORY TYPES
export interface InventoryItem {
    id: string;
    name: string;
    unit: string; // kg, un, paq
}

export interface InventorySession {
    id: string;
    date: string; // ISO Date
    status: 'OPEN' | 'CLOSED';
    openedBy: string; // Name
    startTime?: string; // HH:mm
    closedBy?: string; // Name
    endTime?: string; // HH:mm
    data: {
        itemId: string;
        initial: number;
        final?: number;
        consumption?: number;
    }[];
}

// CASH REGISTER TYPES
export type CashCategory = 'VENTA' | 'INSUMOS' | 'PERSONAL' | 'GASTOS_VARIOS' | 'RETIRO' | 'OTROS';

export interface CashTransaction {
    id: string;
    type: 'INCOME' | 'EXPENSE'; 
    method: 'CASH' | 'TRANSFER'; 
    category: CashCategory; // New field
    amount: number;
    description: string;
    time: string; // HH:mm
    createdBy: string;
}

export interface CashShift {
    id: string;
    date: string; // ISO Date
    status: 'OPEN' | 'CLOSED';
    
    // Opening
    openedBy: string;
    openTime: string;
    initialAmount: number;

    // Closing
    closedBy?: string;
    closeTime?: string;
    finalCash?: number; // Physical cash count
    finalTransfer?: number; // Total transfer income declared
    
    // New Order Stats
    ordersFudo?: number;
    ordersPedidosYa?: number;
    
    transactions: CashTransaction[];
}

// PRODUCT & FINANCE TYPES
export interface Product {
    id: string;
    name: string;
    laborCost: number; // Mano de obra
    materialCost: number; // Materia prima
    royalties: number; // Regalías
    profit: number; // Ganancia
}

export interface CalculatorProjection {
    id: string;
    date: string;
    totalSales: number; // Theoretical
    realSales?: number; // Actual input
    netProfit: number;
    royalties: number;
    itemsSnapshot: { name: string; qty: number }[];
    createdBy: string;
}

export type FixedExpenseCategory = 'INFRAESTRUCTURA' | 'MATERIA_PRIMA' | 'SUELDOS' | 'OTROS';

export interface FixedExpense {
    id: string;
    name: string;
    amount: number;
    paidAmount: number; // Track partial payments
    dueDate: string; // ISO Date String (YYYY-MM-DD)
    isPaid: boolean;
    lastPaidDate?: string;
    category?: FixedExpenseCategory; // New categorization
    
    // Payment Details
    paymentMethod?: PaymentMethod;
    cbu?: string;
    alias?: string;
    bank?: string;
}

// WALLET & ROYALTIES
export interface WalletTransaction {
    id: string;
    date: string; // ISO Date
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    description: string;
    createdBy: string;
    time: string; // HH:mm
    method?: PaymentMethod; // Added method for tracking
    imageUrl?: string; // New field for receipt image
    
    // Soft Delete
    deletedAt?: string;
    deletedBy?: string;
}

export interface Partner {
    id: string;
    name: string;
    sharePercentage: number; // e.g. 25 for 25%
    balance?: number; // Individual accumulated balance
    cbu?: string;
    alias?: string;
    bank?: string;
}

export interface RoyaltyPayment {
    id: string;
    date: string;
    partnerId: string;
    amount: number;
    status: 'PAID' | 'PENDING';
}

// AI BUDGET TYPES
export interface BudgetCategory {
    name: string;
    percentage: number;
    amount: number;
    color: string; // Hex code
    description: string;
}

export interface BudgetAnalysis {
    healthScore: number; // 0-100
    healthStatus: 'CRITICAL' | 'WARNING' | 'HEALTHY';
    realAvailableMoney: number; // Balance - Obligations
    obligations: number;
    allocations: BudgetCategory[];
    actionableTips: string[];
}

// CONFIGURATION TYPES
export interface RoleAccessConfig {
    [role: string]: View[];
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  
  // Operations Group
  EMPLOYEES = 'EMPLOYEES',
  OVERTIME = 'OVERTIME',
  SANCTIONS = 'SANCTIONS', 
  FILES = 'FILES',
  CASH_REGISTER = 'CASH_REGISTER', 
  
  // Admin Group
  ADMIN_HUB = 'ADMIN_HUB', 
  PAYROLL = 'PAYROLL',
  USERS = 'USERS',         
  PRODUCTS = 'PRODUCTS', 
  SETTINGS = 'SETTINGS', // New Settings View
  
  // Finance Group (New)
  FINANCE = 'FINANCE', // Calculator
  WALLET = 'WALLET', // New
  ROYALTIES = 'ROYALTIES', // New
  STATISTICS = 'STATISTICS', // New

  // Strategy Group
  AI_REPORT = 'AI_REPORT',
  FORUM = 'FORUM',

  // Under Construction Group
  INVENTORY = 'INVENTORY',
  AI_FOCUS = 'AI_FOCUS',
  
  // Member Specific Views
  MEMBER_HOME = 'MEMBER_HOME',
  MEMBER_CALENDAR = 'MEMBER_CALENDAR',
  MEMBER_TASKS = 'MEMBER_TASKS',
  MEMBER_FILE = 'MEMBER_FILE',
  MEMBER_FORUM = 'MEMBER_FORUM'
}

export interface AIAnalysisState {
  loading: boolean;
  result: string | null;
  error: string | null;
}