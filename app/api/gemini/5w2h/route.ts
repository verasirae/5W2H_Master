import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

function createFallbackTasks(
  prompt: string,
  department?: string,
  todayStr = new Date().toISOString().slice(0, 10),
  currentCompetence = `${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`
) {
  const deadlineDate = new Date();
  deadlineDate.setDate(new Date().getDate() + 30);
  const deadlineStr = deadlineDate.toISOString().slice(0, 10);

  const cleanPrompt = prompt.trim();
  const title =
    cleanPrompt.length > 60
      ? `Executar: ${cleanPrompt.slice(0, 55)}...`
      : `Implementar: ${cleanPrompt}`;

  return [
    {
      title,
      why: `Garantir a resolução estruturada do objetivo: "${cleanPrompt}". Alinha processos internos e estabelece marcos de entrega mensuráveis.`,
      where: department || 'Setor Responsável',
      startDate: todayStr,
      deadlineDate: deadlineStr,
      who: 'Líder de Processos / Responsável Setorial',
      how: `1. Diagnosticar o cenário atual e mapear requisitos detalhados\n2. Definir os responsáveis e o cronograma de entregas\n3. Executar as ações prioritárias para: ${cleanPrompt.slice(0, 40)}\n4. Monitorar indicadores de sucesso e validar os resultados`,
      howMuch: 2500,
      department: department || 'Geral',
      category: 'Processos Internos',
      competence: currentCompetence,
      priority: 'Alta',
      status: 'Não iniciado',
      progressPercent: 0,
      observations:
        'Plano de ação 5W2H gerado com base no escopo informado. Revise os prazos e custos conforme a necessidade do projeto.',
    },
  ];
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

    const { prompt, department, availableDepartments, availableCategories } =
      body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'É necessário fornecer uma descrição da meta ou problema.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const currentCompetence = `${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${today.getFullYear()}`;

    // If no API key is configured, return the fallback structured tasks
    if (!apiKey) {
      return NextResponse.json({
        tasks: createFallbackTasks(
          prompt,
          department,
          todayStr,
          currentCompetence
        ),
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Você é um consultor especialista em gestão empresarial e na metodologia 5W2H (O quê, Por quê, Onde, Quando, Quem, Como, Quanto).
Sua tarefa é converter o objetivo, problema ou meta descrito pelo usuário em 1 a 3 planos de ação 5W2H detalhados, estruturados em formato JSON estrito.

Data atual de referência: ${todayStr}
Competência padrão: ${currentCompetence}

Diretrizes para os campos 5W2H:
- title (O quê): Título direto e acionável com verbo no infinitivo (ex: "Implementar Módulo de Controle de Estoque").
- why (Por quê): Justificativa estratégica clara com benefícios mensuráveis.
- where (Onde): Local físico, sistema ou setor afetado.
- startDate (Início): Data de início formato YYYY-MM-DD (usar no mínimo ${todayStr}).
- deadlineDate (Quando): Prazo de conclusão no formato YYYY-MM-DD (coerente com a complexidade, ex: 15 a 60 dias após a data atual).
- who (Quem): Cargo ou responsável sugerido (ex: "Coordenador de Almoxarifado", "Gerente de TI").
- how (Como): Passo a passo ou metodologia clara em tópicos operacionais numerados.
- howMuch (Quanto): Valor numérico do custo estimado em moeda corrente (apenas o número, ex: 5000).
- department (Departamento): Escolha preferencialmente entre: ${
      availableDepartments?.join(', ') ||
      'RH/DP, Financeiro, Compras, Marketing, TI & Infraestrutura, Jurídico, Operações, Qualidade, Sucesso do Cliente'
    }.
- category (Categoria/Rotina): Categoria pertinente dentro do departamento. Sugestões: ${
      availableCategories
        ? JSON.stringify(availableCategories)
        : 'Processos Internos, Sistemas, Treinamento, Auditoria, Projetos, etc'
    }.
- competence (Competência): Mês/Ano de referência no formato MM/YYYY (ex: ${currentCompetence}).
- priority (Prioridade): Uma das opções: "Baixa", "Média", "Alta", "Urgente".
- status: Definir como "Não iniciado".
- progressPercent: Definir como 0.
- observations: Recomendações ou pré-requisitos importantes para execução do plano.

RETORNE EXCLUSIVAMENTE UM ARRAY JSON no seguinte formato:
[
  {
    "title": "string",
    "why": "string",
    "where": "string",
    "startDate": "YYYY-MM-DD",
    "deadlineDate": "YYYY-MM-DD",
    "who": "string",
    "how": "string",
    "howMuch": 0,
    "department": "string",
    "category": "string",
    "competence": "MM/YYYY",
    "priority": "Baixa" | "Média" | "Alta" | "Urgente",
    "status": "Não iniciado",
    "progressPercent": 0,
    "observations": "string"
  }
]`;

    // Attempt models in order with graceful fallback in case of 503 (high demand) or 429
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-3.7-flash',
    ];

    let lastError: any = null;
    let responseText: string | null = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            { text: systemPrompt },
            {
              text: `Descrição do problema/objetivo pelo usuário:\n"${prompt}"\n\nDepartamento prioritário informado: ${
                department || 'Geral'
              }`,
            },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(
          `Tentativa com modelo ${model} falhou (${err?.status || err?.message}). Tentando próximo modelo...`
        );
      }
    }

    // If Gemini models encountered temporary demand spikes (503/429) across all attempts
    if (!responseText) {
      console.warn(
        'Modelos Gemini em alta demanda temporária. Utilizando gerador inteligente local.',
        lastError
      );
      const fallbackTasks = createFallbackTasks(
        prompt,
        department,
        todayStr,
        currentCompetence
      );
      return NextResponse.json({
        tasks: fallbackTasks,
        notice:
          'Os servidores de IA estavam com alta demanda temporária; um plano estruturado de contingência foi gerado para você.',
      });
    }

    let parsedData: any[] = [];
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      let cleaned = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (
        firstBracket !== -1 &&
        lastBracket !== -1 &&
        lastBracket > firstBracket
      ) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
      parsedData = JSON.parse(cleaned);
    }

    if (!Array.isArray(parsedData)) {
      if (typeof parsedData === 'object' && parsedData !== null) {
        parsedData = [parsedData];
      } else {
        parsedData = createFallbackTasks(
          prompt,
          department,
          todayStr,
          currentCompetence
        );
      }
    }

    return NextResponse.json({ tasks: parsedData });
  } catch (error: any) {
    console.error('Erro na API Gemini 5W2H:', error);
    // Graceful fallback response on unhandled exception
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentCompetence = `${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${new Date().getFullYear()}`;
    return NextResponse.json({
      tasks: createFallbackTasks(
        'Plano de Ação 5W2H',
        'Geral',
        todayStr,
        currentCompetence
      ),
    });
  }
}
