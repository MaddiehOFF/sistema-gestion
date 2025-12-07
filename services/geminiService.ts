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

// Todas estas funciones son LOCALES.
// No llaman a APIs externas ni usan claves de IA.

// --- ANÁLISIS DE HORAS EXTRAS (RESUMEN LOCAL) ---
export const generateOvertimeAnalysis = async (
  employees: Employee[],
  records: OvertimeRecord[],
  sanctions: SanctionRecord[] = []
): Promise<string> => {
  if (records.length === 0 && sanctions.length === 0) {
    return "No hay registros de horas extras ni sanciones para analizar.";
  }

  const empMap = new Map<string, Employee>();
  employees.forEach(e => empMap.set(e.id, e));

  let totalHours = 0;
  let totalCost = 0;

  records.forEach(r => {
    totalHours += r.overtimeHours;
    totalCost += r.overtimeAmount;
  });

  const formatoARS = (v: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(v);

  return [
    "Resumen básico de horas extras:",
    "",
    `- Empleados con registros cargados: ${employees.length}`,
    `- Registros de horas extras: ${records.length}`,
    `- Total de horas extras: ${totalHours.toFixed(2)} hs`,
    `- Costo total estimado: ${formatoARS(totalCost)}`,
    `- Sanciones registradas: ${sanctions.length}`,
    "",
    "Recomendación general:",
    "- Revisar los casos con muchas horas extras y validar si hace falta ajustar turnos o sumar personal."
  ].join("\n");
};

// --- EMAIL DE INVENTARIO (TEXTO LOCAL) ---
export const generateInventoryEmail = async (
  session: InventorySession,
  items: InventoryItem[]
): Promise<string> => {
  const dateStr = new Date(session.date).toLocaleString("es-AR");
  const lines: string[] = [];

  lines.push(`Reporte de Inventario - Turno del ${dateStr}`);
  lines.push("");
  lines.push(`Apertura: ${session.startTime || "-"} (por ${session.openedBy})`);
  lines.push(`Cierre:   ${session.endTime || "-"} (por ${session.closedBy || "-"})`);
  lines.push("");
  lines.push("Resumen por insumo:");

  session.data.forEach(d => {
    const item = items.find(i => i.id === d.itemId);
    if (!item) return;
    const initial = d.initial ?? 0;
    const final = d.final ?? 0;
    const cons = d.consumption ?? initial - final;
    lines.push(
      `- ${item.name}: Inicio ${initial} ${item.unit}, Fin ${final} ${item.unit}, Consumo ${cons} ${item.unit}`
    );
  });

  lines.push("");
  lines.push(
    "Observaciones: revisar consumos muy altos o negativos para detectar posibles errores de carga."
  );

  return lines.join("\n");
};

// --- REPORTE FINANCIERO (LOCAL) ---
export const generateFinancialReport = async (
  transactions: WalletTransaction[],
  totalBalance: number,
  pendingDebt: number
): Promise<string> => {
  const ingresos = transactions
    .filter(t => t.type === "INCOME" && !t.deletedAt)
    .reduce((acc, t) => acc + t.amount, 0);

  const egresos = transactions
    .filter(t => t.type === "EXPENSE" && !t.deletedAt)
    .reduce((acc, t) => acc + t.amount, 0);

  const formatoARS = (v: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(v);

  const lines: string[] = [];

  lines.push("Reporte financiero básico");
  lines.push("");
  lines.push(`- Ingresos registrados: ${formatoARS(ingresos)}`);
  lines.push(`- Egresos registrados:  ${formatoARS(egresos)}`);
  lines.push(`- Saldo actual:        ${formatoARS(totalBalance)}`);
  lines.push(`- Deuda pendiente:     ${formatoARS(pendingDebt)}`);
  lines.push("");
  lines.push("Comentarios generales:");
  if (ingresos >= egresos) {
    lines.push("- Los ingresos superan a los egresos: la caja está en terreno positivo.");
  } else {
    lines.push(
      "- Los egresos superan a los ingresos: revisar costos, precios y frecuencia de retiros."
    );
  }
  lines.push(
    "- Asegurarse de que el saldo disponible cubra sueldos, proveedores y gastos fijos antes de hacer compras grandes."
  );

  return lines.join("\n");
};

// --- ANÁLISIS DE PRESUPUESTO ---
// Por ahora no calculamos un BudgetAnalysis complejo.
// Devolvemos null para que la UI pueda ocultar o ignorar esa funcionalidad.
export const generateBudgetAnalysis = async (
  totalBalance: number,
  fixedExpenses: FixedExpense[],
  employees: Employee[],
  transactions: WalletTransaction[] = []
): Promise<BudgetAnalysis | null> => {
  return null;
};
