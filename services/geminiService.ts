import { GoogleGenAI } from "@google/genai";
import { Employee, InventoryItem, InventorySession, OvertimeRecord, SanctionRecord, WalletTransaction, FixedExpense, BudgetAnalysis } from "../types";

// --- FUNCIÓN SEGURA PARA INICIAR LA IA ---
// Solo se ejecuta cuando se llama, no al abrir la web.
const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  // Si no hay llave, devolvemos null para no romper la app
  if (!apiKey || apiKey.includes("DUMMY")) {
    console.warn("Google API Key no configurada.");
    return null; 
  }
  return new GoogleGenAI({ apiKey });
};

// --- ANÁLISIS DE HORAS EXTRAS ---
export const generateOvertimeAnalysis = async (
  employees: Employee[], 
  records: OvertimeRecord[],
  sanctions?: SanctionRecord[]
): Promise<string> => {
  
  const ai = getAIClient();
  if (!ai) return "⚠️ La Inteligencia Artificial no está activa. Configura la API Key en Vercel.";

  if (records.length === 0 && (!sanctions || sanctions.length === 0)) {
    return "No hay suficientes datos para generar un análisis.";
  }

  const employeeSummary = employees.map(e => ({
    name: e.name,
    position: e.position,
    schedule: `${e.scheduleStart}-${e.scheduleEnd}`,
    monthlySalaryARS: e.monthlySalary
  }));

  const recordSummary = records.map(r => ({
    employeeName: employees.find(e => e.id === r.employeeId)?.name || 'Unknown',
    date: r.date,
    overtimeHours: r.overtimeHours,
    costARS: r.overtimeAmount,
    paid: r.paid,
    reason: r.reason
  }));

  const sanctionSummary = sanctions?.map(s => ({
    employeeName: employees.find(e => e.id === s.employeeId)?.name || 'Unknown',
    date: s.date,
    type: s.type,
    description: s.description,
    amount: s.amount
  })) || [];

  const prompt = `
    Actúa como un Gerente de Operaciones Senior. Analiza:
    PERFIL: ${JSON.stringify(employeeSummary)}
    HORAS EXTRAS: ${JSON.stringify(recordSummary)}
    SANCIONES: ${JSON.stringify(sanctionSummary)}
    
    Genera un informe estratégico en Markdown sobre: 
    1. Impacto financiero. 2. Desempeño y Disciplina. 3. Cumplimiento. 4. Recomendaciones.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error AI:", error);
    return "Error al conectar con la IA.";
  }
};

// --- EMAIL DE INVENTARIO ---
export const generateInventoryEmail = async (
    session: InventorySession,
    items: InventoryItem[]
): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "⚠️ IA no disponible.";

    const consumptionData = session.data.map(d => {
        const item = items.find(i => i.id === d.itemId);
        return {
            item: item?.name || 'Unknown',
            unit: item?.unit || '',
            initial: d.initial,
            final: d.final,
            consumption: d.consumption
        }
    });

    const prompt = `
        Actúa como Jefe de Cocina. Escribe un email de reporte de inventario.
        Turno: ${session.date}. Apertura: ${session.openedBy}. Cierre: ${session.closedBy}.
        Consumos: ${JSON.stringify(consumptionData)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "No se pudo generar el email.";
    } catch (error) {
        return "Error al generar informe.";
    }
};

// --- REPORTE FINANCIERO ---
export const generateFinancialReport = async (
    transactions: WalletTransaction[],
    totalBalance: number,
    pendingDebt: number
): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "⚠️ IA no disponible.";

    const recent = transactions.slice(0, 5).map(t => `${t.type === 'INCOME' ? '+' : '-'}${t.amount} (${t.category})`);

    const prompt = `
        Actúa como Asesor Financiero. Reporte breve.
        Balance: $${totalBalance}, Deuda: $${pendingDebt}.
        Recientes: ${recent.join(', ')}.
        Consejo sobre liquidez.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Error al analizar finanzas.";
    } catch (error) {
        return "Servicio IA no disponible.";
    }
};

// --- ANÁLISIS DE PRESUPUESTO ---
export const generateBudgetAnalysis = async (
    totalBalance: number,
    fixedExpenses: FixedExpense[],
    employees: Employee[],
    transactions: WalletTransaction[] = []
): Promise<BudgetAnalysis | null> => {
    const ai = getAIClient();
    if (!ai) return null;

    const payroll = employees.filter(e => e.active).reduce((acc, e) => acc + e.monthlySalary, 0);
    const pendingFixed = fixedExpenses
        .filter(e => !e.isPaid)
        .reduce((acc, e) => acc + (e.amount - (e.paidAmount || 0)), 0);

    const history = transactions.slice(0, 20).map(t => ({
        date: t.date, type: t.type, amount: t.amount, category: t.category
    }));

    const prompt = `
        Actúa como CFO. Analiza finanzas y devuelve SOLO JSON.
        Saldo: ${totalBalance}, Nómina: ${payroll}, Gastos: ${pendingFixed}.
        Historial: ${JSON.stringify(history)}.
        JSON esperado: { healthScore, healthStatus, realAvailableMoney, allocations, actionableTips }.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const jsonText = response.text;
        if (!jsonText) return null;
        return JSON.parse(jsonText) as BudgetAnalysis;
    } catch (error) {
        console.error(error);
        return null;
    }
};
