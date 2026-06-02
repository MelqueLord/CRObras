import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5113';

type Obra = { id: string; nome: string; status: number; saldoAtual: number; dataInicio: string; descricao?: string; endereco?: string };
type ResumoFinanceiro = { saldoAtual: number; totalInvestido: number; totalGasto: number; totalRecebido: number; valorPermutasEstimado: number; resultadoEconomico: number };
type Socio = { id: string; nome: string; documento?: string; email?: string; telefone?: string; ativo: boolean };
type ObraSocio = { socioId: string; socioNome: string; percentualParticipacao: number };
type Fornecedor = { id: string; nome: string; documento?: string; telefone?: string; ativo: boolean };
type Movimento = { id: string; tipo: number; categoria: string; valor: number; dataMovimentacao: string; descricao: string; status: number; parcelaReceberId?: string };
type Dashboard = { saldoTotal: number; totalInvestido: number; totalGasto: number; totalRecebido: number; obrasAtivas: number; obrasEncerradas: number };
type ParcelaPendente = { parcelaId: string; obraId: string; obraNome: string; numero: number; valor: number; dataVencimento: string; status: string };
type Venda = { id: string; compradorNome: string; valorTotalNegociado: number; valorEntrada: number; status: number; parcelas: Parcela[]; permutas: Permuta[] };
type Parcela = { id: string; numero: number; valor: number; dataVencimento: string; dataPagamento?: string; status: number };
type Permuta = { id: string; tipo: number; descricao: string; valorEstimado: number; dataRecebimento: string; status: number };
type PreFechamento = { totalInvestido: number; totalGasto: number; totalRecebido: number; valorPermutasEstimado: number; resultadoFinanceiro: number; saldoAtual: number; pendencias: string[]; distribuicoes: { socioNome: string; valorInvestido: number; valorResultado: number; valorAReceberOuPagar: number }[] };

const categoriasDespesa = [
  { value: 1, label: 'Material' },
  { value: 2, label: 'Mao de obra' },
  { value: 3, label: 'Pintura' },
  { value: 4, label: 'Eletricista' },
  { value: 5, label: 'Cartorio' },
  { value: 6, label: 'Impostos' },
  { value: 7, label: 'Terreno' },
  { value: 99, label: 'Outros' }
];

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

function obraCardClass(obra: Obra, selectedObraId: string) {
  if (obra.id === selectedObraId) {
    return 'border-zinc-900 bg-zinc-900 text-white';
  }
  if (obra.status === 4) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-950 hover:border-emerald-400';
  }
  if (obra.status === 5) {
    return 'border-red-200 bg-red-50 text-red-950 hover:border-red-400';
  }
  return 'border-zinc-200 bg-white hover:border-zinc-400';
}

function obraStatusBadgeClass(status: number, isSelected: boolean) {
  if (isSelected) {
    return 'bg-white/15 text-white';
  }
  if (status === 4) {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (status === 5) {
    return 'bg-red-100 text-red-800';
  }
  if (status === 3) {
    return 'bg-blue-100 text-blue-800';
  }
  return 'bg-zinc-100 text-zinc-700';
}

function isBlank(value: string) {
  return value.trim().length === 0;
}

function toNumber(value: string) {
  return Number(String(value).replace(',', '.'));
}

function isPositive(value: string) {
  const number = toNumber(value);
  return Number.isFinite(number) && number > 0;
}

function isNonNegative(value: string) {
  const number = toNumber(value);
  return Number.isFinite(number) && number >= 0;
}

function isPercentualValido(value: string) {
  const number = toNumber(value);
  return Number.isFinite(number) && number >= 0 && number <= 100;
}

function isEmailValido(value: string) {
  return isBlank(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function confirmarAcao(message: string) {
  return window.confirm(message);
}

type ApiOptions = RequestInit & { silent?: boolean; timeoutMs?: number };

async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = localStorage.getItem('crobras.token');
  const { silent = false, timeoutMs = 15000, ...requestOptions } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  if (!silent) {
    window.dispatchEvent(new CustomEvent('crobras:request-start'));
  }
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(requestOptions.headers ?? {})
      }
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      const message = problem?.detail ?? (response.status === 401 ? 'Sessao expirada. Entre novamente.' : 'Erro na requisicao.');
      if (!silent) {
        window.dispatchEvent(new CustomEvent('crobras:api-error', { detail: message }));
      }
      throw new Error(message);
    }
    return response.json();
  } catch (err) {
    const message = err instanceof DOMException && err.name === 'AbortError'
      ? 'A API demorou para responder. Tente novamente.'
      : err instanceof Error ? err.message : 'Nao foi possivel conectar na API.';
    if (!silent) {
      window.dispatchEvent(new CustomEvent('crobras:api-error', { detail: message }));
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(message);
    }
    throw err;
  } finally {
    window.clearTimeout(timeout);
    if (!silent) {
      window.dispatchEvent(new CustomEvent('crobras:request-end'));
    }
  }
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('crobras.token'));
  const [notice, setNotice] = useState('');
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    function onApiError(event: Event) {
      setNotice(String((event as CustomEvent<string>).detail || 'Erro na operacao.'));
    }
    function onUnhandled(event: PromiseRejectionEvent) {
      const message = event.reason instanceof Error ? event.reason.message : 'Erro inesperado na operacao.';
      setNotice(message);
    }
    function onRequestStart() {
      setPendingRequests((value) => value + 1);
    }
    function onRequestEnd() {
      setPendingRequests((value) => Math.max(0, value - 1));
    }

    window.addEventListener('crobras:api-error', onApiError);
    window.addEventListener('unhandledrejection', onUnhandled);
    window.addEventListener('crobras:request-start', onRequestStart);
    window.addEventListener('crobras:request-end', onRequestEnd);
    return () => {
      window.removeEventListener('crobras:api-error', onApiError);
      window.removeEventListener('unhandledrejection', onUnhandled);
      window.removeEventListener('crobras:request-start', onRequestStart);
      window.removeEventListener('crobras:request-end', onRequestEnd);
    };
  }, []);

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
      <div className="mx-auto max-w-7xl px-4">
        {pendingRequests > 0 && <div className="mt-4 rounded border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">Processando...</div>}
        {notice && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{notice}</span>
            <button className="font-medium text-red-800" type="button" onClick={() => setNotice('')}>Fechar</button>
          </div>
        )}
      </div>
      <Workspace onError={setNotice} />
    </div>
  );
}

