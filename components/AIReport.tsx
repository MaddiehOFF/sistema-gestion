import React, { useState } from 'react';
import { Employee, OvertimeRecord, SanctionRecord } from '../types';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AIReportProps {
  employees: Employee[];
  records: OvertimeRecord[];
  sanctions: SanctionRecord[];
}

// Función LOCAL que arma un reporte de texto a partir de los datos
const generateLocalOvertimeReport = (
  employees: Employee[],
  records: OvertimeRecord[],
  sanctions: SanctionRecord[]
): string => {
  if (records.length === 0 && sanctions.length === 0) {
    return 'No hay datos suficientes de horas extras ni sanciones para generar un reporte.';
  }

  // Mapear empleados por id para lookup rápido
  const employeeMap = new Map<string, Employee>();
  employees.forEach((e) => employeeMap.set(e.id, e));

  // Agregados básicos de horas extras
  let totalHours = 0;
  let totalCost = 0;
  let unpaidHours = 0;
  let unpaidCost = 0;

  const overtimeByEmployee: Record<
    string,
    { hours: number; cost: number; unpaidHours: number; unpaidCost: number }
  > = {};

  records.forEach((r) => {
    const emp = employeeMap.get(r.employeeId);
    const name = emp ? emp.name : 'Empleado desconocido';

    if (!overtimeByEmployee[name]) {
      overtimeByEmployee[name] = {
        hours: 0,
        cost: 0,
        unpaidHours: 0,
        unpaidCost: 0
      };
    }

    overtimeByEmployee[name].hours += r.overtimeHours;
    overtimeByEmployee[name].cost += r.overtimeAmount;

    totalHours += r.overtimeHours;
    totalCost += r.overtimeAmount;

    if (!r.paid) {
      overtimeByEmployee[name].unpaidHours += r.overtimeHours;
      overtimeByEmployee[name].unpaidCost += r.overtimeAmount;
      unpaidHours += r.overtimeHours;
      unpaidCost += r.overtimeAmount;
    }
  });

  // Sanciones por empleado
  const sanctionsByEmployee: Record<
    string,
    { count: number; totalAmount: number }
  > = {};

  sanctions.forEach((s) => {
    const emp = employeeMap.get(s.employeeId);
    const name = emp ? emp.name : 'Empleado desconocido';

    if (!sanctionsByEmployee[name]) {
      sanctionsByEmployee[name] = { count: 0, totalAmount: 0 };
    }
    sanctionsByEmployee[name].count += 1;
    sanctionsByEmployee[name].totalAmount += s.amount;
  });

  // Top 3 por horas extra
  const ranking = Object.entries(overtimeByEmployee)
    .sort((a, b) => b[1].hours - a[1].hours)
    .slice(0, 3);

  const formatoARS = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(v);

  const lines: string[] = [];

  lines.push('# Reporte de Horas Extras y Disciplina');
  lines.push('');
  lines.push('## Resumen general');
  lines.push(`- Total de horas extras registradas: **${totalHours.toFixed(2)} hs**`);
  lines.push(`- Costo total estimado: **${formatoARS(totalCost)}**`);
  lines.push(
    `- Horas extras pendientes de pago: **${unpaidHours.toFixed(
      2
    )} hs** (${formatoARS(unpaidCost)})`
  );
  lines.push(
    `- Cantidad de empleados con horas extras: **${Object.keys(overtimeByEmployee).length}**`
  );
  lines.push(
    `- Cantidad total de sanciones registradas: **${sanctions.length}**`
  );
  lines.push('');

  if (ranking.length > 0) {
    lines.push('## Empleados con más horas extras');
    ranking.forEach(([name, data], idx) => {
      lines.push(
        `- ${idx + 1}. **${name}** — ${data.hours.toFixed(
          2
        )} hs (${formatoARS(data.cost)})`
      );
    });
    lines.push('');
  }

  if (unpaidHours > 0) {
    lines.push('## Horas extras pendientes de pago');
    lines.push(
      `Hay **${unpaidHours.toFixed(
        2
      )} hs** de horas extras sin marcar como pagadas (${formatoARS(
        unpaidCost
      )}).`
    );
    lines.push('Se recomienda:');
    lines.push(
      '- Revisar estos saldos con el área de finanzas para evitar conflictos laborales.'
    );
    lines.push(
      '- Definir una política clara de plazos máximos para el pago de horas extras.'
    );
    lines.push('');
  }

  if (Object.keys(sanctionsByEmployee).length > 0) {
    lines.push('## Comportamiento y sanciones');
    Object.entries(sanctionsByEmployee).forEach(([name, data]) => {
      lines.push(
        `- **${name}** — ${data.count} sanción(es), impacto económico: ${formatoARS(
          data.totalAmount
        )}`
      );
    });
    lines.push('');
  }

  lines.push('## Observaciones estratégicas');
  if (totalHours === 0) {
    lines.push(
      '- No se registran horas extras en el período analizado. Esto puede indicar una buena planificación de turnos o una baja carga de trabajo.'
    );
  } else {
    lines.push(
      '- Si las horas extras se concentran siempre en las mismas personas, puede existir riesgo de agotamiento y dependencia excesiva.'
    );
    lines.push(
      '- Un volumen alto y constante de horas extras suele indicar que la dotación de personal es insuficiente para la demanda real.'
    );
  }

  if (sanctions.length > 0) {
    lines.push(
      '- La existencia de sanciones debe cruzarse con los registros de desempeño: un empleado muy productivo pero con reiterados problemas de disciplina puede requerir una conversación formal.'
    );
  } else {
    lines.push(
      '- No hay sanciones registradas: mantener una cultura de feedback preventivo ayuda a sostener este nivel de disciplina.'
    );
  }

  lines.push('');
  lines.push('## Recomendaciones de acción');
  lines.push(
    '- Definir un límite mensual razonable de horas extras por persona y monitorear los desvíos.'
  );
  lines.push(
    '- Revisar la planilla de horarios para equilibrar la carga de trabajo entre todos los empleados.'
  );
  lines.push(
    '- Documentar claramente la política de horas extras y sanciones, y comunicarla al equipo.'
  );
  lines.push(
    '- Programar reuniones breves con los empleados que aparecen en el top de horas extras o sanciones para entender el contexto y tomar decisiones.'
  );

  return lines.join('\n');
};

