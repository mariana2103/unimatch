import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Utilização | UniMatch',
  description: 'Termos e condições de utilização do UniMatch.',
}

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">Termos de Utilização</h1>
      <p className="text-sm text-muted-foreground mb-8">Última atualização: março de 2026</p>

      <div className="space-y-6 text-foreground">

        <div className="rounded-xl border border-warning/25 bg-warning/8 px-4 py-3 text-sm text-warning">
          <strong>Aviso importante:</strong> os dados apresentados no UniMatch são para fins <strong>informativos</strong> e têm por base informação pública da DGES. Consulta sempre o site oficial da{' '}
          <a href="https://www.dges.gov.pt" target="_blank" rel="noopener noreferrer" className="underline">DGES</a>{' '}
          antes de tomares qualquer decisão sobre a tua candidatura. O UniMatch não substitui orientação oficial.
        </div>

        <section>
          <h2 className="text-base font-semibold mb-2">1. Aceitação dos termos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao utilizares o UniMatch, aceitas estes Termos de Utilização. Se não concordares, não deves utilizar o serviço.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">2. Descrição do serviço</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O UniMatch é uma plataforma de consulta e simulação de candidaturas ao ensino superior português, baseada em dados públicos da DGES.
            Oferece funcionalidades de exploração de cursos, simulação de notas de candidatura, e um conselheiro assistido por inteligência artificial.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">3. Natureza informativa dos dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Todos os dados apresentados (notas de entrada, vagas, provas de ingresso, etc.) são obtidos de fontes públicas e podem conter
            erros ou estar desatualizados. O UniMatch não garante a exatidão, completude ou atualidade da informação.
            <strong className="text-foreground"> A DGES é a única fonte oficial para efeitos de candidatura.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">4. Conselheiro IA</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O conselheiro de inteligência artificial fornece sugestões com base nos dados que introduzes e em modelos de linguagem.
            As suas respostas são <strong className="text-foreground">meramente orientativas</strong> e não constituem aconselhamento oficial.
            Não deves tomar decisões académicas importantes baseando-te exclusivamente nas sugestões do conselheiro IA.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">5. Conta de utilizador</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            És responsável por manter a confidencialidade das tuas credenciais. Não deves partilhar a tua conta.
            Reservamo-nos o direito de suspender contas que violem estes termos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">6. Uso aceitável</h2>
          <p className="text-sm text-muted-foreground mb-2">É proibido:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Usar o serviço para fins ilegais ou prejudiciais</li>
            <li>Tentar aceder a dados de outros utilizadores</li>
            <li>Realizar scraping automatizado do site sem autorização</li>
            <li>Publicar conteúdo difamatório ou enganoso através das funcionalidades de partilha</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">7. Limitação de responsabilidade</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O UniMatch é fornecido "tal como está", sem garantias de qualquer tipo. Não nos responsabilizamos por danos
            resultantes do uso ou incapacidade de uso do serviço, de decisões tomadas com base na informação fornecida,
            ou de interrupções no serviço.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">8. Propriedade intelectual</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os dados de cursos e instituições são informação pública da DGES. O código, design e conteúdos originais do UniMatch
            são propriedade da autora. Os dados académicos (notas, vagas) são factos públicos não sujeitos a direitos de autor.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">9. Alterações e encerramento</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Podemos modificar ou descontinuar o serviço a qualquer momento. Em caso de alterações materiais aos Termos, notificaremos os utilizadores registados.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">10. Lei aplicável</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Estes termos são regidos pela lei portuguesa. Qualquer litígio será submetido aos tribunais competentes em Portugal.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">11. Contacto</h2>
          <p className="text-sm text-muted-foreground">
            Para questões sobre estes termos:{' '}
            <a href="mailto:marianacabralmeida@gmail.com" className="text-navy hover:underline">marianacabralmeida@gmail.com</a>
          </p>
        </section>

      </div>
    </div>
  )
}
