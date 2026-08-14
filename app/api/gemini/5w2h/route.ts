import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, department, availableDepartments, availableCategories } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'É necessário fornecer uma descrição da meta ou problema.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada no servidor.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const todayStr = new Date().toISOString().slice(0, 10);
    const currentCompetence = `${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`;

    const systemPrompt = `
Você é um consultor especialista em gestão empresarial e na metodologia 5W2H (O quê, Por quê, Onde, Quando, Quem, Como, Quanto).
Sua tarefa é converter o objetivo, problema ou meta descrito pelo usuário em 1 ou até 3 planos de ação 5W2H detalhados, estruturados em formato JSON estrito.

Data atual de referência: ${todayStr}
Competência padrão: ${currentCompetence}

Diretrizes para os campos 5W2H:
- title (O quê): Título direto e acionável com verbo no infinitivo (ex: "Implementar Módulo de Controle de Estoque").
- why (Por quê): Justificativa estratégica clara com benefícios mensuráveis.
- where (Onde): Local físico, sistema ou setor afetado.
- startDate (Início): Data de início formato YYYY-MM-DD (usar no mínimo ${todayStr}).
- deadlineDate (Quando): Prazo de conclusão no formato YYYY-MM-DD (coerente com a complexidade, ex: 15 a 60 dias após a data atual).
- who (Quem): Cargo ou responsável sugerido (ex: "Coordenador de Almoxarifado", "Gerente de TI").
- how (Como): Passo a passo ou metodologia clara em tópicos operacionais.
- howMuch (Quanto): Valor numérico do custo estimado em moeda corrente (apenas o número, ex: 5000).
- department (Departamento): Escolha preferencialmente entre: ${availableDepartments?.join(', ') || 'RH/DP, Financeiro, Compras, Marketing, TI & Infraestrutura, Jurídico, Operações, Qualidade, Sucesso do Cliente'}.
- category (Categoria/Rotina): Categoria/subcategoria pertinente dentro do departamento. Sugestões conhecidas: ${availableCategories ? JSON.stringify(availableCategories) : 'Processos Internos, Sistemas, Treinamento, Auditoria, Projetos, etc'}.
- competence (Competência): Mês/Ano de referência no formato MM/YYYY (ex: ${currentCompetence}).
- priority (Prioridade): Uma das opções: "Baixa", "Média", "Alta", "Urgente".
- status: Definir como "Não iniciado".
- progressPercent: Definir como 0.
- observations: Recomendações ou pré-requisitos importantes para execução do plano.

RETORNE EXCLUSIVAMENTE UM ARRAY JSON no seguinte formato, sem formatação markdown extra fora do bloco json:
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
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: systemPrompt },
        { text: `Descrição do problema/objetivo pelo usuário:\n"${prompt}"\n\nDepartamento prioritário informado: ${department || 'Geral'}` }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const responseText = response.text || '[]';
    let parsedData = [];
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Clean up markdown quotes if needed
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return NextResponse.json({ tasks: parsedData });
  } catch (error: any) {
    console.error('Erro na API Gemini 5W2H:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao gerar plano 5W2H com IA.' },
      { status: 500 }
    );
  }
}
