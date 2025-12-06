import { GoogleGenAI } from "@google/genai";
import { Employee, InventoryItem, InventorySession, OvertimeRecord, SanctionRecord, WalletTransaction, FixedExpense, BudgetAnalysis } from "../types";

// Función auxiliar para obtener el cliente de IA de forma segura
// Solo se crea cuando se necesita, no al cargar la página
const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || "DUMMY_KEY";
  // Si no hay key real, devolvemos null para controlar el error amistosamente después
  if (!apiKey || apiKey === "DUMMY_KEY") {
    console.warn("Google API Key no configurada o es inválida.");
    return null; 
  }
  return new GoogleGenAI({ apiKey });
};

export const generateOvertimeAnalysis = async (
  employees: Employee[], 
  records: OvertimeRecord[],
  sanctions?: SanctionRecord[]
): Promise<string> => {
  
  const ai = getAIClient();
  if (!ai) return "⚠️ Error: Configura la API Key de Google (VITE_GOOGLE_API_KEY) en Vercel para usar la IA.";

  if (records.length === 0 && (!sanctions || sanctions.length === 0)) {
    return "No hay suficientes datos (horas extras o sanciones) para generar un análisis. Por favor registre actividad primero.";
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
    Actúa como un Gerente de Operaciones Senior y CFO para "Sushiblack", un restaurante exclusivo.
    Analiza los siguientes datos operativos:
    PERFIL DE EMPLEADOS: ${JSON.stringify(employeeSummary)}
    REGISTRO DE HORAS EXTRAS: ${JSON.stringify(recordSummary)}
    LIBRO DE NOVEDADES (SANCIONES/STRIKES): ${JSON.stringify(sanctionSummary)}
    
    Proporciona un informe estratégico en español (formato Markdown) que incluya:
    1. Análisis Financiero de Horas Extras.
    2. Desempeño y Disciplina.
    3. Cumplimiento de Horarios.
    4. Recomendaciones.
    Mantén un tono profesional, directo y elegante.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error generating analysis:", error);
    return "Hubo un error al conectar con el asistente de IA. Verifique la API Key.";
  }
};

export const generateInventoryEmail = async (
    session: InventorySession,
    items: InventoryItem[]
): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "⚠️ IA no disponible. Configure la API Key.";

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
        Actúa como el Jefe de Cocina de "Sushiblack". Escribe un informe de inventario.
        DATOS DEL TURNO: Fecha: ${session.date}, Apertura: ${session.openedBy}, Cierre: ${session.closedBy}.
        CONSUMOS: ${JSON.stringify(consumptionData)}
        Solo devuelve el cuerpo del texto y el asunto.
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

export const generateFinancialReport = async (
    transactions: WalletTransaction[],
    totalBalance: number,
    pendingDebt: number
): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "⚠️ IA no disponible. Configure la API Key.";

    const recent = transactions.slice(0, 5).map(t => `${t.type === 'INCOME' ? '+' : '-'}${t.amount} (${t.category})`);

    const prompt = `
        Actúa como Asesor Financiero de Sushiblack. Reporte BREVE "Situación Actual".
        Balance: $${totalBalance}, Deuda: $${pendingDebt}, Recientes: ${recent.join(', ')}.
        Analiza liquidez vs deuda. Consejo rápido. Formato Markdown.
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
        Actúa como CFO de "Sushiblack". Analiza situación financiera.
        Saldo: $${totalBalance}, Nómina: $${payroll}, Gastos Pendientes: $${pendingFixed}.
        Historial: ${JSON.stringify(history)}
        Output JSON: { healthScore, healthStatus, realAvailableMoney, allocations, actionableTips }.
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