function AuthScreen({ onToken }: { onToken: (token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nome, setNome] = useState('Admin');
  const [email, setEmail] = useState('admin@crobras.local');
  const [password, setPassword] = useState('123456');
  const [registrationCode, setRegistrationCode] = useState('');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const body = mode === 'login' ? { email, password } : { nome, email, password, registrationCode };
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
        {mode === 'register' && <Field label="Codigo de cadastro" value={registrationCode} onChange={setRegistrationCode} />}
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
  const [parcelasPendentes, setParcelasPendentes] = useState<ParcelaPendente[]>([]);
  const [selectedObraId, setSelectedObraId] = useState('');
  const [activeTab, setActiveTab] = useState('resumo');
  const [buscaObra, setBuscaObra] = useState('');
  const [ordenacaoObras, setOrdenacaoObras] = useState('nome');
  const selectedObra = useMemo(() => obras.find((obra) => obra.id === selectedObraId), [obras, selectedObraId]);
  const obrasFiltradas = useMemo(() => {
    const busca = buscaObra.trim().toLowerCase();
    if (!busca) {
      return obras;
    }

    return obras.filter((obra) =>
      obra.nome.toLowerCase().includes(busca)
      || obraStatusLabel(obra.status).toLowerCase().includes(busca)
      || (obra.endereco ?? '').toLowerCase().includes(busca));
  }, [obras, buscaObra]);
  const obrasVisiveis = useMemo(() => {
    const ordenadas = [...obrasFiltradas];
    ordenadas.sort((a, b) => {
      if (ordenacaoObras === 'status') {
        const status = obraStatusLabel(a.status).localeCompare(obraStatusLabel(b.status), 'pt-BR');
        return status || a.nome.localeCompare(b.nome, 'pt-BR');
      }
      if (ordenacaoObras === 'saldoMaior') {
        return b.saldoAtual - a.saldoAtual || a.nome.localeCompare(b.nome, 'pt-BR');
      }
      if (ordenacaoObras === 'saldoMenor') {
        return a.saldoAtual - b.saldoAtual || a.nome.localeCompare(b.nome, 'pt-BR');
      }
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
    return ordenadas;
  }, [obrasFiltradas, ordenacaoObras]);

  async function load() {
    try {
      const obrasData = await api<Obra[]>('/api/obras');
      setObras(obrasData);
      setSelectedObraId((current) => current || obrasData[0]?.id || '');
      onError('');
    } catch (err) {
      onError((err as Error).message);
    }

    void api<Socio[]>('/api/socios', { silent: true }).then(setSocios).catch(() => undefined);
    void api<Dashboard>('/api/dashboard/resumo', { silent: true }).then(setDashboard).catch(() => undefined);
    void api<ParcelaPendente[]>('/api/dashboard/parcelas-pendentes', { silent: true }).then(setParcelasPendentes).catch(() => undefined);
  }

  function addObra(obra: Obra) {
    setObras((current) => current.some((item) => item.id === obra.id) ? current : [...current, obra]);
    setSelectedObraId(obra.id);
    setActiveTab('resumo');
    setDashboard((current) => current
      ? { ...current, obrasAtivas: current.obrasAtivas + 1, saldoTotal: current.saldoTotal + obra.saldoAtual }
      : current);
  }

  useEffect(() => { void load(); }, []);

  const tabs = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'venda', label: 'Venda' },
    { id: 'encerramento', label: 'Encerramento' },
    { id: 'socios', label: 'Socios' }
  ];
  const parcelasVencidas = parcelasPendentes.filter((parcela) => parcela.status === 'Vencida');
  const valorVencido = parcelasVencidas.reduce((total, parcela) => total + parcela.valor, 0);
  const valorPendente = parcelasPendentes.reduce((total, parcela) => total + parcela.valor, 0);

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
        <Panel title="Recebiveis">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Vencidas" value={String(parcelasVencidas.length)} />
            <Metric label="Valor vencido" value={money(valorVencido)} />
            <Metric label="Pendentes" value={String(parcelasPendentes.length)} />
            <Metric label="Valor pendente" value={money(valorPendente)} />
          </div>
          <div className="mt-3 space-y-2">
            {parcelasPendentes.slice(0, 4).map((parcela) => (
              <button key={parcela.parcelaId} className={`w-full rounded border px-3 py-2 text-left text-sm ${parcela.status === 'Vencida' ? 'border-red-200 bg-red-50 text-red-800' : 'border-zinc-200 bg-white text-zinc-700'}`} onClick={() => { setSelectedObraId(parcela.obraId); setActiveTab('venda'); }}>
                <span className="block font-medium">{parcela.obraNome} · Parcela {parcela.numero}</span>
                <span className="text-xs opacity-75">{parcela.dataVencimento} · {money(parcela.valor)} · {parcela.status}</span>
              </button>
            ))}
            {parcelasPendentes.length === 0 && <p className="rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-500">Nenhuma parcela pendente.</p>}
          </div>
        </Panel>
        <Panel title="Obras">
          <ObraForm onCreated={addObra} />
          <input className="input mt-3" value={buscaObra} onChange={(e) => setBuscaObra(e.target.value)} placeholder="Buscar obra" />
          <select className="input mt-2" value={ordenacaoObras} onChange={(e) => setOrdenacaoObras(e.target.value)} aria-label="Ordenar obras">
            <option value="nome">Ordenar por nome</option>
            <option value="status">Ordenar por status</option>
            <option value="saldoMaior">Maior saldo primeiro</option>
            <option value="saldoMenor">Menor saldo primeiro</option>
          </select>
          <div className="mt-2 text-xs text-zinc-500">{obrasVisiveis.length} de {obras.length} obra(s)</div>
          <div className="mt-3 space-y-2">
            {obrasVisiveis.map((obra) => (
              <button key={obra.id} className={`w-full rounded border px-3 py-2 text-left text-sm transition ${obraCardClass(obra, selectedObraId)}`} onClick={() => { setSelectedObraId(obra.id); setActiveTab('resumo'); }}>
                <span className="flex items-start justify-between gap-2">
                  <span className="font-medium">{obra.nome}</span>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${obraStatusBadgeClass(obra.status, obra.id === selectedObraId)}`}>
                    {obraStatusLabel(obra.status)}
                  </span>
                </span>
                <span className="mt-1 block text-xs opacity-75">{money(obra.saldoAtual)}</span>
              </button>
            ))}
            {obras.length === 0 && <p className="rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-500">Crie uma obra para comecar.</p>}
            {obras.length > 0 && obrasVisiveis.length === 0 && <p className="rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-500">Nenhuma obra encontrada.</p>}
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
                <div className="grid gap-4">
                  <ResumoFinanceiroObra obraId={selectedObra.id} />
                  <div className="grid gap-4 xl:grid-cols-2">
                    <ObraEditForm obra={selectedObra} onDone={load} />
                    <ObraDetalhe obra={selectedObra} socios={socios} onDone={load} />
                  </div>
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

function ResumoFinanceiroObra({ obraId }: { obraId: string }) {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);

  useEffect(() => {
    api<ResumoFinanceiro>(`/api/obras/${obraId}/resumo-financeiro`, { silent: true }).then(setResumo).catch(() => setResumo(null));
  }, [obraId]);

  if (!resumo) {
    return <p className="rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-500">Resumo financeiro ainda nao carregado.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Metric label="Saldo" value={money(resumo.saldoAtual)} />
      <Metric label="Investido" value={money(resumo.totalInvestido)} />
      <Metric label="Gasto" value={money(resumo.totalGasto)} />
      <Metric label="Recebido" value={money(resumo.totalRecebido)} />
      <Metric label="Permutas" value={money(resumo.valorPermutasEstimado)} />
      <Metric label="Resultado" value={money(resumo.resultadoEconomico)} />
    </div>
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

function ObraForm({ onCreated }: { onCreated: (obra: Obra) => void }) {
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');
  const canSubmit = !isBlank(nome);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setError('Informe o nome da obra.');
      return;
    }
    setError('');
    const obra = await api<Obra>('/api/obras', { method: 'POST', body: JSON.stringify({ nome, descricao: '', endereco: '', dataInicio: today(), dataPrevistaConclusao: null, status: 2 }) });
    setNome('');
    onCreated(obra);
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input className="input" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nova obra" />
        <button className="btn-primary" disabled={!canSubmit}>Criar</button>
      </div>
      {error && <ErrorText message={error} />}
    </form>
  );
}

function ObraEditForm({ obra, onDone }: { obra: Obra; onDone: () => void }) {
  const [nome, setNome] = useState(obra.nome);
  const [descricao, setDescricao] = useState(obra.descricao ?? '');
  const [endereco, setEndereco] = useState(obra.endereco ?? '');
  const [status, setStatus] = useState(String(obra.status));
  const [error, setError] = useState('');
  const canSubmit = !isBlank(nome);

  useEffect(() => {
    setNome(obra.nome);
    setDescricao(obra.descricao ?? '');
    setEndereco(obra.endereco ?? '');
    setStatus(String(obra.status));
  }, [obra]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setError('Informe o nome da obra.');
      return;
    }
    setError('');
    await api<Obra>(`/api/obras/${obra.id}`, {
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
      <input className="input" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da obra" />
      <input className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereco" />
      <textarea className="input min-h-20" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descricao" />
      <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="1">Planejada</option>
        <option value="2">Em andamento</option>
        <option value="3">Vendida</option>
        <option value="5">Cancelada</option>
      </select>
      {error && <ErrorText message={error} />}
      <button className="btn-primary" disabled={!canSubmit}>Salvar obra</button>
    </form>
  );
}

function SocioForm({ onDone }: { onDone: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const canSubmit = !isBlank(nome) && isEmailValido(email);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isBlank(nome)) {
      setError('Informe o nome do socio.');
      return;
    }
    if (!isEmailValido(email)) {
      setError('Informe um email valido ou deixe em branco.');
      return;
    }
    setError('');
    await api<Socio>('/api/socios', { method: 'POST', body: JSON.stringify({ nome, email, documento: '', telefone: '', ativo: true }) });
    setNome('');
    setEmail('');
    onDone();
  }
  return (
    <Panel title="Socios">
      <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input className="input" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" />
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <button className="btn-primary" disabled={!canSubmit}>Criar</button>
      </form>
      {error && <ErrorText message={error} />}
      <SociosEditor onDone={onDone} />
    </Panel>
  );
}

function ObraDetalhe({ obra, socios, onDone }: { obra: Obra; socios: Socio[]; onDone: () => void }) {
  const [vinculos, setVinculos] = useState<ObraSocio[]>([]);
  const [socioId, setSocioId] = useState('');
  const [percentual, setPercentual] = useState('50');
  const [error, setError] = useState('');
  const canSubmit = !isBlank(socioId) && isPercentualValido(percentual);
  useEffect(() => { api<ObraSocio[]>(`/api/obras/${obra.id}/socios`, { silent: true }).then(setVinculos).catch(() => setVinculos([])); }, [obra.id]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!socioId) {
      setError('Selecione um socio.');
      return;
    }
    if (!isPercentualValido(percentual)) {
      setError('Informe um percentual entre 0 e 100.');
      return;
    }
    setError('');
    const vinculo = await api<ObraSocio>(`/api/obras/${obra.id}/socios`, { method: 'POST', body: JSON.stringify({ socioId, percentualParticipacao: toNumber(percentual), observacao: '' }) });
    setVinculos((current) => current.some((item) => item.socioId === vinculo.socioId) ? current : [...current, vinculo]);
    setSocioId('');
    void onDone();
  }
  async function atualizarPercentual(socioId: string, percentualParticipacao: number) {
    const vinculo = await api<ObraSocio>(`/api/obras/${obra.id}/socios/${socioId}`, {
      method: 'PUT',
      body: JSON.stringify({ socioId, percentualParticipacao, observacao: '' })
    });
    setVinculos((current) => current.map((item) => item.socioId === socioId ? vinculo : item));
    void onDone();
  }
  return (
    <div className="grid gap-4">
      <form onSubmit={submit} className="grid gap-2">
        <select className="input" value={socioId} onChange={(e) => setSocioId(e.target.value)}><option value="">Selecionar socio</option>{socios.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
        <input className="input" type="number" min="0" max="100" step="0.01" value={percentual} onChange={(e) => setPercentual(e.target.value)} placeholder="Percentual" />
        {error && <ErrorText message={error} />}
        <button className="btn-primary" disabled={!canSubmit}>Vincular socio</button>
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
    setSocios(await api<Socio[]>('/api/socios', { silent: true }));
  }

  useEffect(() => { void load(); }, []);

  async function save(socio: Socio) {
    const atualizado = await api<Socio>(`/api/socios/${socio.id}`, {
      method: 'PUT',
      body: JSON.stringify(socio)
    });
    setSocios((current) => current.map((item) => item.id === atualizado.id ? atualizado : item));
    void onDone();
  }

  async function remove(socio: Socio) {
    if (!confirmarAcao('Remover este socio? Se ele ja possuir historico, sera apenas inativado.')) {
      return;
    }
    await api(`/api/socios/${socio.id}`, { method: 'DELETE' });
    setSocios((current) => current.map((item) => item.id === socio.id ? { ...item, ativo: false } : item));
    void onDone();
  }

  return (
    <div className="mt-3 space-y-2">
      {socios.map((socio) => <SocioEditor key={socio.id} socio={socio} onSave={save} onRemove={remove} />)}
    </div>
  );
}

function SocioEditor({ socio, onSave, onRemove }: { socio: Socio; onSave: (socio: Socio) => void; onRemove: (socio: Socio) => void }) {
  const [nome, setNome] = useState(socio.nome);
  const [email, setEmail] = useState(socio.email ?? '');
  const [telefone, setTelefone] = useState(socio.telefone ?? '');
  const [ativo, setAtivo] = useState(socio.ativo);
  const canSubmit = !isBlank(nome) && isEmailValido(email);

  useEffect(() => {
    setNome(socio.nome);
    setEmail(socio.email ?? '');
    setTelefone(socio.telefone ?? '');
    setAtivo(socio.ativo);
  }, [socio]);

  return (
    <div className="grid gap-2 rounded border border-zinc-200 p-2 sm:grid-cols-[1fr_1fr_120px_80px_auto_auto]">
      <input className="input" required value={nome} onChange={(e) => setNome(e.target.value)} />
      <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone" />
      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
        Ativo
      </label>
      <button className="btn-secondary" type="button" disabled={!canSubmit} onClick={() => onSave({ ...socio, nome, email, telefone, ativo })}>Salvar</button>
      <button className="btn-secondary" type="button" disabled={!socio.ativo} onClick={() => onRemove(socio)}>Remover</button>
    </div>
  );
}

function PercentualEditor({ vinculo, onSave }: { vinculo: ObraSocio; onSave: (socioId: string, percentual: number) => void }) {
  const [percentual, setPercentual] = useState(String(vinculo.percentualParticipacao));
  const canSubmit = isPercentualValido(percentual);

  useEffect(() => {
    setPercentual(String(vinculo.percentualParticipacao));
  }, [vinculo]);

  return (
    <div className="grid gap-2 rounded border border-zinc-200 p-2 sm:grid-cols-[1fr_120px_auto]">
      <div className="flex items-center text-sm font-medium">{vinculo.socioNome}</div>
      <input className="input" type="number" min="0" max="100" step="0.01" value={percentual} onChange={(e) => setPercentual(e.target.value)} />
      <button className="btn-secondary" type="button" disabled={!canSubmit} onClick={() => onSave(vinculo.socioId, toNumber(percentual))}>Salvar %</button>
    </div>
  );
}

function Financeiro({ obraId, onDone }: { obraId: string; onDone: () => void }) {
  const [movs, setMovs] = useState<Movimento[]>([]);
  const [socios, setSocios] = useState<ObraSocio[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [socioId, setSocioId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [novoFornecedor, setNovoFornecedor] = useState('');
  const [categoriaDespesa, setCategoriaDespesa] = useState('99');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [error, setError] = useState('');
  async function loadFinanceiro() {
    const movimentacoesData = await api<Movimento[]>(`/api/obras/${obraId}/movimentacoes`, { silent: true });
    setMovs(movimentacoesData);
    void api<ObraSocio[]>(`/api/obras/${obraId}/socios`, { silent: true }).then(setSocios).catch(() => undefined);
    void api<Fornecedor[]>('/api/fornecedores', { silent: true }).then(setFornecedores).catch(() => undefined);
  }

  useEffect(() => { void loadFinanceiro(); }, [obraId]);
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
  const canAportar = !isBlank(socioId) && isPositive(valor);
  const canDespesa = isPositive(valor) && !isBlank(descricao) && !isBlank(categoriaDespesa);
  const canCriarFornecedor = !isBlank(novoFornecedor);
  const fornecedoresAtivos = fornecedores.filter((fornecedor) => fornecedor.ativo);
  const fornecedorSelecionado = fornecedores.find((fornecedor) => fornecedor.id === fornecedorId);
  async function aporte() {
    if (!canAportar) {
      setError('Para registrar aporte, selecione o socio e informe valor maior que zero.');
      return;
    }
    setError('');
    const movimentacao = await api<Movimento>(`/api/obras/${obraId}/aportes`, { method: 'POST', body: JSON.stringify({ socioId, valor: toNumber(valor), dataAporte: today(), descricao }) });
    setMovs((current) => [movimentacao, ...current]);
    setValor('');
    setDescricao('');
    void onDone();
  }
  async function criarFornecedor() {
    if (!canCriarFornecedor) {
      setError('Informe o nome do fornecedor.');
      return;
    }
    setError('');
    const fornecedor = await api<Fornecedor>('/api/fornecedores', { method: 'POST', body: JSON.stringify({ nome: novoFornecedor, documento: '', telefone: '', ativo: true }) });
    setNovoFornecedor('');
    setFornecedorId(fornecedor.id);
    setFornecedores((current) => current.some((item) => item.id === fornecedor.id) ? current : [...current, fornecedor]);
  }
  async function despesa() {
    if (!canDespesa) {
      setError('Para registrar despesa, informe valor maior que zero e descricao.');
      return;
    }
    setError('');
    const movimentacao = await api<Movimento>(`/api/obras/${obraId}/despesas`, { method: 'POST', body: JSON.stringify({ categoria: Number(categoriaDespesa), valor: toNumber(valor), dataDespesa: today(), descricao, fornecedor: fornecedorSelecionado?.nome ?? '', documentoFiscal: '' }) });
    setMovs((current) => [movimentacao, ...current]);
    setValor('');
    setDescricao('');
    setCategoriaDespesa('99');
    setFornecedorId('');
    void onDone();
  }
  async function cancelar(movimentacao: Movimento) {
    if (movimentacao.parcelaReceberId) {
      window.alert('Cancele pagamentos de parcelas na area de venda.');
      return;
    }
    if (!confirmarAcao('Cancelar esta movimentacao? O saldo da obra sera recalculado e o historico permanecera registrado.')) {
      return;
    }
    const atualizada = await api<Movimento>(`/api/obras/${obraId}/movimentacoes/${movimentacao.id}/cancelar`, { method: 'POST' });
    setMovs((current) => current.map((item) => item.id === atualizada.id ? atualizada : item));
    void onDone();
  }
  return (
    <Panel title="Financeiro">
      <div className="grid gap-2 sm:grid-cols-2">
        <select className="input" value={socioId} onChange={(e) => setSocioId(e.target.value)}><option value="">Socio para aporte</option>{socios.map((s) => <option key={s.socioId} value={s.socioId}>{s.socioNome}</option>)}</select>
        <input className="input" type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor" />
        <select className="input" value={categoriaDespesa} onChange={(e) => setCategoriaDespesa(e.target.value)}>
          {categoriasDespesa.map((categoria) => <option key={categoria.value} value={categoria.value}>{categoria.label}</option>)}
        </select>
        <select className="input" value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
          <option value="">Fornecedor da despesa</option>
          {fornecedoresAtivos.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>)}
        </select>
        <div className="grid gap-2 sm:col-span-2 sm:grid-cols-[1fr_auto]">
          <input className="input" value={novoFornecedor} onChange={(e) => setNovoFornecedor(e.target.value)} placeholder="Novo fornecedor" />
          <button className="btn-secondary" type="button" disabled={!canCriarFornecedor} onClick={criarFornecedor}>Cadastrar fornecedor</button>
        </div>
        <input className="input sm:col-span-2" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descricao" />
        {error && <div className="sm:col-span-2"><ErrorText message={error} /></div>}
        <button className="btn-primary" disabled={!canAportar} onClick={aporte}>Aporte</button>
        <button className="btn-secondary" disabled={!canDespesa} onClick={despesa}>Despesa</button>
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
      <div className="no-print mt-3 flex justify-end">
        <button className="btn-secondary" type="button" disabled={movsFiltradas.length === 0} onClick={() => window.print()}>Imprimir extrato</button>
      </div>
      <RelatorioExtrato
        movimentos={movsFiltradas}
        dataInicial={dataInicial}
        dataFinal={dataFinal}
        totalEntradas={totalEntradasFiltradas}
        totalSaidas={totalSaidasFiltradas}
      />
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

function RelatorioExtrato({ movimentos, dataInicial, dataFinal, totalEntradas, totalSaidas }: { movimentos: Movimento[]; dataInicial: string; dataFinal: string; totalEntradas: number; totalSaidas: number }) {
  const periodo = dataInicial || dataFinal ? `${dataInicial || 'inicio'} ate ${dataFinal || 'hoje'}` : 'Todos os lancamentos filtrados';

  return (
    <div className="print-report mt-4 hidden rounded border border-zinc-200 bg-white p-4 print:block">
      <div className="mb-5 flex flex-col gap-2 border-b border-zinc-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Relatorio de extrato financeiro</div>
          <h3 className="text-2xl font-semibold">Movimentacoes da obra</h3>
          <p className="text-sm text-zinc-500">Periodo: {periodo}</p>
        </div>
        <div className="text-left text-sm text-zinc-500 sm:text-right">
          <p>Emitido em {today()}</p>
          <p>{movimentos.length} lancamento(s)</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Entradas" value={money(totalEntradas)} />
        <Metric label="Saidas" value={money(totalSaidas)} />
        <Metric label="Saldo do periodo" value={money(totalEntradas - totalSaidas)} />
      </div>
      <div className="mt-5 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {['Data', 'Tipo', 'Categoria', 'Descricao', 'Valor', 'Status'].map((header) => <th key={header} className="border-b border-zinc-200 py-2 font-medium text-zinc-500">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {movimentos.map((movimento) => (
              <tr key={movimento.id}>
                <td className="border-b border-zinc-100 py-2">{movimento.dataMovimentacao}</td>
                <td className="border-b border-zinc-100 py-2">{movimentoTipoLabel(movimento.tipo)}</td>
                <td className="border-b border-zinc-100 py-2">{movimento.categoria}</td>
                <td className="border-b border-zinc-100 py-2">{movimento.descricao}</td>
                <td className="border-b border-zinc-100 py-2">{money(movimento.valor)}</td>
                <td className="border-b border-zinc-100 py-2">{movimentoStatusLabel(movimento.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VendaBox({ obraId, onDone }: { obraId: string; onDone: () => void }) {
  const [venda, setVenda] = useState<Venda | null>(null);
  const [comprador, setComprador] = useState('');
  const [valor, setValor] = useState('');
  const [entrada, setEntrada] = useState('');
  const [parcelasIniciaisValor, setParcelasIniciaisValor] = useState('');
  const [parcelasIniciaisQtd, setParcelasIniciaisQtd] = useState('');
  const [parcelasIniciaisVencimento, setParcelasIniciaisVencimento] = useState(addMonths(today(), 1));
  const [permuta, setPermuta] = useState('');
  const [valorPermuta, setValorPermuta] = useState('');
  const [parcelaValor, setParcelaValor] = useState('');
  const [parcelaVencimento, setParcelaVencimento] = useState(addMonths(today(), 1));
  const [parcelasGerar, setParcelasGerar] = useState('1');
  const [error, setError] = useState('');
  useEffect(() => { api<Venda>(`/api/obras/${obraId}/venda`, { silent: true }).then(setVenda).catch(() => setVenda(null)); }, [obraId]);
  const temParcelamentoInicial = !isBlank(parcelasIniciaisValor) || !isBlank(parcelasIniciaisQtd);
  const parcelamentoInicialValido = !temParcelamentoInicial || (isPositive(parcelasIniciaisValor) && Number.isInteger(toNumber(parcelasIniciaisQtd)) && toNumber(parcelasIniciaisQtd) > 0 && !isBlank(parcelasIniciaisVencimento));
  const canCriarVenda = !isBlank(comprador) && isPositive(valor) && (isBlank(entrada) || (isNonNegative(entrada) && toNumber(entrada) <= toNumber(valor))) && parcelamentoInicialValido;
  const canAddParcelas = isPositive(parcelaValor) && !isBlank(parcelaVencimento) && Number.isInteger(toNumber(parcelasGerar)) && toNumber(parcelasGerar) > 0;
  const canAddPermuta = !isBlank(permuta) && isPositive(valorPermuta);
  async function criar() {
    if (!canCriarVenda) {
      setError('Informe comprador, valor total, entrada valida e parcelamento valido.');
      return;
    }
    setError('');
    const parcelas = temParcelamentoInicial
      ? Array.from({ length: toNumber(parcelasIniciaisQtd) }, (_, index) => ({
          numero: index + 1,
          valor: toNumber(parcelasIniciaisValor),
          dataVencimento: addMonths(parcelasIniciaisVencimento, index)
        }))
      : [];
    const result = await api<Venda>(`/api/obras/${obraId}/venda`, { method: 'POST', body: JSON.stringify({ tipo: 4, valorTotalNegociado: toNumber(valor), valorEntrada: isBlank(entrada) ? 0 : toNumber(entrada), dataVenda: today(), compradorNome: comprador, compradorDocumento: '', observacao: '', parcelas }) });
    setVenda(result);
    setComprador('');
    setValor('');
    setEntrada('');
    setParcelasIniciaisValor('');
    setParcelasIniciaisQtd('');
    void onDone();
  }
  async function addPermuta() {
    if (!venda) return;
    if (!canAddPermuta) {
      setError('Informe descricao e valor estimado da permuta.');
      return;
    }
    setError('');
    const novaPermuta = await api<Permuta>(`/api/vendas/${venda.id}/permutas`, { method: 'POST', body: JSON.stringify({ tipo: 1, descricao: permuta, valorEstimado: toNumber(valorPermuta), documentoReferencia: '', dataRecebimento: today(), status: 1 }) });
    setPermuta('');
    setValorPermuta('');
    setVenda((current) => current ? { ...current, permutas: [...current.permutas, novaPermuta] } : current);
  }
  async function addParcelas() {
    if (!venda) return;
    if (!canAddParcelas) {
      setError('Informe valor da parcela, vencimento e quantidade valida.');
      return;
    }
    setError('');
    const quantidade = Math.max(1, toNumber(parcelasGerar || '1'));
    const ultimaParcela = venda.parcelas.reduce((max, parcela) => Math.max(max, parcela.numero), 0);
    const parcelas = Array.from({ length: quantidade }, (_, index) => ({
      numero: ultimaParcela + index + 1,
      valor: toNumber(parcelaValor),
      dataVencimento: addMonths(parcelaVencimento, index)
    }));
    const novasParcelas = await api<Parcela[]>(`/api/vendas/${venda.id}/parcelas`, { method: 'POST', body: JSON.stringify(parcelas) });
    setParcelaValor('');
    setParcelasGerar('1');
    setVenda((current) => current
      ? { ...current, parcelas: [...current.parcelas, ...novasParcelas].sort((a, b) => a.numero - b.numero) }
      : current);
  }
  async function pagarParcela(parcelaId: string) {
    const parcela = await api<Parcela>(`/api/parcelas/${parcelaId}/pagar`, { method: 'POST', body: JSON.stringify({ dataPagamento: today() }) });
    setVenda((current) => current
      ? { ...current, parcelas: current.parcelas.map((item) => item.id === parcela.id ? parcela : item) }
      : current);
    void onDone();
  }
  async function cancelarPagamento(parcelaId: string) {
    if (!confirmarAcao('Cancelar o pagamento desta parcela? O valor sera removido do caixa da obra.')) {
      return;
    }
    const parcela = await api<Parcela>(`/api/parcelas/${parcelaId}/cancelar-pagamento`, { method: 'POST' });
    setVenda((current) => current
      ? { ...current, parcelas: current.parcelas.map((item) => item.id === parcela.id ? parcela : item) }
      : current);
    void onDone();
  }
  return (
    <Panel title="Venda, parcelas e permuta">
      {!venda ? (
        <div className="grid gap-2">
          <input className="input" value={comprador} onChange={(e) => setComprador(e.target.value)} placeholder="Comprador" />
          <input className="input" type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor total" />
          <input className="input" type="number" min="0" step="0.01" value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="Entrada" />
          <div className="grid gap-2 rounded border border-zinc-200 p-3 sm:grid-cols-3">
            <input className="input" type="number" min="0.01" step="0.01" value={parcelasIniciaisValor} onChange={(e) => setParcelasIniciaisValor(e.target.value)} placeholder="Valor da parcela" />
            <input className="input" type="number" min="1" step="1" value={parcelasIniciaisQtd} onChange={(e) => setParcelasIniciaisQtd(e.target.value)} placeholder="Qtd. parcelas" />
            <input className="input" type="date" value={parcelasIniciaisVencimento} onChange={(e) => setParcelasIniciaisVencimento(e.target.value)} />
          </div>
          {error && <ErrorText message={error} />}
          <button className="btn-primary" disabled={!canCriarVenda} onClick={criar}>Registrar venda</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label={venda.compradorNome} value={money(venda.valorTotalNegociado)} />
            <Metric label="Entrada" value={money(venda.valorEntrada)} />
            <Metric label="Parcelas pendentes" value={String(venda.parcelas.filter((p) => p.status === 1 || p.status === 3).length)} />
          </div>
          <div className="grid gap-2 rounded border border-zinc-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <input className="input" type="number" min="0.01" step="0.01" value={parcelaValor} onChange={(e) => setParcelaValor(e.target.value)} placeholder="Valor da parcela" />
            <input className="input" type="date" value={parcelaVencimento} onChange={(e) => setParcelaVencimento(e.target.value)} />
            <input className="input" type="number" min="1" step="1" value={parcelasGerar} onChange={(e) => setParcelasGerar(e.target.value)} placeholder="Qtd." />
            <button className="btn-secondary" disabled={!canAddParcelas} onClick={addParcelas}>Gerar</button>
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
            <input className="input" type="number" min="0.01" step="0.01" value={valorPermuta} onChange={(e) => setValorPermuta(e.target.value)} placeholder="Valor" />
            <button className="btn-secondary" disabled={!canAddPermuta} onClick={addPermuta}>Adicionar</button>
          </div>
          {error && <ErrorText message={error} />}
          <Table headers={['Permuta', 'Valor']} rows={venda.permutas.map((p) => [p.descricao, money(p.valorEstimado)])} />
        </div>
      )}
    </Panel>
  );
}

function Encerramento({ obra, onDone }: { obra: Obra; onDone: () => void }) {
  const [pre, setPre] = useState<PreFechamento | null>(null);
  async function carregar() { setPre(await api<PreFechamento>(`/api/obras/${obra.id}/pre-fechamento`)); }
  async function encerrar() {
    if (!confirmarAcao('Encerrar esta obra definitivamente? Depois disso nenhuma movimentacao financeira podera ser adicionada.')) {
      return;
    }
    await api(`/api/obras/${obra.id}/encerrar`, { method: 'POST', body: JSON.stringify({ observacao: 'Encerrado pelo sistema' }) });
    await carregar();
    onDone();
  }
  return (
    <Panel title="Encerramento">
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={carregar}>Gerar previa</button>
        <button className="btn-secondary" disabled={!pre} onClick={() => window.print()}>Imprimir</button>
        <button className="btn-primary" disabled={!pre || pre.pendencias.length > 0 || obra.status === 4} onClick={encerrar}>Encerrar obra</button>
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

function ErrorText({ message }: { message: string }) {
  return <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="mb-2"><div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div><div className="text-lg font-semibold">{value}</div></div>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="mt-3 overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{headers.map((h) => <th key={h} className="border-b border-zinc-200 py-2 font-medium text-zinc-500">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border-b border-zinc-100 py-2">{cell}</td>)}</tr>)}</tbody></table></div>;
}

createRoot(document.getElementById('root')!).render(<App />);