export const AIReport: React.FC<AIReportProps> = ({
  employees,
  records,
  sanctions
}) => {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = () => {
    try {
      const text = generateLocalOvertimeReport(employees, records, sanctions);
      setResult(text);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Error al generar el reporte.');
      setResult(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-sushi-gold/10 rounded-full mb-2">
          <Sparkles className="w-8 h-8 text-yellow-600 dark:text-sushi-gold" />
        </div>
        <h2 className="text-3xl font-serif text-gray-900 dark:text-white">
          Analizador de Horas Extras
        </h2>
        <p className="text-gray-500 dark:text-sushi-muted max-w-2xl mx-auto">
          Genera un reporte estratégico a partir de los registros de horas extras y
          sanciones del equipo, sin usar servicios externos.
        </p>
      </div>

      <div className="bg-white dark:bg-sushi-dark border border-gray-200 dark:border-white/5 p-8 rounded-2xl relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center shadow-xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-sushi-gold/5 rounded-full blur-3xl pointer-events-none"></div>

        {!result && !error && (
          <div className="z-10 text-center">
            <button
              onClick={handleGenerateReport}
              className="bg-sushi-gold text-sushi-black font-bold text-lg px-8 py-4 rounded-full hover:bg-sushi-goldhover hover:shadow-lg hover:shadow-sushi-gold/20 transition-all flex items-center gap-3"
            >
              <Sparkles className="w-5 h-5" />
              Generar Análisis Estratégico
            </button>
            <p className="mt-4 text-sm text-gray-400 dark:text-sushi-muted">
              Analizando {records.length} registros, {sanctions.length} sanciones y{' '}
              {employees.length} empleados.
            </p>
          </div>
        )}

        {error && (
          <div className="z-10 text-center">
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={handleGenerateReport}
              className="bg-sushi-gold text-sushi-black font-bold text-sm px-6 py-2 rounded-full hover:bg-sushi-goldhover transition-all inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        )}

        {result && (
          <div className="w-full z-10 text-left animate-fade-in">
            <div className="flex justify-between items-start mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
              <h3 className="text-xl font-serif text-yellow-700 dark:text-sushi-gold">
                Reporte de Eficiencia
              </h3>
              <button
                onClick={handleGenerateReport}
                className="text-gray-400 dark:text-sushi-muted hover:text-gray-900 dark:hover:text-white transition-colors p-2"
                title="Regenerar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <div className="prose prose-invert prose-p:text-gray-700 dark:prose-p:text-sushi-text prose-headings:text-gray-900 dark:prose-headings:text-white prose-strong:text-yellow-700 dark:prose-strong:text-sushi-gold max-w-none">
              <div className="whitespace-pre-wrap leading-relaxed">
                {result.split('\n').map((line, i) => {
                  if (
                    line.startsWith('# ') ||
                    line.startsWith('## ') ||
                    line.startsWith('### ')
                  ) {
                    return (
                      <h4
                        key={i}
                        className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2"
                      >
                        {line.replace(/#/g, '').trim()}
                      </h4>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <li
                        key={i}
                        className="ml-4 list-disc text-gray-700 dark:text-sushi-text"
                      >
                        {line.replace('- ', '')}
                      </li>
                    );
                  }
                  if (line.trim() === '') {
                    return <div key={i} className="h-2" />;
                  }
                  return (
                    <p
                      key={i}
                      className="mb-2 text-gray-700 dark:text-sushi-text"
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
