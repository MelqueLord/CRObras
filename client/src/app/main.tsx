import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5113';

type Obra = { id: string; nome: string; status: number; saldoAtual: number; dataInicio: string; descricao?: string; endereco?: string };
type ResumoFinanceiro = { saldoAtual: number; totalInvestido: number; totalGasto: number; totalRecebido: number; valorPermutasEstimado: number; resultadoEconomico: number };
type Socio = { id: string; nome: string; documento?: string; email?: string; telefone?: string; ativo: boolean };
type ObraSocio = { socioId: string; socioNome: string; percentualParticipacao: number };
type Fornecedor = { id: string; nome: string; documento?: string; telefone?: string; ativo: boolean };
type Movimento = { id: string; tipo: number; categoria: string; valor: number; dataMovimentacao: string; descricao: string; status: number; parcelaReceberId?: string; fornecedor?: string };
type Dashboard = { saldoTotal: number; totalInvestido: number; totalGasto: number; totalRecebido: number; obrasAtivas: number; obrasEncerradas: number };
type ParcelaPendente = { parcelaId: string; obraId: string; obraNome: string; numero: number; valor: number; dataVencimento: string; status: string };
type Material = { id: string; nome: string; quantidade: number; precoUnitario: number };
type Venda = { id: string; tipo: number; compradorNome: string; valorTotalNegociado: number; valorEntrada: number; dataVenda: string; status: number; parcelas: Parcela[]; permutas: Permuta[] };
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

const filtrosStatusObra = [
  { value: 'todos', label: 'Todas' },
  { value: '2', label: 'Andamento' },
  { value: '1', label: 'Planejadas' },
  { value: '3', label: 'Vendidas' },
  { value: '4', label: 'Encerradas' },
  { value: '5', label: 'Canceladas' }
];

const ordemStatusParcela = new Map<number, number>([
  [3, 1],
  [1, 2],
  [2, 3],
  [4, 4]
]);

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const csv = [
    headers.map(csvCell).join(';'),
    ...rows.map((row) => row.map(csvCell).join(';'))
  ].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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

function parcelaStatusTone(status: number) {
  if (status === 2) return 'success';
  if (status === 3) return 'danger';
  if (status === 4) return 'muted';
  return 'warning';
}

function permutaStatusLabel(status: number) {
  if (status === 1) return 'Recebida';
  if (status === 3) return 'Vendida';
  return 'Pendente';
}

function permutaStatusTone(status: number) {
  if (status === 1 || status === 3) return 'success';
  return 'warning';
}

