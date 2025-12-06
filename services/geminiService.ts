
import { GoogleGenAI } from "@google/genai";
import { Employee, InventoryItem, InventorySession, OvertimeRecord, SanctionRecord, WalletTransaction, FixedExpense, BudgetAnalysis } from "../types";

// Note: Process.env.API_KEY is expected to be present.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateOvertimeAnalysis = async (
  employees: Employee[], 
  records: OvertimeRecord[],
  sanctions?: SanctionRecord[]
): Promise<string> => {
  
  if (records.length === 0 && (!sanctions || sanctions.length === 0)) {
    return "No hay suficientes datos (horas extras o sanciones) para generar un análisis. Por favor registre actividad primero.";
  }

  // Prepare data summary for the prompt
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
    
    1. **Análisis Financiero de Horas Extras**: Impacto en el presupuesto (ARS). Menciona cuánto se ha pagado ya y cuánto falta pagar (deuda pendiente).
    2. **Desempeño y Disciplina**: Cruza los datos de horas extras con las sanciones. ¿Hay empleados problemáticos? (Ej. muchas horas extras pero también llegadas tarde o strikes).
    3. **Cumplimiento de Horarios**: Identifica patrones de entrada/salida irregular.
    4. **Recomendaciones**: Sugiere acciones concretas (despidos, bonos, cambios de turno).
    
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
    return "Hubo un error al conectar con el asistente de IA. Por favor verifique su conexión o intente más tarde.";
  }
};

export const generateInventoryEmail = async (
    session: InventorySession,
    items: InventoryItem[]
): Promise<string> => {
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
        Actúa como el Jefe de Cocina de "Sushiblack". Escribe un informe de inventario por correo electrónico para los dueños.
        
        DATOS DEL TURNO:
        Fecha: ${session.date}
        Apertura: ${session.openedBy} (${session.startTime})
        Cierre: ${session.closedBy} (${session.endTime})
        
        CONSUMOS:
        ${JSON.stringify(consumptionData)}
        
        Estructura del Email:
        1. Asunto formal.
        2. Resumen ejecutivo del turno.
        3. Lista detallada de consumos (Items clave como Salmón, Arroz, Langostinos).
        4. Alerta si algún consumo parece excesivo o si hay stock crítico (cercano a 0 en final).
        5. Cierre formal.
        
        Solo devuelve el cuerpo del texto y el asunto. No uses markdown complejo, solo texto plano o formato simple.
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
    // Summarize last 5 transactions
    const recent = transactions.slice(0, 5).map(t => `${t.type === 'INCOME' ? '+' : '-'}${t.amount} (${t.category})`);

    const prompt = `
        Actúa como Asesor Financiero de Sushiblack. Genera un reporte "Situación Actual" MUY BREVE (máximo 3 párrafos).
        
        DATOS:
        Balance Billetera Global: $${totalBalance}
        Deuda Pendiente (Nómina/Regalías): $${pendingDebt}
        Movimientos Recientes: ${recent.join(', ')}
        
        Analiza la liquidez actual frente a las deudas. Da un consejo rápido sobre si se pueden realizar inversiones o si hay que cuidar el flujo de caja.
        Formato Markdown simple.
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
    transactions: WalletTransaction[] = [] // Added history
): Promise<BudgetAnalysis | null> => {
    // Calculate payroll sum
    const payroll = employees.filter(e => e.active).reduce((acc, e) => acc + e.monthlySalary, 0);
    // Calculate pending fixed expenses (taking into account partial payments)
    const pendingFixed = fixedExpenses
        .filter(e => !e.isPaid)
        .reduce((acc, e) => acc + (e.amount - (e.paidAmount || 0)), 0);

    // Get last 20 transactions for trend analysis
    const history = transactions.slice(0, 20).map(t => ({
        date: t.date,
        type: t.type,
        amount: t.amount,
        category: t.category
    }));

    const prompt = `
        Actúa como el CFO de "Sushiblack". Analiza la situación financiera y responde ÚNICAMENTE en formato JSON.
        
        DATOS DE ESTADO:
        - Saldo Actual (Caja): $${totalBalance}
        - Nómina Mensual (Empleados): $${payroll}
        - Gastos Fijos Pendientes Reales: $${pendingFixed}
        - Total Obligaciones Inmediatas: $${payroll + pendingFixed}

        HISTORIAL RECIENTE (Para detectar tendencias de gasto):
        ${JSON.stringify(history)}

        INSTRUCCIONES JSON:
        1. Calcula "healthScore" (0-100).
        2. "healthStatus": "CRITICAL" (si score < 40), "WARNING" (40-70), "HEALTHY" (>70).
        3. "realAvailableMoney": Saldo - Obligaciones. (Puede ser negativo).
        4. "allocations": Array de objetos sugiriendo distribución del excedente. Si hay déficit, priorizar pagos críticos. Categories: "Materia Prima", "Infraestructura", "Reserva", "Ganancia".
           Cada objeto: { name: string, percentage: number, amount: number, color: string (hex), description: string }.
        5. "actionableTips": Array de strings con 3 consejos estratégicos basados en el HISTORIAL (ej. "Gastos en proveedores subieron un 20%, revisar precios" o "Buen flujo de caja, ideal para stock").

        Output must be valid JSON without Markdown blocks.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const jsonText = response.text;
        if (!jsonText) return null;
        return JSON.parse(jsonText) as BudgetAnalysis;
    } catch (error) {
        console.error(error);
        return null;
    }
};
