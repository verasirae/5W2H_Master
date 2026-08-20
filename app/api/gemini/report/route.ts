import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

interface TaskPayload {
  id: string;
  title: string;
  department: string;
  category: string;
  status: string;
  priority: string;
  deadlineDate: string;
  who: string;
  howMuch: number;
  progressPercent: number;
}

function generateLocalFallbackReport(tasks: TaskPayload[], workspaceName: string) {
  const totalTasks = tasks.length;
  const inProgress = tasks.filter((t) => t.status === 'Em andamento').length;
  const delayed = tasks.filter((t) => t.status === 'Atrasado').length;
  const notStarted = tasks.filter((t) => t.status === 'Não iniciado').length;
  const completed = tasks.filter((t) => t.status === 'Concluído').length;
  const totalCost = tasks.reduce((sum, t) => sum + (Number(t.howMuch) || 0), 0);

  const delayedTasks = tasks.filter((t) => t.status === 'Atrasado');
  const criticalTasks = tasks.filter((t) => t.priority === 'Alta' || t.priority === 'Urgente');

  return `
# 📊 Relatório Executivo de Gestão 5W2H
**Workspace:** ${workspaceName || '5W2H Master'} | **Data de Emissão:** ${new Date().toLocaleDateString('pt-BR')}

---

## 1. 📌 Sumário Executivo & Visão Geral
Atualmente, o workspace conta com **${totalTasks} tarefas ativas** mapeadas sob a metodologia 5W2H, totalizando um orçamento alocado de **R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**.

- 🟢 **Em andamento:** ${inProgress} tarefas (${totalTasks > 0 ? Math.round((inProgress / totalTasks) * 100) : 0}%)
- ⚪ **Não iniciadas:** ${notStarted} tarefas (${totalTasks > 0 ? Math.round((notStarted / totalTasks) * 100) : 0}%)
- 🔴 **Atrasadas / Críticas:** ${delayed} tarefas
- 🔵 **Concluídas:** ${completed} tarefas

---

## 2. ⚠️ Análise de Riscos & Gargalos Operacionais
${
  delayedTasks.length > 0
    ? `Identificamos **${delayedTasks.length} ações em atraso** que necessitam de intervenção prioritária dos gestores de área:\n` +
      delayedTasks.map((t) => `- **[${t.department}]** ${t.title} (Resp: *${t.who}* - Prazo: *${t.deadlineDate}*)`).join('\n')
    : '✅ Excelente! Não há tarefas com status de atraso reportado no momento.'
}

---

## 3. 🎯 Ações de Alta Prioridade & Atenção Imediata
${
  criticalTasks.length > 0
    ? criticalTasks.slice(0, 5).map((t) => `- **${t.title}** (${t.department} | ${t.priority}) - Responsável: **${t.who}** - Progresso: **${t.progressPercent}%**`).join('\n')
    : 'Todas as tarefas estão com prioridade regular.'
}

---

## 4. 💡 Recomendações Estratégicas para os Próximos 15 Dias
1. **Revisão de Prazos (When):** Realizar alinhamento com os responsáveis pelas tarefas com entrega prevista para esta quinzena.
2. **Controle Orçamentário (How Much):** Acompanhar a execução dos custos nas categorias de maior alocação orçamentária.
3. **Desobstrução de Tarefas Não Iniciadas (What & How):** Garantir que os insumos e metodologias estejam disponíveis para início imediato das ações paradas.
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido.' },
        { status: 400 }
      );
    }

    const { tasks, workspaceName } = body || {};

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma tarefa ativa fornecida para gerar o relatório executivo.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallbackReport = generateLocalFallbackReport(tasks, workspaceName);
      return NextResponse.json({ report: fallbackReport });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const taskSummary = tasks
      .slice(0, 30) // Cap to avoid token explosion
      .map(
        (t: TaskPayload, i: number) =>
          `${i + 1}. [${t.department} - ${t.category}] ${t.title} | Status: ${t.status} (${t.progressPercent}%) | Resp (Who): ${t.who} | Prazo: ${t.deadlineDate} | Custo: R$ ${t.howMuch || 0} | Prioridade: ${t.priority}`
      )
      .join('\n');

    const prompt = `Você é um consultor C-level de gestão estratégica e especialista na metodologia 5W2H.
Analise a seguinte lista de tarefas ativas da empresa "${workspaceName || 'Minha Empresa'}" e produza um Relatório Executivo em formato Markdown elegante e estruturado em português do Brasil:

Lista de Tarefas:
${taskSummary}

Diretrizes para o relatório:
1. **Sumário Executivo & Diagnóstico Geral**: Panorama geral de saúde da carteira de projetos/ações.
2. **Análise dos 7 Pilares 5W2H**: Destaque pontos de atenção em Quem (responsáveis sobrecarregados), Quando (prazos apertados), Quanto (orçamento) e Como (complexidade).
3. **Plano de Contingência e Ações Prioritárias**: Recomendações práticas e acionáveis para os próximos 15 a 30 dias.
4. **Métricas Chave**: Destaque numérico dos gargalos e oportunidades.
5. Use formatação Markdown refinada, com emojis discretos, tabelas ou listas com marcadores.`;

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-3.7-flash',
    ];

    let reportText: string | null = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        if (response.text) {
          reportText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Tentativa de relatório com modelo ${model} falhou:`, err?.message);
      }
    }

    if (!reportText) {
      reportText = generateLocalFallbackReport(tasks, workspaceName);
    }

    return NextResponse.json({ report: reportText });
  } catch (error: any) {
    console.error('Erro na API de Relatório Gemini:', error);
    return NextResponse.json(
      { error: 'Falha ao processar relatório executivo.' },
      { status: 500 }
    );
  }
}
