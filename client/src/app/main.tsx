import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5113';

type Obra = { id: string; nome: string; status: number; saldoAtual: number; dataInicio: string; descricao?: string; endereco?: string };
type Socio = { id: string; nome: string; documento?: string; email?: string; telefone?: string; ativo: boolean };
type ObraSocio = { socioId: string; socioNome: string; percentualParticipacao: number };
type Movimento = { id: string; tipo: number; categoria: string; valor: number; dataMovimentacao: string; descricao: string; status: number; parcelaReceberId?: string };
type Dashboard = { saldoTotal: number; totalInvestido: number; totalGasto: number; totalRecebido: number; obrasAtivas: number; obrasEncerradas: number };
type Venda = { id: string; compradorNome: string; valorTotalNegociado: number; valorEntrada: number; status: number; parcelas: Parcela[]; permutas: Permuta[] };
type Parcela = { id: string; numero: number; valor: number; dataVencimento: string; dataPagamento?: string; status: number };
type Permuta = { id: string; tipo: number; descricao: string; valorEstimado: number; dataRecebimento: string; status: number };
type PreFechamento = { totalInvestido: number; totalGasto: number; totalRecebido: number; valorPermutasEstimado: number; resultadoFinanceiro: number; saldoAtual: number; pendencias: string[]; distribuicoes: { socioNome: string; valorInvestido: number; valorResultado: number; valorAReceberOuPagar: number }[] };

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(date: string, months: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setMonth(value.getMonth() + months);
  return value.toISOString().slice(0, 10);
}

function parcelaStatusLabel(status: number) {
  if (status === 2) return 'Paga';
  if (status === 3) return 'Vencida';
  if (status === 4) return 'Cancelada';
  return 'Pendente';
}

function movimentoStatusLabel(status: number) {
  return status === 2 ? 'Cancelada' : 'Confirmada';
}

function movimentoTipoLabel(tipo: number) {
  if (tipo === 2) return 'Saida';
  if (tipo === 1) return 'Aporte';
  if (tipo === 3) return 'Venda';
  return 'Ajuste';
}

function obraStatusLabel(status: number) {
  if (status === 1) return 'Planejada';
  if (status === 2) return 'Em andamento';
  if (status === 3) return 'Vendida';
  if (status === 4) return 'Encerrada';
  if (status === 5) return 'Cancelada';
  return 'Indefinida';
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('crobras.token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(problem?.detail ?? 'Erro na requisicao');
  }
  return response.json();
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('crobras.token'));
  const [error, setError] = useState('');

  if (!token) {
    return <AuthScreen onToken={(value) => { localStorage.setItem('crobras.token', value); setToken(value); }} />;
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-semibold">CRObras</h1>
            <p className="text-sm text-zinc-500">Controle financeiro de obras por caixa isolado</p>
          </div>
          <button className="btn-secondary" onClick={() => { localStorage.removeItem('crobras.token'); setToken(null); }}>Sair</button>
        </div>
      </header>
      {error && <div className="mx-auto mt-4 max-w-7xl rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <Workspace onError={setError} />
    </div>
  );
}

