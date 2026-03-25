import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade | UniMatch',
  description: 'Como o UniMatch recolhe, usa e protege os teus dados pessoais.',
}

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground mb-8">Última atualização: março de 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground">

        <section>
          <h2 className="text-base font-semibold mb-2">1. Quem somos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O UniMatch (<strong>unimatch.pt</strong>) é um projeto pessoal desenvolvido por Mariana Cabral Meida, estudante portuguesa,
            para ajudar candidatos ao ensino superior a explorar cursos e simular candidaturas.
            Para questões de privacidade: <a href="mailto:marianacabralmeida@gmail.com" className="text-navy hover:underline">marianacabralmeida@gmail.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">2. Dados que recolhemos</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Conta de utilizador:</strong> endereço de e-mail e senha (ou via Google OAuth). Usados exclusivamente para autenticação.</p>
            <p><strong className="text-foreground">Dados académicos:</strong> média do secundário, notas de exames e cursos favoritos que introduzes voluntariamente. Usados para personalizar o simulador e o conselheiro IA.</p>
            <p><strong className="text-foreground">Candidaturas partilhadas:</strong> quando usas a funcionalidade "Partilhar Candidatura", os cursos selecionados e a tua média são guardados anonimamente por 30 dias.</p>
            <p><strong className="text-foreground">Dados técnicos:</strong> registos de acesso padrão (endereço IP, browser) para segurança e diagnóstico de erros. Não são partilhados com terceiros.</p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">3. Base legal e finalidade do tratamento</h2>
          <p className="text-sm text-muted-foreground mb-2">
            O tratamento dos teus dados pessoais assenta nas seguintes bases legais (art. 6.º do RGPD):
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li><strong className="text-foreground">Execução de contrato</strong> — autenticação e gestão da conta, sem os quais o serviço não pode ser prestado.</li>
            <li><strong className="text-foreground">Consentimento</strong> — introdução voluntária de dados académicos (média, notas de exame) para personalizar o simulador e o conselheiro IA. Podes retirar o consentimento apagando esses dados a qualquer momento.</li>
            <li><strong className="text-foreground">Interesse legítimo</strong> — análise agregada e anónima de utilização para melhoria do serviço (não inclui rastreamento individual); segurança e prevenção de abuso.</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Não vendemos, alugamos nem partilhamos os teus dados pessoais com terceiros para fins comerciais.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">4. Armazenamento e segurança</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os dados são armazenados na <strong className="text-foreground">Supabase</strong> (infraestrutura na União Europeia, compatível com o RGPD).
            As ligações são cifradas via HTTPS/TLS. As senhas são processadas com hashing seguro pelo sistema de autenticação da Supabase.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">5. Os teus direitos (RGPD)</h2>
          <p className="text-sm text-muted-foreground mb-2">Tens direito a:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li><strong className="text-foreground">Acesso</strong> — saber que dados temos sobre ti</li>
            <li><strong className="text-foreground">Retificação</strong> — corrigir dados incorretos</li>
            <li><strong className="text-foreground">Eliminação</strong> — apagar a tua conta e todos os dados associados</li>
            <li><strong className="text-foreground">Portabilidade</strong> — exportar os teus dados</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Para exercer qualquer destes direitos, envia um e-mail para{' '}
            <a href="mailto:marianacabralmeida@gmail.com" className="text-navy hover:underline">marianacabralmeida@gmail.com</a>.
            Responderemos no prazo de 30 dias.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Podes também eliminar a tua conta diretamente na página do teu perfil.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">6. Cookies e análise de utilização</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            Usamos cookies estritamente necessários para autenticação (sessão de utilizador). Não usamos cookies de rastreamento nem de publicidade.
            O tema claro/escuro é guardado apenas no teu dispositivo (localStorage).
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para análise de tráfego, usamos a <strong className="text-foreground">Vercel Analytics</strong>, uma solução de métricas que não usa cookies, não rastreia utilizadores individualmente e não requer consentimento ao abrigo do RGPD. Os dados são agregados e anónimos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">7. Retenção de dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os dados da conta são conservados enquanto a conta estiver ativa.
            Candidaturas partilhadas expiram automaticamente ao fim de 30 dias.
            Após eliminação da conta, os dados são apagados nos 30 dias seguintes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">8. Violações de dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Em caso de violação de dados pessoais que constitua risco para os teus direitos e liberdades,
            notificaremos a <strong className="text-foreground">CNPD</strong> (Comissão Nacional de Proteção de Dados) no prazo de <strong className="text-foreground">72 horas</strong> após tomar conhecimento do incidente,
            conforme exigido pelo art. 33.º do RGPD.
            Se a violação for suscetível de provocar um risco elevado, serás também notificado/a diretamente por e-mail.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">9. Alterações a esta política</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Podemos atualizar esta política ocasionalmente. Em caso de alterações significativas, notificaremos por e-mail ou aviso no site.
          </p>
        </section>

      </div>
    </div>
  )
}
