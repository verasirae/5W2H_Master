import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '5W2H Master - Ferramenta de Gestão de Planos de Ação',
  description: 'Aplicação corporativa de gestão 5W2H com Dashboard, Kanban, Matriz de Ação e Inteligência Artificial Gemini.',
  openGraph: {
    title: '5W2H Master',
    description: 'Gestão ágil e precisa de tarefas e rotinas corporativas.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const mode = localStorage.getItem('5w2h_theme_mode');
                if (mode === 'dark' || (!mode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else if (mode === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