function vendaTipoLabel(tipo: number) {
  if (tipo === 1) return 'Dinheiro';
  if (tipo === 2) return 'Parcelada';
  if (tipo === 3) return 'Permuta';
  return 'Mista';
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

function parseDecimalInput(value: string) {
  const text = value.trim();
  if (!text) return 0;
  const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
  return Number(normalized);
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

function LoadingStrip({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
      {label}
    </div>
  );
}

function StatusBadge({ label, tone = 'muted' }: { label: string; tone?: 'success' | 'warning' | 'danger' | 'muted' }) {
  const classes = {
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    muted: 'bg-zinc-100 text-zinc-700'
  };
  return <span className={`status-badge ${classes[tone]}`}>{label}</span>;
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
  const [loadingObras, setLoadingObras] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingParcelas, setLoadingParcelas] = useState(true);
  const [selectedObraId, setSelectedObraId] = useState('');
  const [recentObras, setRecentObras] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('resumo');
  const [buscaObra, setBuscaObra] = useState('');
  const buscaObraRef = React.useRef<HTMLInputElement | null>(null);
  const [filtroStatusObra, setFiltroStatusObra] = useState('todos');
  const [ordenacaoObras, setOrdenacaoObras] = useState('nome');
  const selectedObra = useMemo(() => obras.find((obra) => obra.id === selectedObraId), [obras, selectedObraId]);
  const totaisPorStatus = useMemo(() => {
    const totais = new Map<string, number>([['todos', obras.length]]);
    for (const obra of obras) {
      const key = String(obra.status);
      totais.set(key, (totais.get(key) ?? 0) + 1);
    }
    return totais;
  }, [obras]);
  const obrasFiltradas = useMemo(() => {
    const busca = buscaObra.trim().toLowerCase();
    return obras.filter((obra) => {
      const bateStatus = filtroStatusObra === 'todos' || obra.status === Number(filtroStatusObra);
      const bateBusca = !busca
        || obra.nome.toLowerCase().includes(busca)
        || obraStatusLabel(obra.status).toLowerCase().includes(busca)
        || (obra.endereco ?? '').toLowerCase().includes(busca);
      return bateStatus && bateBusca;
    });
  }, [obras, buscaObra, filtroStatusObra]);
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
    setLoadingObras(true);
    try {
      const obrasData = await api<Obra[]>('/api/obras');
      setObras(obrasData);
      setSelectedObraId((current) => current || obrasData[0]?.id || '');
      onError('');
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setLoadingObras(false);
    }

    void api<Socio[]>('/api/socios', { silent: true }).then(setSocios).catch(() => undefined);
    setLoadingDashboard(true);
    void api<Dashboard>('/api/dashboard/resumo', { silent: true })
      .then(setDashboard)
      .catch(() => undefined)
      .finally(() => setLoadingDashboard(false));
    setLoadingParcelas(true);
    void api<ParcelaPendente[]>('/api/dashboard/parcelas-pendentes', { silent: true })
      .then(setParcelasPendentes)
      .catch(() => undefined)
      .finally(() => setLoadingParcelas(false));
  }

  function addObra(obra: Obra) {
    setObras((current) => current.some((item) => item.id === obra.id) ? current : [...current, obra]);
    setSelectedObraId(obra.id);
    recordRecentObra(obra.id);
    setActiveTab('resumo');
    setDashboard((current) => current
      ? { ...current, obrasAtivas: current.obrasAtivas + 1, saldoTotal: current.saldoTotal + obra.saldoAtual }
      : current);
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement && (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        buscaObraRef.current?.focus();
        return;
      }
      if (e.key === 'Escape') {
        if (buscaObraRef.current === document.activeElement) {
          // clear and blur when search input is focused
          setBuscaObra('');
          buscaObraRef.current?.blur();
        } else {
          // clear search when pressing Escape elsewhere
          setBuscaObra('');
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await api<string[]>('/api/me/recent-obras', { silent: true });
        if (mounted) setRecentObras(Array.isArray(list) ? list : []);
      } catch {
        if (mounted) setRecentObras([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function recordRecentObra(obraId: string) {
    void api(`/api/me/recent-obras/${obraId}`, { method: 'POST' }).then(() => {
      setRecentObras((current) => {
        const next = [obraId, ...current.filter((id) => id !== obraId)].slice(0, 5);
        return next;
      });
    }).catch(() => {
      // ignore
    });
  }

  function clearRecent() {
    void api('/api/me/recent-obras', { method: 'DELETE' }).then(() => setRecentObras([])).catch(() => setRecentObras([]));
  }

  function removeRecent(obraId: string) {
    void api(`/api/me/recent-obras/${obraId}`, { method: 'DELETE' }).then(() => {
      setRecentObras((current) => current.filter((id) => id !== obraId));
    }).catch(() => {
      setRecentObras((current) => current.filter((id) => id !== obraId));
    });
  }

  const tabs = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'materiais', label: 'Materiais' },
    { id: 'venda', label: 'Venda' },
    { id: 'encerramento', label: 'Encerramento' },
    { id: 'socios', label: 'Socios' }
  ];
  const parcelasVencidas = parcelasPendentes.filter((parcela) => parcela.status === 'Vencida');
  const valorVencido = parcelasVencidas.reduce((total, parcela) => total + parcela.valor, 0);
  const valorPendente = parcelasPendentes.reduce((total, parcela) => total + parcela.valor, 0);

  return (
    <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Obras">
          <ObraForm onCreated={addObra} />
          <label className="mt-3 block">
            <span className="field-label">Buscar obra</span>
            <input ref={buscaObraRef} className="input" value={buscaObra} onChange={(e) => setBuscaObra(e.target.value)} placeholder="Nome, endereco ou status" />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-1">
            {filtrosStatusObra.map((filtro) => (
              <button
                key={filtro.value}
                className={`rounded border px-2 py-1.5 text-xs font-medium transition ${filtroStatusObra === filtro.value ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'}`}
                type="button"
                onClick={() => setFiltroStatusObra(filtro.value)}
              >
                {filtro.label} ({totaisPorStatus.get(filtro.value) ?? 0})
              </button>
            ))}
          </div>
          <label className="mt-2 block">
            <span className="field-label">Ordenacao</span>
            <select className="input" value={ordenacaoObras} onChange={(e) => setOrdenacaoObras(e.target.value)} aria-label="Ordenar obras">
              <option value="nome">Nome</option>
              <option value="status">Status</option>
              <option value="saldoMaior">Maior saldo primeiro</option>
              <option value="saldoMenor">Menor saldo primeiro</option>
            </select>
          </label>
          <div className="mt-2 text-xs text-zinc-500">{obrasVisiveis.length} de {obras.length} obra(s)</div>
          <div className="mt-3 max-h-[440px] space-y-2 overflow-auto pr-1">
            {loadingObras && obras.length === 0 && <LoadingStrip />}
            {obrasVisiveis.map((obra) => (
              <button key={obra.id} className={`w-full rounded border px-3 py-2 text-left text-sm transition ${obraCardClass(obra, selectedObraId)}`} onClick={() => { setSelectedObraId(obra.id); setActiveTab('resumo'); recordRecentObra(obra.id); }}>
                <span className="flex items-start justify-between gap-2">
                  <span className="font-medium">{obra.nome}</span>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${obraStatusBadgeClass(obra.status, obra.id === selectedObraId)}`}>
                    {obraStatusLabel(obra.status)}
                  </span>
                </span>
                <span className="mt-1 block text-xs opacity-75">{money(obra.saldoAtual)}</span>
              </button>
            ))}
            {!loadingObras && obras.length === 0 && <EmptyState title="Nenhuma obra cadastrada" text="O painel financeiro fica disponivel apos o primeiro cadastro." />}
            {obras.length > 0 && obrasVisiveis.length === 0 && <EmptyState title="Nenhuma obra encontrada" text="Nao ha resultados para os filtros atuais." />}
          </div>
        </Panel>
        <Panel title="Resumo geral">
          {loadingDashboard && !dashboard && <LoadingStrip />}
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Saldo" value={money(dashboard?.saldoTotal ?? 0)} />
            <Metric label="Obras ativas" value={String(dashboard?.obrasAtivas ?? 0)} />
            <Metric label="Investido" value={money(dashboard?.totalInvestido ?? 0)} />
            <Metric label="Gasto" value={money(dashboard?.totalGasto ?? 0)} />
          </div>
        </Panel>
        <Panel title="Recebiveis">
          {loadingParcelas && parcelasPendentes.length === 0 && <LoadingStrip />}
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
            {!loadingParcelas && parcelasPendentes.length === 0 && <EmptyState title="Sem pendencias" text="Nenhuma parcela pendente no momento." />}
          </div>
        </Panel>
        <Panel title="Atalhos">
          <div className="space-y-2">
            {recentObras.length === 0 && <EmptyState title="Sem atalhos" text="As obras abertas recentemente aparecem aqui." />}
            {recentObras.map((id) => {
              const obra = obras.find((o) => o.id === id);
              if (!obra) return null;
              return (
                <div key={id} className="flex items-center gap-2">
                  <button className="flex-1 text-left rounded border px-3 py-2 text-sm" onClick={() => { setSelectedObraId(obra.id); setActiveTab('resumo'); recordRecentObra(obra.id); }}>
                    <div className="font-medium">{obra.nome}</div>
                    <div className="text-xs text-zinc-500">{money(obra.saldoAtual)}</div>
                  </button>
                  <div className="flex gap-1">
                    <button title="Abrir financeiro" className="btn-secondary text-xs" onClick={() => { setSelectedObraId(obra.id); setActiveTab('financeiro'); recordRecentObra(obra.id); }}>Fin</button>
                    <button title="Remover atalho" className="btn-secondary text-xs" onClick={() => removeRecent(obra.id)}>Remover</button>
                  </div>
                </div>
              );
            })}
            {recentObras.length > 0 && <div className="mt-2 text-right"><button className="text-xs text-zinc-600" onClick={clearRecent}>Limpar</button></div>}
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
            {activeTab === 'materiais' && <Materiais obraId={selectedObra.id} onDone={load} />}
            {activeTab === 'venda' && <VendaBox obraId={selectedObra.id} onDone={load} />}
            {activeTab === 'encerramento' && <Encerramento obra={selectedObra} onDone={load} />}
            {activeTab === 'socios' && <SocioForm onDone={load} />}
          </>
        ) : (
          <Panel title="Nenhuma obra selecionada">
            {loadingObras ? <LoadingStrip /> : <p className="text-sm text-zinc-500">Crie ou selecione uma obra no menu lateral.</p>}
          </Panel>
        )}
      </section>
    </main>
  );
}

function ResumoFinanceiroObra({ obraId }: { obraId: string }) {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<ResumoFinanceiro>(`/api/obras/${obraId}/resumo-financeiro`, { silent: true })
      .then(setResumo)
      .catch(() => setResumo(null))
      .finally(() => setLoading(false));
  }, [obraId]);

  if (!resumo) {
    return loading ? <LoadingStrip /> : <p className="rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-500">Resumo financeiro ainda nao carregado.</p>;
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
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:grid-cols-1 xl:grid-cols-[1fr_auto]">
        <label>
          <span className="field-label">Nova obra</span>
          <input className="input" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da obra" />
        </label>
        <button className="btn-primary self-end" disabled={!canSubmit}>Criar</button>
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
      <FormField label="Nome da obra">
        <input className="input" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Residencial Centro" />
      </FormField>
      <FormField label="Endereco">
        <input className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, numero, bairro" />
      </FormField>
      <FormField label="Descricao">
        <textarea className="input min-h-20" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Observacoes da obra" />
      </FormField>
      <FormField label="Status">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="1">Planejada</option>
          <option value="2">Em andamento</option>
          <option value="3">Vendida</option>
          <option value="5">Cancelada</option>
        </select>
      </FormField>
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
  const [loadingVinculos, setLoadingVinculos] = useState(true);
  const [socioId, setSocioId] = useState('');
  const [percentual, setPercentual] = useState('50');
  const [error, setError] = useState('');
  const canSubmit = !isBlank(socioId) && isPercentualValido(percentual);
  useEffect(() => {
    setLoadingVinculos(true);
    api<ObraSocio[]>(`/api/obras/${obra.id}/socios`, { silent: true })
      .then(setVinculos)
      .catch(() => setVinculos([]))
      .finally(() => setLoadingVinculos(false));
  }, [obra.id]);
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
        {loadingVinculos && vinculos.length === 0 && <LoadingStrip />}
        {vinculos.map((vinculo) => (
          <PercentualEditor key={vinculo.socioId} vinculo={vinculo} onSave={atualizarPercentual} />
        ))}
        {!loadingVinculos && vinculos.length === 0 && <p className="rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-500">Nenhum socio vinculado.</p>}
      </div>
    </div>
  );
}

function SociosEditor({ onDone }: { onDone: () => void }) {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setSocios(await api<Socio[]>('/api/socios', { silent: true }));
    } finally {
      setLoading(false);
    }
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
      {loading && socios.length === 0 && <LoadingStrip />}
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

function Materiais({ obraId, onDone }: { obraId: string; onDone: () => void }) {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [preco, setPreco] = useState('0,00');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api<Material[]>(`/api/obras/${obraId}/materiais`, { silent: true });
      setMateriais(data);
    } catch {
      setMateriais([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [obraId]);

  async function adicionar(event?: React.FormEvent) {
    if (event) event.preventDefault();
    if (!nome.trim()) return;
    const q = parseDecimalInput(quantidade) || 0;
    const p = parseDecimalInput(preco) || 0;
    const body = { nome: nome.trim(), quantidade: q, precoUnitario: p };
    const created = await api<Material>(`/api/obras/${obraId}/materiais`, { method: 'POST', body: JSON.stringify(body) });
    setMateriais((current) => [created, ...current]);
    setNome(''); setQuantidade('1'); setPreco('0,00');
    onDone();
  }

  async function salvar(material: Material, changes: Omit<Material, 'id'>) {
    const updated = await api<Material>(`/api/obras/${obraId}/materiais/${material.id}`, {
      method: 'PUT',
      body: JSON.stringify(changes)
    });
    setMateriais((current) => current.map((item) => item.id === updated.id ? updated : item));
    onDone();
  }

  async function remover(id: string) {
    if (!confirmarAcao('Remover este material?')) return;
    await api(`/api/obras/${obraId}/materiais/${id}`, { method: 'DELETE' });
    setMateriais((current) => current.filter((m) => m.id !== id));
    onDone();
  }

  const total = materiais.reduce((s, m) => s + m.quantidade * m.precoUnitario, 0);

  return (
    <Panel title="Materiais">
      <form onSubmit={adicionar} className="grid gap-2 sm:grid-cols-[1fr_120px_120px_auto]">
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do material" />
        <input className="input" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="Quantidade" />
        <input className="input" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="Preco unitario (ex: 12,50)" />
        <button className="btn-primary" disabled={!nome.trim()}>Adicionar</button>
      </form>
      <div className="mt-3 space-y-2">
        {materiais.length === 0 && <p className="rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-500">Nenhum material registrado para esta obra.</p>}
        {materiais.map((m) => (
          <MaterialRow key={m.id} material={m} onSave={salvar} onRemove={remover} />
        ))}
      </div>
      <div className="mt-3 text-right font-medium">Total gasto com materiais: {money(total)}</div>
      <div className="mt-2 text-right">
        <button className="btn-secondary" onClick={() => { downloadCsv(`materiais-${obraId}-${today()}.csv`, ['Nome','Quantidade','PrecoUnitario','Total'], materiais.map(m => [m.nome, m.quantidade, m.precoUnitario.toFixed(2).replace('.',','), (m.quantidade*m.precoUnitario).toFixed(2).replace('.',',')])); }}>Exportar CSV</button>
      </div>
    </Panel>
  );
}

function MaterialRow({ material, onSave, onRemove }: { material: Material; onSave: (material: Material, changes: Omit<Material, 'id'>) => Promise<void>; onRemove: (id: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(material.nome);
  const [quantidade, setQuantidade] = useState(String(material.quantidade));
  const [preco, setPreco] = useState(material.precoUnitario.toFixed(2).replace('.', ','));
  const q = parseDecimalInput(quantidade);
  const p = parseDecimalInput(preco);
  const canSubmit = nome.trim().length > 0 && Number.isFinite(q) && q > 0 && Number.isFinite(p) && p >= 0;

  function resetForm() {
    setNome(material.nome);
    setQuantidade(String(material.quantidade));
    setPreco(material.precoUnitario.toFixed(2).replace('.', ','));
  }

  useEffect(() => {
    resetForm();
  }, [material]);

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded border px-3 py-2">
        <div>
          <div className="font-medium">{material.nome}</div>
          <div className="text-xs text-zinc-500">{material.quantidade} x {money(material.precoUnitario)} = {money(material.quantidade * material.precoUnitario)}</div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" type="button" onClick={() => setEditing(true)}>Editar</button>
          <button className="btn-secondary" type="button" onClick={() => onRemove(material.id)}>Remover</button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-2 rounded border border-zinc-300 bg-zinc-50 p-2 sm:grid-cols-[1fr_120px_120px_auto_auto]"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canSubmit) return;
        await onSave(material, { nome: nome.trim(), quantidade: q, precoUnitario: p });
        setEditing(false);
      }}
    >
      <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
      <input className="input" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
      <input className="input" value={preco} onChange={(e) => setPreco(e.target.value)} />
      <button className="btn-primary" type="submit" disabled={!canSubmit}>Salvar</button>
      <button className="btn-secondary" type="button" onClick={() => { resetForm(); setEditing(false); }}>Cancelar</button>
    </form>
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
  const [loadingMovs, setLoadingMovs] = useState(true);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [socioId, setSocioId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [novoFornecedor, setNovoFornecedor] = useState('');
  const [categoriaDespesa, setCategoriaDespesa] = useState('99');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroFornecedor, setFiltroFornecedor] = useState('todos');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [error, setError] = useState('');
  async function loadFinanceiro() {
    setLoadingMovs(true);
    try {
      const movimentacoesData = await api<Movimento[]>(`/api/obras/${obraId}/movimentacoes`, { silent: true });
      setMovs(movimentacoesData);
    } finally {
      setLoadingMovs(false);
    }
    void api<ObraSocio[]>(`/api/obras/${obraId}/socios`, { silent: true }).then(setSocios).catch(() => undefined);
    void api<Fornecedor[]>('/api/fornecedores', { silent: true }).then(setFornecedores).catch(() => undefined);
  }

  useEffect(() => { void loadFinanceiro(); }, [obraId]);
  const fornecedoresDoExtrato = useMemo(() => {
    const nomes = new Set<string>();
    for (const movimentacao of movs) {
      const fornecedor = movimentacao.fornecedor?.trim();
      if (fornecedor) {
        nomes.add(fornecedor);
      }
    }
    return [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [movs]);
  const movsFiltradas = useMemo(() => {
    const texto = filtroTexto.trim().toLowerCase();
    const fornecedorSelecionado = filtroFornecedor.toLowerCase();
    return movs.filter((movimentacao) => {
      const fornecedor = movimentacao.fornecedor?.trim() ?? '';
      const bateTexto = !texto || movimentacao.descricao.toLowerCase().includes(texto) || movimentacao.categoria.toLowerCase().includes(texto) || fornecedor.toLowerCase().includes(texto);
      const bateTipo = filtroTipo === 'todos' || movimentacao.tipo === Number(filtroTipo);
      const bateStatus = filtroStatus === 'todos' || movimentacao.status === Number(filtroStatus);
      const bateFornecedor = filtroFornecedor === 'todos' || fornecedor.toLowerCase() === fornecedorSelecionado;
      const bateDataInicial = !dataInicial || movimentacao.dataMovimentacao >= dataInicial;
      const bateDataFinal = !dataFinal || movimentacao.dataMovimentacao <= dataFinal;
      return bateTexto && bateTipo && bateStatus && bateFornecedor && bateDataInicial && bateDataFinal;
    });
  }, [movs, filtroTexto, filtroTipo, filtroStatus, filtroFornecedor, dataInicial, dataFinal]);
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
  async function salvarFornecedor(fornecedor: Fornecedor) {
    const atualizado = await api<Fornecedor>(`/api/fornecedores/${fornecedor.id}`, {
      method: 'PUT',
      body: JSON.stringify(fornecedor)
    });
    setFornecedores((current) => current.map((item) => item.id === atualizado.id ? atualizado : item));
    if (!atualizado.ativo && fornecedorId === atualizado.id) {
      setFornecedorId('');
    }
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
  function exportarCsv() {
    downloadCsv(
      `extrato-${obraId}-${today()}.csv`,
      ['Data', 'Tipo', 'Categoria', 'Fornecedor', 'Descricao', 'Valor', 'Status'],
      movsFiltradas.map((movimentacao) => [
        movimentacao.dataMovimentacao,
        movimentoTipoLabel(movimentacao.tipo),
        movimentacao.categoria,
        movimentacao.fornecedor || '',
        movimentacao.descricao,
        movimentacao.valor.toFixed(2).replace('.', ','),
        movimentoStatusLabel(movimentacao.status)
      ])
    );
  }
  return (
    <Panel title="Financeiro">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="surface">
          <h3 className="section-title">Novo lancamento</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FormField label="Socio para aporte">
              <select className="input" value={socioId} onChange={(e) => setSocioId(e.target.value)}><option value="">Selecionar socio</option>{socios.map((s) => <option key={s.socioId} value={s.socioId}>{s.socioNome}</option>)}</select>
            </FormField>
            <FormField label="Valor">
              <input className="input" type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </FormField>
            <FormField label="Categoria da despesa">
              <select className="input" value={categoriaDespesa} onChange={(e) => setCategoriaDespesa(e.target.value)}>
                {categoriasDespesa.map((categoria) => <option key={categoria.value} value={categoria.value}>{categoria.label}</option>)}
              </select>
            </FormField>
            <FormField label="Fornecedor">
              <select className="input" value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
                <option value="">Sem fornecedor</option>
                {fornecedoresAtivos.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>)}
              </select>
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Descricao">
                <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: compra de cimento, aporte inicial" />
              </FormField>
            </div>
            {error && <div className="sm:col-span-2"><ErrorText message={error} /></div>}
            <button className="btn-primary" disabled={!canAportar} onClick={aporte}>Registrar aporte</button>
            <button className="btn-secondary" disabled={!canDespesa} onClick={despesa}>Registrar despesa</button>
          </div>
        </section>
        <section className="surface">
          <h3 className="section-title">Fornecedores</h3>
          <div className="mt-3 grid gap-2">
            <FormField label="Novo fornecedor">
              <input className="input" value={novoFornecedor} onChange={(e) => setNovoFornecedor(e.target.value)} placeholder="Nome do fornecedor" />
            </FormField>
            <button className="btn-secondary" type="button" disabled={!canCriarFornecedor} onClick={criarFornecedor}>Cadastrar fornecedor</button>
            {fornecedores.length > 0 && <FornecedorManager fornecedores={fornecedores} onSave={salvarFornecedor} />}
          </div>
        </section>
      </div>
      <div className="mt-4 rounded border border-zinc-200 p-3">
        <h3 className="section-title">Extrato</h3>
        <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_140px_140px_180px_150px_150px_auto]">
          <FormField label="Buscar">
            <input className="input" value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} placeholder="Descricao, categoria ou fornecedor" />
          </FormField>
          <FormField label="Tipo">
            <select className="input" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="1">Aporte</option>
              <option value="2">Despesa</option>
              <option value="3">Venda</option>
              <option value="4">Ajuste</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className="input" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="1">Confirmada</option>
              <option value="2">Cancelada</option>
            </select>
          </FormField>
          <FormField label="Fornecedor">
            <select className="input" value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)}>
              <option value="todos">Todos</option>
              {fornecedoresDoExtrato.map((fornecedor) => <option key={fornecedor} value={fornecedor}>{fornecedor}</option>)}
            </select>
          </FormField>
          <FormField label="Inicio">
            <input className="input" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
          </FormField>
          <FormField label="Fim">
            <input className="input" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
          </FormField>
          <button className="btn-secondary self-end" type="button" onClick={() => { setFiltroTexto(''); setFiltroTipo('todos'); setFiltroStatus('todos'); setFiltroFornecedor('todos'); setDataInicial(''); setDataFinal(''); }}>Limpar</button>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Metric label="Entradas filtradas" value={money(totalEntradasFiltradas)} />
        <Metric label="Saidas filtradas" value={money(totalSaidasFiltradas)} />
        <Metric label="Saldo filtrado" value={money(totalEntradasFiltradas - totalSaidasFiltradas)} />
      </div>
      <div className="no-print mt-3 flex justify-end gap-2">
        <button className="btn-secondary" type="button" disabled={movsFiltradas.length === 0} onClick={exportarCsv}>Exportar CSV</button>
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
        {loadingMovs && movs.length === 0 && <LoadingStrip />}
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {['Data', 'Tipo', 'Categoria', 'Fornecedor', 'Valor', 'Status', 'Acao'].map((header) => <th key={header} className="border-b border-zinc-200 py-2 font-medium text-zinc-500">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {movsFiltradas.slice(0, 30).map((movimentacao) => (
              <tr key={movimentacao.id}>
                <td className="border-b border-zinc-100 py-2">{movimentacao.dataMovimentacao}</td>
                <td className="border-b border-zinc-100 py-2">{movimentoTipoLabel(movimentacao.tipo)}</td>
                <td className="border-b border-zinc-100 py-2">{movimentacao.categoria}</td>
                <td className="border-b border-zinc-100 py-2">{movimentacao.fornecedor || '-'}</td>
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
            {!loadingMovs && movsFiltradas.length === 0 && <tr><td className="py-3 text-zinc-500" colSpan={7}>Nenhuma movimentacao encontrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function FornecedorManager({ fornecedores, onSave }: { fornecedores: Fornecedor[]; onSave: (fornecedor: Fornecedor) => Promise<void> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded border border-zinc-200">
      <button className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium" type="button" onClick={() => setOpen((value) => !value)}>
        <span>Fornecedores cadastrados</span>
        <span className="text-xs text-zinc-500">{open ? 'Ocultar' : 'Gerenciar'}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-zinc-200 p-2">
          {fornecedores.map((fornecedor) => (
            <FornecedorRow key={fornecedor.id} fornecedor={fornecedor} onSave={onSave} />
          ))}
        </div>
      )}
    </div>
  );
}

function FornecedorRow({ fornecedor, onSave }: { fornecedor: Fornecedor; onSave: (fornecedor: Fornecedor) => Promise<void> }) {
  const [nome, setNome] = useState(fornecedor.nome);
  const [documento, setDocumento] = useState(fornecedor.documento ?? '');
  const [telefone, setTelefone] = useState(fornecedor.telefone ?? '');
  const [ativo, setAtivo] = useState(fornecedor.ativo);
  const [saving, setSaving] = useState(false);
  const canSubmit = !isBlank(nome) && !saving;

  useEffect(() => {
    setNome(fornecedor.nome);
    setDocumento(fornecedor.documento ?? '');
    setTelefone(fornecedor.telefone ?? '');
    setAtivo(fornecedor.ativo);
  }, [fornecedor]);

  return (
    <form
      className="grid gap-2 rounded border border-zinc-200 p-2 lg:grid-cols-[1fr_150px_150px_90px_auto]"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canSubmit) return;
        setSaving(true);
        try {
          await onSave({ ...fornecedor, nome: nome.trim(), documento, telefone, ativo });
        } finally {
          setSaving(false);
        }
      }}
    >
      <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
      <input className="input" value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Documento" />
      <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone" />
      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
        Ativo
      </label>
      <button className="btn-secondary" type="submit" disabled={!canSubmit}>{saving ? 'Salvando...' : 'Salvar'}</button>
    </form>
  );
}

function ParcelaRow({ parcela, onSave, onPay, onCancelInstallment, onCancelPayment }: {
  parcela: Parcela;
  onSave: (parcelaId: string, valor: number, dataVencimento: string) => Promise<void>;
  onPay: (parcelaId: string) => Promise<void>;
  onCancelInstallment: (parcelaId: string) => Promise<void>;
  onCancelPayment: (parcelaId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [valor, setValor] = useState(String(parcela.valor));
  const [dataVencimento, setDataVencimento] = useState(parcela.dataVencimento);
  const valorNumerico = parseDecimalInput(valor);
  const canEdit = parcela.status === 1 || parcela.status === 3;
  const canSubmit = canEdit && Number.isFinite(valorNumerico) && valorNumerico > 0 && !isBlank(dataVencimento);

  function resetForm() {
    setValor(String(parcela.valor));
    setDataVencimento(parcela.dataVencimento);
  }

  useEffect(() => {
    resetForm();
  }, [parcela]);

  return (
    <tr>
      <td className="border-b border-zinc-100 py-2">{parcela.numero}</td>
      <td className="border-b border-zinc-100 py-2">
        {editing ? (
          <input className="input" type="date" value={dataVencimento} onChange={(event) => setDataVencimento(event.target.value)} />
        ) : (
          parcela.dataVencimento
        )}
      </td>
      <td className="border-b border-zinc-100 py-2">
        {editing ? (
          <input className="input" value={valor} onChange={(event) => setValor(event.target.value)} />
        ) : (
          money(parcela.valor)
        )}
      </td>
      <td className="border-b border-zinc-100 py-2">
        <StatusBadge label={parcelaStatusLabel(parcela.status)} tone={parcelaStatusTone(parcela.status)} />
      </td>
      <td className="border-b border-zinc-100 py-2">
        {editing ? (
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary"
              type="button"
              disabled={!canSubmit}
              onClick={async () => {
                await onSave(parcela.id, valorNumerico, dataVencimento);
                setEditing(false);
              }}
            >
              Salvar
            </button>
            <button className="btn-secondary" type="button" onClick={() => { resetForm(); setEditing(false); }}>Cancelar</button>
          </div>
        ) : parcela.status === 2 ? (
          <button className="btn-secondary" type="button" onClick={() => onCancelPayment(parcela.id)}>Cancelar pagamento</button>
        ) : canEdit ? (
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" type="button" onClick={() => onPay(parcela.id)}>Pagar</button>
            <button className="btn-secondary" type="button" onClick={() => setEditing(true)}>Editar</button>
            <button className="btn-secondary" type="button" onClick={() => onCancelInstallment(parcela.id)}>Cancelar parcela</button>
          </div>
        ) : (
          <span className="text-xs text-zinc-400">-</span>
        )}
      </td>
    </tr>
  );
}

function PermutaRow({ permuta, onSave, onStatusChange }: {
  permuta: Permuta;
  onSave: (permuta: Permuta) => Promise<void>;
  onStatusChange: (permutaId: string, status: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [tipo, setTipo] = useState(String(permuta.tipo));
  const [descricao, setDescricao] = useState(permuta.descricao);
  const [valor, setValor] = useState(String(permuta.valorEstimado));
  const [dataRecebimento, setDataRecebimento] = useState(permuta.dataRecebimento);
  const [status, setStatus] = useState(String(permuta.status));
  const valorNumerico = parseDecimalInput(valor);
  const canSubmit = !isBlank(descricao) && Number.isFinite(valorNumerico) && valorNumerico > 0 && !isBlank(dataRecebimento);

  function resetForm() {
    setTipo(String(permuta.tipo));
    setDescricao(permuta.descricao);
    setValor(String(permuta.valorEstimado));
    setDataRecebimento(permuta.dataRecebimento);
    setStatus(String(permuta.status));
  }

  useEffect(() => {
    resetForm();
  }, [permuta]);

  return (
    <tr>
      <td className="border-b border-zinc-100 py-2">
        {editing ? (
          <div className="grid gap-2">
            <select className="input" value={tipo} onChange={(event) => setTipo(event.target.value)}>
              <option value="1">Terreno</option>
              <option value="2">Imovel</option>
              <option value="3">Veiculo</option>
              <option value="99">Outro</option>
            </select>
            <input className="input" value={descricao} onChange={(event) => setDescricao(event.target.value)} />
          </div>
        ) : (
          permuta.descricao
        )}
      </td>
      <td className="border-b border-zinc-100 py-2">
        {editing ? (
          <input className="input" type="date" value={dataRecebimento} onChange={(event) => setDataRecebimento(event.target.value)} />
        ) : (
          permuta.dataRecebimento
        )}
      </td>
      <td className="border-b border-zinc-100 py-2">
        {editing ? (
          <input className="input" value={valor} onChange={(event) => setValor(event.target.value)} />
        ) : (
          money(permuta.valorEstimado)
        )}
      </td>
      <td className="border-b border-zinc-100 py-2">
        {editing ? (
          <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="1">Recebida</option>
            <option value="2">Pendente</option>
            <option value="3">Vendida</option>
          </select>
        ) : (
          <select className="input" value={String(permuta.status)} onChange={(event) => onStatusChange(permuta.id, Number(event.target.value))} aria-label={`Status da permuta ${permuta.descricao}`}>
            <option value="1">Recebida</option>
            <option value="2">Pendente</option>
            <option value="3">Vendida</option>
          </select>
        )}
        {!editing && <StatusBadge label={permutaStatusLabel(permuta.status)} tone={permutaStatusTone(permuta.status)} />}
      </td>
      <td className="border-b border-zinc-100 py-2">
        {editing ? (
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary"
              type="button"
              disabled={!canSubmit}
              onClick={async () => {
                await onSave({
                  ...permuta,
                  tipo: Number(tipo),
                  descricao: descricao.trim(),
                  valorEstimado: valorNumerico,
                  dataRecebimento,
                  status: Number(status)
                });
                setEditing(false);
              }}
            >
              Salvar
            </button>
            <button className="btn-secondary" type="button" onClick={() => { resetForm(); setEditing(false); }}>Cancelar</button>
          </div>
        ) : (
          <button className="btn-secondary" type="button" onClick={() => setEditing(true)}>Editar</button>
        )}
      </td>
    </tr>
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
              {['Data', 'Tipo', 'Categoria', 'Fornecedor', 'Descricao', 'Valor', 'Status'].map((header) => <th key={header} className="border-b border-zinc-200 py-2 font-medium text-zinc-500">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {movimentos.map((movimento) => (
              <tr key={movimento.id}>
                <td className="border-b border-zinc-100 py-2">{movimento.dataMovimentacao}</td>
                <td className="border-b border-zinc-100 py-2">{movimentoTipoLabel(movimento.tipo)}</td>
                <td className="border-b border-zinc-100 py-2">{movimento.categoria}</td>
                <td className="border-b border-zinc-100 py-2">{movimento.fornecedor || '-'}</td>
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
  const [loadingVenda, setLoadingVenda] = useState(true);
  const [comprador, setComprador] = useState('');
  const [valor, setValor] = useState('');
  const [entrada, setEntrada] = useState('');
  const [parcelasIniciaisValor, setParcelasIniciaisValor] = useState('');
  const [parcelasIniciaisQtd, setParcelasIniciaisQtd] = useState('');
  const [parcelasIniciaisVencimento, setParcelasIniciaisVencimento] = useState(addMonths(today(), 1));
  const [permuta, setPermuta] = useState('');
  const [valorPermuta, setValorPermuta] = useState('');
  const [statusPermuta, setStatusPermuta] = useState('1');
  const [parcelaValor, setParcelaValor] = useState('');
  const [parcelaVencimento, setParcelaVencimento] = useState(addMonths(today(), 1));
  const [parcelasGerar, setParcelasGerar] = useState('1');
  const [ordenacaoParcelas, setOrdenacaoParcelas] = useState('vencimentoAsc');
  const [editandoVenda, setEditandoVenda] = useState(false);
  const [vendaTipo, setVendaTipo] = useState('4');
  const [vendaComprador, setVendaComprador] = useState('');
  const [vendaValor, setVendaValor] = useState('');
  const [vendaData, setVendaData] = useState(today());
  const [error, setError] = useState('');
  useEffect(() => {
    setLoadingVenda(true);
    api<Venda>(`/api/obras/${obraId}/venda`, { silent: true })
      .then(setVenda)
      .catch(() => setVenda(null))
      .finally(() => setLoadingVenda(false));
  }, [obraId]);
  const temParcelamentoInicial = !isBlank(parcelasIniciaisValor) || !isBlank(parcelasIniciaisQtd);
  const parcelamentoInicialValido = !temParcelamentoInicial || (isPositive(parcelasIniciaisValor) && Number.isInteger(toNumber(parcelasIniciaisQtd)) && toNumber(parcelasIniciaisQtd) > 0 && !isBlank(parcelasIniciaisVencimento));
  const canCriarVenda = !isBlank(comprador) && isPositive(valor) && (isBlank(entrada) || (isNonNegative(entrada) && toNumber(entrada) <= toNumber(valor))) && parcelamentoInicialValido;
  const vendaValorNumerico = parseDecimalInput(vendaValor);
  const canSalvarVenda = venda !== null && !isBlank(vendaComprador) && Number.isFinite(vendaValorNumerico) && vendaValorNumerico > 0 && vendaValorNumerico >= venda.valorEntrada && !isBlank(vendaData);
  const canAddParcelas = isPositive(parcelaValor) && !isBlank(parcelaVencimento) && Number.isInteger(toNumber(parcelasGerar)) && toNumber(parcelasGerar) > 0;
  const canAddPermuta = !isBlank(permuta) && isPositive(valorPermuta);
  const parcelasOrdenadas = useMemo(() => {
    const parcelas = [...(venda?.parcelas ?? [])];
    parcelas.sort((a, b) => {
      if (ordenacaoParcelas === 'status') {
        const status = (ordemStatusParcela.get(a.status) ?? 99) - (ordemStatusParcela.get(b.status) ?? 99);
        return status || a.dataVencimento.localeCompare(b.dataVencimento) || a.numero - b.numero;
      }
      if (ordenacaoParcelas === 'vencimentoDesc') {
        return b.dataVencimento.localeCompare(a.dataVencimento) || a.numero - b.numero;
      }
      if (ordenacaoParcelas === 'numero') {
        return a.numero - b.numero;
      }
      return a.dataVencimento.localeCompare(b.dataVencimento) || a.numero - b.numero;
    });
    return parcelas;
  }, [venda?.parcelas, ordenacaoParcelas]);
  const totalParcelas = (venda?.parcelas ?? []).reduce((total, parcela) => total + parcela.valor, 0);
  const totalParcelasPagas = (venda?.parcelas ?? []).filter((parcela) => parcela.status === 2).reduce((total, parcela) => total + parcela.valor, 0);
  const totalParcelasAbertas = (venda?.parcelas ?? []).filter((parcela) => parcela.status === 1 || parcela.status === 3).reduce((total, parcela) => total + parcela.valor, 0);
  const totalPermutasRealizadas = (venda?.permutas ?? []).filter((item) => item.status !== 2).reduce((total, item) => total + item.valorEstimado, 0);
  const totalRecebidoOuRealizado = (venda?.valorEntrada ?? 0) + totalParcelasPagas + totalPermutasRealizadas;
  const progressoVenda = venda ? Math.min(100, Math.max(0, (totalRecebidoOuRealizado / venda.valorTotalNegociado) * 100)) : 0;
  const saldoVenda = venda ? Math.max(0, venda.valorTotalNegociado - totalRecebidoOuRealizado) : 0;
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
  function iniciarEdicaoVenda() {
    if (!venda) return;
    setVendaTipo(String(venda.tipo));
    setVendaComprador(venda.compradorNome);
    setVendaValor(String(venda.valorTotalNegociado));
    setVendaData(venda.dataVenda);
    setEditandoVenda(true);
  }
  async function salvarVenda() {
    if (!venda || !canSalvarVenda) return;
    const atualizada = await api<Venda>(`/api/obras/${obraId}/venda`, {
      method: 'PUT',
      body: JSON.stringify({
        tipo: Number(vendaTipo),
        valorTotalNegociado: vendaValorNumerico,
        dataVenda: vendaData,
        compradorNome: vendaComprador.trim()
      })
    });
    setVenda(atualizada);
    setEditandoVenda(false);
    void onDone();
  }
  async function addPermuta() {
    if (!venda) return;
    if (!canAddPermuta) {
      setError('Informe descricao e valor estimado da permuta.');
      return;
    }
    setError('');
    const novaPermuta = await api<Permuta>(`/api/vendas/${venda.id}/permutas`, { method: 'POST', body: JSON.stringify({ tipo: 1, descricao: permuta, valorEstimado: toNumber(valorPermuta), documentoReferencia: '', dataRecebimento: today(), status: Number(statusPermuta) }) });
    setPermuta('');
    setValorPermuta('');
    setStatusPermuta('1');
    setVenda((current) => current ? { ...current, permutas: [...current.permutas, novaPermuta] } : current);
    void onDone();
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
  async function cancelarParcela(parcelaId: string) {
    if (!confirmarAcao('Cancelar esta parcela? Ela deixara de contar como pendencia da venda.')) {
      return;
    }
    const parcela = await api<Parcela>(`/api/parcelas/${parcelaId}/cancelar`, { method: 'POST' });
    setVenda((current) => current
      ? { ...current, parcelas: current.parcelas.map((item) => item.id === parcela.id ? parcela : item) }
      : current);
    void onDone();
  }
  async function salvarParcela(parcelaId: string, valorAtualizado: number, dataVencimento: string) {
    const parcela = await api<Parcela>(`/api/parcelas/${parcelaId}`, {
      method: 'PUT',
      body: JSON.stringify({ valor: valorAtualizado, dataVencimento })
    });
    setVenda((current) => current
      ? { ...current, parcelas: current.parcelas.map((item) => item.id === parcela.id ? parcela : item) }
      : current);
    void onDone();
  }
  async function atualizarStatusPermuta(permutaId: string, status: number) {
    const atualizada = await api<Permuta>(`/api/permutas/${permutaId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    setVenda((current) => current
      ? { ...current, permutas: current.permutas.map((item) => item.id === atualizada.id ? atualizada : item) }
      : current);
    void onDone();
  }
  async function salvarPermuta(permutaAtualizada: Permuta) {
    const atualizada = await api<Permuta>(`/api/permutas/${permutaAtualizada.id}`, {
      method: 'PUT',
      body: JSON.stringify(permutaAtualizada)
    });
    setVenda((current) => current
      ? { ...current, permutas: current.permutas.map((item) => item.id === atualizada.id ? atualizada : item) }
      : current);
    void onDone();
  }
  function exportarParcelasCsv() {
    if (!venda) return;
    downloadCsv(
      `parcelas-${obraId}-${today()}.csv`,
      ['Numero', 'Vencimento', 'Valor', 'Status', 'DataPagamento'],
      parcelasOrdenadas.map((parcela) => [
        parcela.numero,
        parcela.dataVencimento,
        parcela.valor.toFixed(2).replace('.', ','),
        parcelaStatusLabel(parcela.status),
        parcela.dataPagamento ?? ''
      ])
    );
  }
  return (
    <Panel title="Venda, parcelas e permuta">
      {loadingVenda && !venda ? (
        <LoadingStrip />
      ) : !venda ? (
        <div className="grid gap-4">
          <section className="surface">
            <h3 className="section-title">Dados da venda</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <FormField label="Comprador">
                <input className="input" value={comprador} onChange={(e) => setComprador(e.target.value)} placeholder="Nome do comprador" />
              </FormField>
              <FormField label="Valor total">
                <input className="input" type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
              </FormField>
              <FormField label="Entrada">
                <input className="input" type="number" min="0" step="0.01" value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="0,00" />
              </FormField>
            </div>
          </section>
          <section className="surface">
            <h3 className="section-title">Parcelamento inicial</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <FormField label="Valor da parcela">
                <input className="input" type="number" min="0.01" step="0.01" value={parcelasIniciaisValor} onChange={(e) => setParcelasIniciaisValor(e.target.value)} placeholder="0,00" />
              </FormField>
              <FormField label="Quantidade">
                <input className="input" type="number" min="1" step="1" value={parcelasIniciaisQtd} onChange={(e) => setParcelasIniciaisQtd(e.target.value)} placeholder="Ex: 12" />
              </FormField>
              <FormField label="Primeiro vencimento">
                <input className="input" type="date" value={parcelasIniciaisVencimento} onChange={(e) => setParcelasIniciaisVencimento(e.target.value)} />
              </FormField>
            </div>
          </section>
          <div>
            {error && <ErrorText message={error} />}
            <button className="btn-primary mt-2 w-full sm:w-auto" disabled={!canCriarVenda} onClick={criar}>Registrar venda</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label={venda.compradorNome} value={money(venda.valorTotalNegociado)} />
            <Metric label="Entrada" value={money(venda.valorEntrada)} />
            <Metric label="Parcelas pendentes" value={String(venda.parcelas.filter((p) => p.status === 1 || p.status === 3).length)} />
          </div>
          <div className="surface">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-900">Resumo da venda</h3>
                  <StatusBadge label={vendaTipoLabel(venda.tipo)} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">Recebido, parcelas pagas e permutas realizadas sobre o valor negociado.</p>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[520px]">
                <div>
                  <div className="text-xs text-zinc-500">Realizado</div>
                  <div className="font-semibold">{money(totalRecebidoOuRealizado)}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">A receber</div>
                  <div className="font-semibold">{money(saldoVenda)}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Permutas</div>
                  <div className="font-semibold">{money(totalPermutasRealizadas)}</div>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-zinc-500">
                <span>Progresso financeiro</span>
                <span>{progressoVenda.toFixed(0)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${progressoVenda}%` }} />
              </div>
            </div>
          </div>
          {editandoVenda ? (
            <div className="surface grid gap-2 lg:grid-cols-[150px_1fr_150px_160px_auto_auto]">
              <select className="input" value={vendaTipo} onChange={(e) => setVendaTipo(e.target.value)}>
                <option value="1">Dinheiro</option>
                <option value="2">Parcelada</option>
                <option value="3">Permuta</option>
                <option value="4">Mista</option>
              </select>
              <input className="input" value={vendaComprador} onChange={(e) => setVendaComprador(e.target.value)} placeholder="Comprador" />
              <input className="input" value={vendaValor} onChange={(e) => setVendaValor(e.target.value)} placeholder="Valor total" />
              <input className="input" type="date" value={vendaData} onChange={(e) => setVendaData(e.target.value)} />
              <button className="btn-primary" type="button" disabled={!canSalvarVenda} onClick={salvarVenda}>Salvar</button>
              <button className="btn-secondary" type="button" onClick={() => setEditandoVenda(false)}>Cancelar</button>
            </div>
          ) : (
            <div className="surface flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-zinc-600">Venda em {venda.dataVenda}</div>
              <button className="btn-secondary" type="button" onClick={iniciarEdicaoVenda}>Editar venda</button>
            </div>
          )}
          <div className="surface">
            <h3 className="section-title">Adicionar parcelas</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <FormField label="Valor">
                <input className="input" type="number" min="0.01" step="0.01" value={parcelaValor} onChange={(e) => setParcelaValor(e.target.value)} placeholder="0,00" />
              </FormField>
              <FormField label="Primeiro vencimento">
                <input className="input" type="date" value={parcelaVencimento} onChange={(e) => setParcelaVencimento(e.target.value)} />
              </FormField>
              <FormField label="Quantidade">
                <input className="input" type="number" min="1" step="1" value={parcelasGerar} onChange={(e) => setParcelasGerar(e.target.value)} placeholder="Qtd." />
              </FormField>
              <button className="btn-secondary self-end" disabled={!canAddParcelas} onClick={addParcelas}>Gerar</button>
            </div>
          </div>
          <div className="surface flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-600">
              <span className="font-medium text-zinc-900">{parcelasOrdenadas.length} parcela(s)</span>
              <span className="ml-2">Aberto: {money(totalParcelasAbertas)}</span>
              <span className="ml-2">Total: {money(totalParcelas)}</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select className="input sm:w-64" value={ordenacaoParcelas} onChange={(e) => setOrdenacaoParcelas(e.target.value)} aria-label="Ordenar parcelas">
                <option value="vencimentoAsc">Vencimento mais proximo</option>
                <option value="vencimentoDesc">Vencimento mais distante</option>
                <option value="status">Status</option>
                <option value="numero">Numero da parcela</option>
              </select>
              <button className="btn-secondary" type="button" disabled={parcelasOrdenadas.length === 0} onClick={exportarParcelasCsv}>Exportar parcelas</button>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {['Parcela', 'Vencimento', 'Valor', 'Status', 'Acao'].map((header) => <th key={header} className="border-b border-zinc-200 py-2 font-medium text-zinc-500">{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {parcelasOrdenadas.map((parcela) => (
                  <ParcelaRow
                    key={parcela.id}
                    parcela={parcela}
                    onSave={salvarParcela}
                    onPay={pagarParcela}
                    onCancelInstallment={cancelarParcela}
                    onCancelPayment={cancelarPagamento}
                  />
                ))}
                {parcelasOrdenadas.length === 0 && <tr><td className="py-3 text-zinc-500" colSpan={5}>Nenhuma parcela cadastrada.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="surface">
            <h3 className="section-title">Adicionar permuta</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px_150px_auto]">
              <FormField label="Descricao">
                <input className="input" value={permuta} onChange={(e) => setPermuta(e.target.value)} placeholder="Descricao da permuta" />
              </FormField>
              <FormField label="Valor">
                <input className="input" type="number" min="0.01" step="0.01" value={valorPermuta} onChange={(e) => setValorPermuta(e.target.value)} placeholder="0,00" />
              </FormField>
              <FormField label="Status">
                <select className="input" value={statusPermuta} onChange={(e) => setStatusPermuta(e.target.value)}>
                  <option value="1">Recebida</option>
                  <option value="2">Pendente</option>
                  <option value="3">Vendida</option>
                </select>
              </FormField>
              <button className="btn-secondary self-end" disabled={!canAddPermuta} onClick={addPermuta}>Adicionar</button>
            </div>
          </div>
          {error && <ErrorText message={error} />}
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {['Permuta', 'Data', 'Valor', 'Status', 'Acao'].map((header) => <th key={header} className="border-b border-zinc-200 py-2 font-medium text-zinc-500">{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {venda.permutas.map((item) => (
                  <PermutaRow key={item.id} permuta={item} onSave={salvarPermuta} onStatusChange={atualizarStatusPermuta} />
                ))}
                {venda.permutas.length === 0 && <tr><td className="py-3 text-zinc-500" colSpan={5}>Nenhuma permuta cadastrada.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Encerramento({ obra, onDone }: { obra: Obra; onDone: () => void }) {
  const [pre, setPre] = useState<PreFechamento | null>(null);
  const [loading, setLoading] = useState(false);
  async function carregar() {
    setLoading(true);
    try {
      setPre(await api<PreFechamento>(`/api/obras/${obra.id}/pre-fechamento`, { silent: true }));
    } finally {
      setLoading(false);
    }
  }
  async function encerrar() {
    if (!confirmarAcao('Encerrar esta obra definitivamente? Depois disso nenhuma movimentacao financeira podera ser adicionada.')) {
      return;
    }
    setLoading(true);
    try {
      await api(`/api/obras/${obra.id}/encerrar`, { method: 'POST', body: JSON.stringify({ observacao: 'Encerrado pelo sistema' }) });
      await carregar();
      onDone();
    } finally {
      setLoading(false);
    }
  }
  return (
    <Panel title="Encerramento">
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <button className="btn-secondary" disabled={loading} onClick={carregar}>Gerar previa</button>
        <button className="btn-secondary" disabled={!pre} onClick={() => window.print()}>Imprimir</button>
        <button className="btn-primary" disabled={loading || !pre || pre.pendencias.length > 0 || obra.status === 4} onClick={encerrar}>Encerrar obra</button>
      </div>
      {loading && <LoadingStrip />}
      {!loading && !pre && <p className="text-sm text-zinc-500">Gere a previa para conferir totais, pendencias e distribuicao antes do encerramento.</p>}
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

function Panel({ title, description, actions, children }: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
          {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="mb-3 block text-sm"><span className="field-label">{label}</span><input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="field-label">{label}</span>{children}</label>;
}

function ErrorText({ message }: { message: string }) {
  return <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-sm">
      <div className="font-medium text-zinc-800">{title}</div>
      <div className="mt-1 text-zinc-500">{text}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2"><div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div><div className="mt-1 text-lg font-semibold text-zinc-950">{value}</div></div>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="mt-3 overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{headers.map((h) => <th key={h} className="border-b border-zinc-200 py-2 font-medium text-zinc-500">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border-b border-zinc-100 py-2">{cell}</td>)}</tr>)}</tbody></table></div>;
}

createRoot(document.getElementById('root')!).render(<App />);
