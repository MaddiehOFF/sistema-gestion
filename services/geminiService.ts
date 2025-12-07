import {
  Employee,
  InventoryItem,
  InventorySession,
  OvertimeRecord,
  SanctionRecord,
  WalletTransaction,
  FixedExpense,
  BudgetAnalysis
} from "../types";

// ⛔️ IMPORTANTE: IA DESACTIVADA POR AHORA
// No usamos GoogleGenAI ni ninguna API Key aquí.

// --- ANÁLISIS DE HORAS EXTRAS ---
export const generateOvertimeAnalysis = async (
  employees: Employee[],
  records: OvertimeRecord[],
  sanctions?: SanctionRecord[]
): Promise<string> => {
  return `
⚠️ La función de análisis automático con IA está desactivada en esta versión.

Puedes seguir usando el sistema normalmente. 
Las horas extras, sanciones y datos de empleados siguen registrándose, 
pero el informe inteligente todavía no está disponible en producción.
`.trim();
};

// --- EMAIL DE INVENTARIO ---
export const generateInventoryEmail = async (
  session: InventorySession,
  items: InventoryItem[]
): Promise<string> => {
  return `
⚠️ El email automático de inventario generado por IA está desactivado.

Revisa el cierre de inventario manualmente. 
Fecha del turno: ${session.date}, Apertura: ${session.openedBy}, Cierre: ${session.closedBy}.
`.trim();
};

// --- REPORTE FINANCIERO ---
export const generateFinancialReport = async (
  transactions: WalletTransaction[],
  totalBalance: number,
  pendingDebt: number
): Promise<string> => {
  return `
⚠️ El reporte financiero con IA está desactivado en esta versión.

Saldo actual: $${totalBalance.toFixed(2)}
Deuda pendiente: $${pendingDebt.toFixed(2)}

Puedes seguir revisando los movimientos desde el panel normalmente.
`.trim();
};

// --- ANÁLISIS DE PRESUPUESTO ---
export const generateBudgetAnalysis = async (
  totalBalance: number,
  fixedExpenses: FixedExpense[],
  employees: Employee[],
  transactions: WalletTransaction[] = []
): Promise<BudgetAnalysis | null> => {
  // Sin IA, devolvemos null y la UI debería manejarlo.
  return null;
};