function AuthScreen({ onToken }: { onToken: (token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nome, setNome] = useState('Admin');
  const [email, setEmail] = useState('admin@crobras.local');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const body = mode === 'login' ? { email, password } : { nome, email, password };
      const result = await api<{ token: string }>(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
      onToken(result.token);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">CRObras</h1>
        <p className="mb-4 text-sm text-zinc-500">Acesse o controle financeiro</p>
        {mode === 'register' && <Field label="Nome" value={nome} onChange={setNome} />}
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Senha" type="password" value={password} onChange={setPassword} />
        {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full" type="submit">{mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
        <button className="mt-3 w-full text-sm text-zinc-600" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Criar primeiro usuario' : 'Voltar para login'}
        </button>
      </form>
    </main>
  );
}

function Workspace({ onError }: { onError: (message: string) => void }) {
  const [obras, setObras] = useState<Obra[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [selectedObraId, setSelectedObraId] = useState('');
  const [activeTab, setActiveTab] = useState('resumo');
  const selectedObra = useMemo(() => obras.find((obra) => obra.id === selectedObraId), [obras, selectedObraId]);

  async function load() {
    try {
      const [obrasData, sociosData, dashData] = await Promise.all([
        api<Obra[]>('/api/obras'),
        api<Socio[]>('/api/socios'),
        api<Dashboard>('/api/dashboard/resumo')
      ]);
      setObras(obrasData);
      setSocios(sociosData);
      setDashboard(dashData);
      setSelectedObraId((current) => current || obrasData[0]?.id || '');
      onError('');
    } catch (err) {
      onError((err as Error).message);
    }
  }

  useEffect(() => { void load(); }, []);

  const tabs = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'venda', label: 'Venda' },
    { id: 'encerramento', label: 'Encerramento' },
    { id: 'socios', label: 'Socios' }
  ];

  return (
    <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <Panel title="Resumo geral">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Saldo" value={money(dashboard?.saldoTotal ?? 0)} />
            <Metric label="Obras ativas" value={String(dashboard?.obrasAtivas ?? 0)} />
            <Metric label="Investido" value={money(dashboard?.totalInvestido ?? 0)} />
            <Metric label="Gasto" value={money(dashboard?.totalGasto ?? 0)} />
          </div>
        </Panel>
        <Panel title="Obras">
          <ObraForm onDone={load} />
          <div className="mt-3 space-y-2">
            {obras.map((obra) => (
              <button key={obra.id} className={`w-full rounded border px-3 py-2 text-left text-sm transition ${obra.id === selectedObraId ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white hover:border-zinc-400'}`} onClick={() => { setSelectedObraId(obra.id); setActiveTab('resumo'); }}>
                <span className="block font-medium">{obra.nome}</span>
                <span className="text-xs opacity-75">{obraStatusLabel(obra.status)} · {money(obra.saldoAtual)}</span>
              </button>
            ))}
            {obras.length === 0 && <p className="rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-500">Crie uma obra para comecar.</p>}
          </div>
        </Panel>
      </aside>
      <section className="space-y-4">
        {selectedObra ? (
          <>
            <ObraHeader obra={selectedObra} />
            <div className="overflow-auto rounded border border-zinc-200 bg-white p-1 shadow-sm">
              <div className="flex min-w-max gap-1">
                {tabs.map((tab) => (
                  <button key={tab.id} className={`rounded px-3 py-2 text-sm font-medium transition ${activeTab === tab.id ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`} onClick={() => setActiveTab(tab.id)}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'resumo' && (
              <Panel title="Resumo da obra">
                <div className="grid gap-4 xl:grid-cols-2">
                  <ObraEditForm obra={selectedObra} onDone={load} />
                  <ObraDetalhe obra={selectedObra} socios={socios} onDone={load} />
                </div>
              </Panel>
            )}
            {activeTab === 'financeiro' && <Financeiro obraId={selectedObra.id} onDone={load} />}
            {activeTab === 'venda' && <VendaBox obraId={selectedObra.id} onDone={load} />}
            {activeTab === 'encerramento' && <Encerramento obra={selectedObra} onDone={load} />}
            {activeTab === 'socios' && <SocioForm onDone={load} />}
          </>
        ) : (
          <Panel title="Nenhuma obra selecionada">
            <p className="text-sm text-zinc-500">Crie ou selecione uma obra no menu lateral.</p>
          </Panel>
        )}
      </section>
    </main>
  );
}

function ObraHeader({ obra }: { obra: Obra }) {
  return (
    <section className="rounded border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{obraStatusLabel(obra.status)}</div>
          <h2 className="text-2xl font-semibold">{obra.nome}</h2>
          {obra.endereco && <p className="mt-1 text-sm text-zinc-500">{obra.endereco}</p>}
        </div>
        <div className="rounded border border-zinc-200 px-4 py-3 text-right">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Saldo da obra</div>
          <div className="text-2xl font-semibold">{money(obra.saldoAtual)}</div>
        </div>
      </div>
    </section>
  );
}

function ObraForm({ onDone }: { onDone: () => void }) {
  const [nome, setNome] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await api('/api/obras', { method: 'POST', body: JSON.stringify({ nome, descricao: '', endereco: '', dataInicio: today(), dataPrevistaConclusao: null, status: 2 }) });
    setNome('');
    onDone();
  }
  return <form onSubmit={submit} className="flex gap-2"><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nova obra" /><button className="btn-primary">Criar</button></form>;
}

function ObraEditForm({ obra, onDone }: { obra: Obra; onDone: () => void }) {
  const [nome, setNome] = useState(obra.nome);
  const [descricao, setDescricao] = useState(obra.descricao ?? '');
  const [endereco, setEndereco] = useState(obra.endereco ?? '');
  const [status, setStatus] = useState(String(obra.status));

  useEffect(() => {
    setNome(obra.nome);
    setDescricao(obra.descricao ?? '');
    setEndereco(obra.endereco ?? '');
    setStatus(String(obra.status));
  }, [obra]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await api(`/api/obras/${obra.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nome,
        descricao,
        endereco,
        dataInicio: obra.dataInicio,
        dataPrevistaConclusao: null,
        status: Number(status)
      })
    });
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-2">
      <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da obra" />
      <input className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereco" />
      <textarea className="input min-h-20" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descricao" />
      <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="1">Planejada</option>
        <option value="2">Em andamento</option>
        <option value="3">Vendida</option>
        <option value="5">Cancelada</option>
      </select>
      <button className="btn-primary">Salvar obra</button>
    </form>
  );
}

function SocioForm({ onDone }: { onDone: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await api('/api/socios', { method: 'POST', body: JSON.stringify({ nome, email, documento: '', telefone: '', ativo: true }) });
    setNome('');
    setEmail('');
    onDone();
  }
  return (
    <Panel title="Socios">
      <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" />
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <button className="btn-primary">Criar</button>
      </form>
      <SociosEditor onDone={onDone} />
    </Panel>
  );
}

function ObraDetalhe({ obra, socios, onDone }: { obra: Obra; socios: Socio[]; onDone: () => void }) {
  const [vinculos, setVinculos] = useState<ObraSocio[]>([]);
  const [socioId, setSocioId] = useState('');
  const [percentual, setPercentual] = useState('50');
  useEffect(() => { api<ObraSocio[]>(`/api/obras/${obra.id}/socios`).then(setVinculos).catch(() => setVinculos([])); }, [obra.id]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await api(`/api/obras/${obra.id}/socios`, { method: 'POST', body: JSON.stringify({ socioId, percentualParticipacao: Number(percentual), observacao: '' }) });
    setSocioId('');
    onDone();
    setVinculos(await api<ObraSocio[]>(`/api/obras/${obra.id}/socios`));
  }
  async function atualizarPercentual(socioId: string, percentualParticipacao: number) {
    await api(`/api/obras/${obra.id}/socios/${socioId}`, {
      method: 'PUT',
      body: JSON.stringify({ socioId, percentualParticipacao, observacao: '' })
    });
    onDone();
    setVinculos(await api<ObraSocio[]>(`/api/obras/${obra.id}/socios`));
  }
  return (
    <div className="grid gap-4">
      <form onSubmit={submit} className="grid gap-2">
        <select className="input" value={socioId} onChange={(e) => setSocioId(e.target.value)}><option value="">Selecionar socio</option>{socios.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
        <input className="input" value={percentual} onChange={(e) => setPercentual(e.target.value)} placeholder="Percentual" />
        <button className="btn-primary">Vincular socio</button>
      </form>
      <div className="space-y-2">
        {vinculos.map((vinculo) => (
          <PercentualEditor key={vinculo.socioId} vinculo={vinculo} onSave={atualizarPercentual} />
        ))}
        {vinculos.length === 0 && <p className="rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-500">Nenhum socio vinculado.</p>}
      </div>
    </div>
  );
}

function SociosEditor({ onDone }: { onDone: () => void }) {
  const [socios, setSocios] = useState<Socio[]>([]);

  async function load() {
    setSocios(await api<Socio[]>('/api/socios'));
  }

  useEffect(() => { void load(); }, []);

  async function save(socio: Socio) {
    await api(`/api/socios/${socio.id}`, {
      method: 'PUT',
      body: JSON.stringify(socio)
    });
    await load();
    onDone();
  }

  return (
    <div className="mt-3 space-y-2">
      {socios.map((socio) => <SocioEditor key={socio.id} socio={socio} onSave={save} />)}
    </div>
  );
}

function SocioEditor({ socio, onSave }: { socio: Socio; onSave: (socio: Socio) => void }) {
  const [nome, setNome] = useState(socio.nome);
  const [email, setEmail] = useState(socio.email ?? '');
  const [telefone, setTelefone] = useState(socio.telefone ?? '');
  const [ativo, setAtivo] = useState(socio.ativo);

  useEffect(() => {
    setNome(socio.nome);
    setEmail(socio.email ?? '');
    setTelefone(socio.telefone ?? '');
    setAtivo(socio.ativo);
  }, [socio]);

  return (
    <div className="grid gap-2 rounded border border-zinc-200 p-2 sm:grid-cols-[1fr_1fr_120px_80px_auto]">
      <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
      <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone" />
      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
        Ativo
      </label>
      <button className="btn-secondary" type="button" onClick={() => onSave({ ...socio, nome, email, telefone, ativo })}>Salvar</button>
    </div>
  );
}

function PercentualEditor({ vinculo, onSave }: { vinculo: ObraSocio; onSave: (socioId: string, percentual: number) => void }) {
  const [percentual, setPercentual] = useState(String(vinculo.percentualParticipacao));

  useEffect(() => {
    setPercentual(String(vinculo.percentualParticipacao));
  }, [vinculo]);

  return (
    <div className="grid gap-2 rounded border border-zinc-200 p-2 sm:grid-cols-[1fr_120px_auto]">
      <div className="flex items-center text-sm font-medium">{vinculo.socioNome}</div>
      <input className="input" value={percentual} onChange={(e) => setPercentual(e.target.value)} />
      <button className="btn-secondary" type="button" onClick={() => onSave(vinculo.socioId, Number(percentual))}>Salvar %</button>
    </div>
  );
}

function Financeiro({ obraId, onDone }: { obraId: string; onDone: () => void }) {
  const [movs, setMovs] = useState<Movimento[]>([]);
  const [socios, setSocios] = useState<ObraSocio[]>([]);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [socioId, setSocioId] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  useEffect(() => { api<Movimento[]>(`/api/obras/${obraId}/movimentacoes`).then(setMovs); api<ObraSocio[]>(`/api/obras/${obraId}/socios`).then(setSocios); }, [obraId]);
  const movsFiltradas = useMemo(() => {
    const texto = filtroTexto.trim().toLowerCase();
    return movs.filter((movimentacao) => {
      const bateTexto = !texto || movimentacao.descricao.toLowerCase().includes(texto) || movimentacao.categoria.toLowerCase().includes(texto);
      const bateTipo = filtroTipo === 'todos' || movimentacao.tipo === Number(filtroTipo);
      const bateStatus = filtroStatus === 'todos' || movimentacao.status === Number(filtroStatus);
      const bateDataInicial = !dataInicial || movimentacao.dataMovimentacao >= dataInicial;
      const bateDataFinal = !dataFinal || movimentacao.dataMovimentacao <= dataFinal;
      return bateTexto && bateTipo && bateStatus && bateDataInicial && bateDataFinal;
    });
  }, [movs, filtroTexto, filtroTipo, filtroStatus, dataInicial, dataFinal]);
  const totalEntradasFiltradas = movsFiltradas.filter((movimentacao) => movimentacao.status === 1 && movimentacao.tipo !== 2).reduce((total, movimentacao) => total + movimentacao.valor, 0);
  const totalSaidasFiltradas = movsFiltradas.filter((movimentacao) => movimentacao.status === 1 && movimentacao.tipo === 2).reduce((total, movimentacao) => total + movimentacao.valor, 0);
  async function aporte() {
    await api(`/api/obras/${obraId}/aportes`, { method: 'POST', body: JSON.stringify({ socioId, valor: Number(valor), dataAporte: today(), descricao }) });
    onDone();
    setMovs(await api<Movimento[]>(`/api/obras/${obraId}/movimentacoes`));
  }
  async function despesa() {
    await api(`/api/obras/${obraId}/despesas`, { method: 'POST', body: JSON.stringify({ categoria: 99, valor: Number(valor), dataDespesa: today(), descricao, fornecedor: '', documentoFiscal: '' }) });
    onDone();
    setMovs(await api<Movimento[]>(`/api/obras/${obraId}/movimentacoes`));
  }
  async function cancelar(movimentacao: Movimento) {
    if (movimentacao.parcelaReceberId) {
      window.alert('Cancele pagamentos de parcelas na area de venda.');
      return;
    }
    await api(`/api/obras/${obraId}/movimentacoes/${movimentacao.id}/cancelar`, { method: 'POST' });
    onDone();
    setMovs(await api<Movimento[]>(`/api/obras/${obraId}/movimentacoes`));
  }
  return (
    <Panel title="Financeiro">
      <div className="grid gap-2 sm:grid-cols-2">
        <select className="input" value={socioId} onChange={(e) => setSocioId(e.target.value)}><option value="">Socio para aporte</option>{socios.map((s) => <option key={s.socioId} value={s.socioId}>{s.socioNome}</option>)}</select>
        <input className="input" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor" />
        <input className="input sm:col-span-2" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descricao" />
        <button className="btn-primary" onClick={aporte}>Aporte</button>
        <button className="btn-secondary" onClick={despesa}>Despesa</button>
      </div>
      <div className="mt-3 grid gap-2 rounded border border-zinc-200 p-3 lg:grid-cols-[1fr_140px_140px_150px_150px_auto]">
        <input className="input" value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} placeholder="Buscar no extrato" />
        <select className="input" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="todos">Todos tipos</option>
          <option value="1">Aporte</option>
          <option value="2">Despesa</option>
          <option value="3">Venda</option>
          <option value="4">Ajuste</option>
        </select>
        <select className="input" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="todos">Todos status</option>
          <option value="1">Confirmada</option>
          <option value="2">Cancelada</option>
        </select>
        <input className="input" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <input className="input" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        <button className="btn-secondary" type="button" onClick={() => { setFiltroTexto(''); setFiltroTipo('todos'); setFiltroStatus('todos'); setDataInicial(''); setDataFinal(''); }}>Limpar</button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Metric label="Entradas filtradas" value={money(totalEntradasFiltradas)} />
        <Metric label="Saidas filtradas" value={money(totalSaidasFiltradas)} />
        <Metric label="Saldo filtrado" value={money(totalEntradasFiltradas - totalSaidasFiltradas)} />
      </div>
      <div className="mt-3 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {['Data', 'Tipo', 'Categoria', 'Valor', 'Status', 'Acao'].map((header) => <th key={header} className="border-b border-zinc-200 py-2 font-medium text-zinc-500">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {movsFiltradas.slice(0, 30).map((movimentacao) => (
              <tr key={movimentacao.id}>
                <td className="border-b border-zinc-100 py-2">{movimentacao.dataMovimentacao}</td>
                <td className="border-b border-zinc-100 py-2">{movimentoTipoLabel(movimentacao.tipo)}</td>
                <td className="border-b border-zinc-100 py-2">{movimentacao.categoria}</td>
                <td className="border-b border-zinc-100 py-2">{money(movimentacao.valor)}</td>
                <td className="border-b border-zinc-100 py-2">{movimentoStatusLabel(movimentacao.status)}</td>
                <td className="border-b border-zinc-100 py-2">
                  {movimentacao.status === 1 && !movimentacao.parcelaReceberId ? (
                    <button className="btn-secondary" type="button" onClick={() => cancelar(movimentacao)}>Cancelar</button>
                  ) : (
                    <span className="text-xs text-zinc-400">-</span>
                  )}
                </td>
              </tr>
            ))}
            {movsFiltradas.length === 0 && <tr><td className="py-3 text-zinc-500" colSpan={6}>Nenhuma movimentacao encontrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function VendaBox({ obraId, onDone }: { obraId: string; onDone: () => void }) {
  const [venda, setVenda] = useState<Venda | null>(null);
  const [comprador, setComprador] = useState('');
  const [valor, setValor] = useState('');
  const [entrada, setEntrada] = useState('');
  const [permuta, setPermuta] = useState('');
  const [valorPermuta, setValorPermuta] = useState('');
  const [parcelaValor, setParcelaValor] = useState('');
  const [parcelaVencimento, setParcelaVencimento] = useState(addMonths(today(), 1));
  const [parcelasGerar, setParcelasGerar] = useState('1');
  useEffect(() => { api<Venda>(`/api/obras/${obraId}/venda`).then(setVenda).catch(() => setVenda(null)); }, [obraId]);
  async function reloadVenda() {
    setVenda(await api<Venda>(`/api/obras/${obraId}/venda`));
  }
  async function criar() {
    const result = await api<Venda>(`/api/obras/${obraId}/venda`, { method: 'POST', body: JSON.stringify({ tipo: 4, valorTotalNegociado: Number(valor), valorEntrada: Number(entrada || 0), dataVenda: today(), compradorNome: comprador, compradorDocumento: '', observacao: '', parcelas: [] }) });
    setVenda(result);
    onDone();
  }
  async function addPermuta() {
    if (!venda) return;
    await api(`/api/vendas/${venda.id}/permutas`, { method: 'POST', body: JSON.stringify({ tipo: 1, descricao: permuta, valorEstimado: Number(valorPermuta), documentoReferencia: '', dataRecebimento: today(), status: 1 }) });
    setPermuta('');
    setValorPermuta('');
    await reloadVenda();
  }
  async function addParcelas() {
    if (!venda) return;
    const quantidade = Math.max(1, Number(parcelasGerar || 1));
    const ultimaParcela = venda.parcelas.reduce((max, parcela) => Math.max(max, parcela.numero), 0);
    const parcelas = Array.from({ length: quantidade }, (_, index) => ({
      numero: ultimaParcela + index + 1,
      valor: Number(parcelaValor),
      dataVencimento: addMonths(parcelaVencimento, index)
    }));
    await api(`/api/vendas/${venda.id}/parcelas`, { method: 'POST', body: JSON.stringify(parcelas) });
    setParcelaValor('');
    setParcelasGerar('1');
    await reloadVenda();
  }
  async function pagarParcela(parcelaId: string) {
    await api(`/api/parcelas/${parcelaId}/pagar`, { method: 'POST', body: JSON.stringify({ dataPagamento: today() }) });
    await reloadVenda();
    onDone();
  }
  async function cancelarPagamento(parcelaId: string) {
    await api(`/api/parcelas/${parcelaId}/cancelar-pagamento`, { method: 'POST' });
    await reloadVenda();
    onDone();
  }
  return (
    <Panel title="Venda, parcelas e permuta">
      {!venda ? (
        <div className="grid gap-2">
          <input className="input" value={comprador} onChange={(e) => setComprador(e.target.value)} placeholder="Comprador" />
          <input className="input" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor total" />
          <input className="input" value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="Entrada" />
          <button className="btn-primary" onClick={criar}>Registrar venda</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label={venda.compradorNome} value={money(venda.valorTotalNegociado)} />
            <Metric label="Entrada" value={money(venda.valorEntrada)} />
            <Metric label="Parcelas pendentes" value={String(venda.parcelas.filter((p) => p.status === 1 || p.status === 3).length)} />
          </div>
          <div className="grid gap-2 rounded border border-zinc-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <input className="input" value={parcelaValor} onChange={(e) => setParcelaValor(e.target.value)} placeholder="Valor da parcela" />
            <input className="input" type="date" value={parcelaVencimento} onChange={(e) => setParcelaVencimento(e.target.value)} />
            <input className="input" value={parcelasGerar} onChange={(e) => setParcelasGerar(e.target.value)} placeholder="Qtd." />
            <button className="btn-secondary" onClick={addParcelas}>Gerar</button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {['Parcela', 'Vencimento', 'Valor', 'Status', 'Acao'].map((header) => <th key={header} className="border-b border-zinc-200 py-2 font-medium text-zinc-500">{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {venda.parcelas.map((parcela) => (
                  <tr key={parcela.id}>
                    <td className="border-b border-zinc-100 py-2">{parcela.numero}</td>
                    <td className="border-b border-zinc-100 py-2">{parcela.dataVencimento}</td>
                    <td className="border-b border-zinc-100 py-2">{money(parcela.valor)}</td>
                    <td className="border-b border-zinc-100 py-2">{parcelaStatusLabel(parcela.status)}</td>
                    <td className="border-b border-zinc-100 py-2">
                      {parcela.status === 2 ? (
                        <button className="btn-secondary" onClick={() => cancelarPagamento(parcela.id)}>Cancelar</button>
                      ) : (
                        <button className="btn-primary" onClick={() => pagarParcela(parcela.id)}>Pagar</button>
                      )}
                    </td>
                  </tr>
                ))}
                {venda.parcelas.length === 0 && <tr><td className="py-3 text-zinc-500" colSpan={5}>Nenhuma parcela cadastrada.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="grid gap-2 rounded border border-zinc-200 p-3 sm:grid-cols-[1fr_160px_auto]">
            <input className="input" value={permuta} onChange={(e) => setPermuta(e.target.value)} placeholder="Descricao da permuta" />
            <input className="input" value={valorPermuta} onChange={(e) => setValorPermuta(e.target.value)} placeholder="Valor" />
            <button className="btn-secondary" onClick={addPermuta}>Adicionar</button>
          </div>
          <Table headers={['Permuta', 'Valor']} rows={venda.permutas.map((p) => [p.descricao, money(p.valorEstimado)])} />
        </div>
      )}
    </Panel>
  );
}

function Encerramento({ obra, onDone }: { obra: Obra; onDone: () => void }) {
  const [pre, setPre] = useState<PreFechamento | null>(null);
  async function carregar() { setPre(await api<PreFechamento>(`/api/obras/${obra.id}/pre-fechamento`)); }
  async function encerrar() { await api(`/api/obras/${obra.id}/encerrar`, { method: 'POST', body: JSON.stringify({ observacao: 'Encerrado pelo sistema' }) }); await carregar(); onDone(); }
  return (
    <Panel title="Encerramento">
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={carregar}>Gerar previa</button>
        <button className="btn-secondary" disabled={!pre} onClick={() => window.print()}>Imprimir</button>
        <button className="btn-primary" onClick={encerrar}>Encerrar obra</button>
      </div>
      {!pre && <p className="text-sm text-zinc-500">Gere a previa para conferir totais, pendencias e distribuicao antes do encerramento.</p>}
      {pre && <RelatorioFechamento obra={obra} pre={pre} />}
    </Panel>
  );
}

function RelatorioFechamento({ obra, pre }: { obra: Obra; pre: PreFechamento }) {
  return (
    <div className="print-report rounded border border-zinc-200 bg-white p-4">
      <div className="mb-5 flex flex-col gap-2 border-b border-zinc-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Relatorio de fechamento</div>
          <h3 className="text-2xl font-semibold">{obra.nome}</h3>
          <p className="text-sm text-zinc-500">{obra.endereco || 'Endereco nao informado'}</p>
          <p className="text-sm text-zinc-500">Status: {obraStatusLabel(obra.status)}</p>
        </div>
        <div className="text-left text-sm text-zinc-500 sm:text-right">
          <p>Emitido em {today()}</p>
          <p>Saldo em caixa: <span className="font-semibold text-zinc-900">{money(pre.saldoAtual)}</span></p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Investido" value={money(pre.totalInvestido)} />
        <Metric label="Gasto" value={money(pre.totalGasto)} />
        <Metric label="Recebido" value={money(pre.totalRecebido)} />
        <Metric label="Permutas" value={money(pre.valorPermutasEstimado)} />
        <Metric label="Resultado" value={money(pre.resultadoFinanceiro)} />
      </div>

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">Pendencias</h4>
        {pre.pendencias.length > 0 ? (
          <div className="space-y-2">
            {pre.pendencias.map((pendencia) => <p key={pendencia} className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{pendencia}</p>)}
          </div>
        ) : (
          <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Sem pendencias para encerramento.</p>
        )}
      </div>

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">Distribuicao entre socios</h4>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {['Socio', 'Investido', 'Resultado', 'A receber / pagar'].map((header) => <th key={header} className="border-b border-zinc-200 py-2 font-medium text-zinc-500">{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {pre.distribuicoes.map((distribuicao) => (
                <tr key={distribuicao.socioNome}>
                  <td className="border-b border-zinc-100 py-2">{distribuicao.socioNome}</td>
                  <td className="border-b border-zinc-100 py-2">{money(distribuicao.valorInvestido)}</td>
                  <td className="border-b border-zinc-100 py-2">{money(distribuicao.valorResultado)}</td>
                  <td className="border-b border-zinc-100 py-2 font-medium">{money(distribuicao.valorAReceberOuPagar)}</td>
                </tr>
              ))}
              {pre.distribuicoes.length === 0 && <tr><td className="py-3 text-zinc-500" colSpan={4}>Nenhum socio para distribuicao.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded border border-zinc-200 bg-white p-4 shadow-sm"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>{children}</section>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="mb-3 block text-sm"><span className="mb-1 block text-zinc-600">{label}</span><input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="mb-2"><div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div><div className="text-lg font-semibold">{value}</div></div>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="mt-3 overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{headers.map((h) => <th key={h} className="border-b border-zinc-200 py-2 font-medium text-zinc-500">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border-b border-zinc-100 py-2">{cell}</td>)}</tr>)}</tbody></table></div>;
}

createRoot(document.getElementById('root')!).render(<App />);
