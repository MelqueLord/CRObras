using CRObras.Application.Abstractions;
using CRObras.Application.Common;
using CRObras.Application.Dashboard;
using CRObras.Application.Encerramento;
using CRObras.Application.Financeiro;
using CRObras.Application.Obras;
using CRObras.Application.Socios;
using CRObras.Application.Vendas;
using CRObras.Domain.Entities;
using CRObras.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CRObras.Application;

public sealed class CRObrasService(IAppDbContext db)
{
    public async Task<IReadOnlyCollection<ObraResponse>> ListarObrasAsync(ObraStatus? status, CancellationToken ct)
    {
        var query = db.Obras.AsNoTracking();
        if (status.HasValue)
        {
            query = query.Where(o => o.Status == status.Value);
        }

        var obras = await query.OrderBy(o => o.Nome).ToListAsync(ct);
        return obras.Select(ToObraResponse).ToList();
    }

    public async Task<ObraResponse> ObterObraAsync(Guid id, CancellationToken ct)
    {
        var obra = await db.Obras.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new ServiceException("Obra nao encontrada.");
        return ToObraResponse(obra);
    }

    public async Task<ObraResponse> CriarObraAsync(ObraRequest request, CancellationToken ct)
    {
        ValidarTexto(request.Nome, "Nome da obra");
        var obra = new Obra
        {
            Nome = request.Nome.Trim(),
            Descricao = request.Descricao,
            Endereco = request.Endereco,
            DataInicio = request.DataInicio,
            DataPrevistaConclusao = request.DataPrevistaConclusao,
            Status = request.Status == ObraStatus.Encerrada ? ObraStatus.Planejada : request.Status
        };

        db.Obras.Add(obra);
        await db.SaveChangesAsync(ct);
        return ToObraResponse(obra);
    }

    public async Task<ObraResponse> AtualizarObraAsync(Guid id, ObraRequest request, CancellationToken ct)
    {
        var obra = await BuscarObraAsync(id, ct);
        obra.GarantirAberta();
        ValidarTexto(request.Nome, "Nome da obra");

        obra.Nome = request.Nome.Trim();
        obra.Descricao = request.Descricao;
        obra.Endereco = request.Endereco;
        obra.DataInicio = request.DataInicio;
        obra.DataPrevistaConclusao = request.DataPrevistaConclusao;
        obra.Status = request.Status == ObraStatus.Encerrada ? obra.Status : request.Status;

        await db.SaveChangesAsync(ct);
        return ToObraResponse(obra);
    }

    public async Task<IReadOnlyCollection<SocioResponse>> ListarSociosAsync(CancellationToken ct)
    {
        var socios = await db.Socios.AsNoTracking().OrderBy(s => s.Nome).ToListAsync(ct);
        return socios.Select(ToSocioResponse).ToList();
    }

    public async Task<SocioResponse> CriarSocioAsync(SocioRequest request, CancellationToken ct)
    {
        ValidarTexto(request.Nome, "Nome do socio");
        var socio = new Socio
        {
            Nome = request.Nome.Trim(),
            Documento = request.Documento,
            Email = request.Email,
            Telefone = request.Telefone,
            Ativo = request.Ativo
        };

        db.Socios.Add(socio);
        await db.SaveChangesAsync(ct);
        return ToSocioResponse(socio);
    }

    public async Task<SocioResponse> AtualizarSocioAsync(Guid id, SocioRequest request, CancellationToken ct)
    {
        var socio = await db.Socios.FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new ServiceException("Socio nao encontrado.");
        ValidarTexto(request.Nome, "Nome do socio");

        socio.Nome = request.Nome.Trim();
        socio.Documento = request.Documento;
        socio.Email = request.Email;
        socio.Telefone = request.Telefone;
        socio.Ativo = request.Ativo;

        await db.SaveChangesAsync(ct);
        return ToSocioResponse(socio);
    }

    public async Task<SocioRemovalResponse> RemoverOuInativarSocioAsync(Guid id, CancellationToken ct)
    {
        var socio = await db.Socios.FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new ServiceException("Socio nao encontrado.");

        var possuiHistorico = await db.ObraSocios.AnyAsync(os => os.SocioId == id, ct)
            || await db.Aportes.AnyAsync(a => a.SocioId == id, ct)
            || await db.MovimentacoesFinanceiras.AnyAsync(m => m.SocioId == id, ct)
            || await db.DistribuicoesResultado.AnyAsync(d => d.SocioId == id, ct);

        if (possuiHistorico)
        {
            socio.Ativo = false;
            await db.SaveChangesAsync(ct);
            return new SocioRemovalResponse(id, "Inativado", "Socio possui historico e foi inativado.");
        }

        db.Socios.Remove(socio);
        await db.SaveChangesAsync(ct);
        return new SocioRemovalResponse(id, "Removido", "Socio sem uso foi removido.");
    }

    public async Task<IReadOnlyCollection<FornecedorResponse>> ListarFornecedoresAsync(CancellationToken ct)
    {
        var fornecedores = await db.Fornecedores.AsNoTracking().OrderBy(f => f.Nome).ToListAsync(ct);
        return fornecedores.Select(ToFornecedorResponse).ToList();
    }

    public async Task<FornecedorResponse> CriarFornecedorAsync(FornecedorRequest request, CancellationToken ct)
    {
        ValidarTexto(request.Nome, "Nome do fornecedor");
        var nome = request.Nome.Trim();
        var existe = await db.Fornecedores.AnyAsync(f => f.Nome.ToLower() == nome.ToLower(), ct);
        if (existe)
        {
            throw new ServiceException("Fornecedor ja cadastrado.");
        }

        var fornecedor = new Fornecedor
        {
            Nome = nome,
            Documento = request.Documento,
            Telefone = request.Telefone,
            Ativo = request.Ativo
        };

        db.Fornecedores.Add(fornecedor);
        await db.SaveChangesAsync(ct);
        return ToFornecedorResponse(fornecedor);
    }

    public async Task<FornecedorResponse> AtualizarFornecedorAsync(Guid id, FornecedorRequest request, CancellationToken ct)
    {
        var fornecedor = await db.Fornecedores.FirstOrDefaultAsync(f => f.Id == id, ct)
            ?? throw new ServiceException("Fornecedor nao encontrado.");
        ValidarTexto(request.Nome, "Nome do fornecedor");
        var nome = request.Nome.Trim();
        var existe = await db.Fornecedores.AnyAsync(f => f.Id != id && f.Nome.ToLower() == nome.ToLower(), ct);
        if (existe)
        {
            throw new ServiceException("Fornecedor ja cadastrado.");
        }

        fornecedor.Nome = nome;
        fornecedor.Documento = request.Documento;
        fornecedor.Telefone = request.Telefone;
        fornecedor.Ativo = request.Ativo;

        await db.SaveChangesAsync(ct);
        return ToFornecedorResponse(fornecedor);
    }

    public async Task<IReadOnlyCollection<ObraSocioResponse>> ListarSociosDaObraAsync(Guid obraId, CancellationToken ct)
    {
        await GarantirObraExisteAsync(obraId, ct);
        return await db.ObraSocios.AsNoTracking()
            .Include(os => os.Socio)
            .Where(os => os.ObraId == obraId)
            .OrderBy(os => os.Socio.Nome)
            .Select(os => new ObraSocioResponse(os.Id, os.SocioId, os.Socio.Nome, os.PercentualParticipacao, os.Observacao))
            .ToListAsync(ct);
    }

    public async Task<ObraSocioResponse> VincularSocioAsync(Guid obraId, ObraSocioRequest request, CancellationToken ct)
    {
        var obra = await BuscarObraAsync(obraId, ct);
        obra.GarantirAberta();
        ValidarPercentual(request.PercentualParticipacao);

        var socio = await db.Socios.FirstOrDefaultAsync(s => s.Id == request.SocioId && s.Ativo, ct)
            ?? throw new ServiceException("Socio ativo nao encontrado.");
        var existe = await db.ObraSocios.AnyAsync(os => os.ObraId == obraId && os.SocioId == request.SocioId, ct);
        if (existe)
        {
            throw new ServiceException("Socio ja vinculado a obra.");
        }

        var vinculo = new ObraSocio
        {
            ObraId = obraId,
            SocioId = request.SocioId,
            PercentualParticipacao = request.PercentualParticipacao,
            Observacao = request.Observacao
        };

        db.ObraSocios.Add(vinculo);
        await db.SaveChangesAsync(ct);
        return new ObraSocioResponse(vinculo.Id, socio.Id, socio.Nome, vinculo.PercentualParticipacao, vinculo.Observacao);
    }

    public async Task<ObraSocioResponse> AtualizarSocioDaObraAsync(Guid obraId, Guid socioId, ObraSocioRequest request, CancellationToken ct)
    {
        var obra = await BuscarObraAsync(obraId, ct);
        obra.GarantirAberta();
        ValidarPercentual(request.PercentualParticipacao);

        var vinculo = await db.ObraSocios.Include(os => os.Socio).FirstOrDefaultAsync(os => os.ObraId == obraId && os.SocioId == socioId, ct)
            ?? throw new ServiceException("Vinculo de socio nao encontrado.");
        vinculo.PercentualParticipacao = request.PercentualParticipacao;
        vinculo.Observacao = request.Observacao;

        await db.SaveChangesAsync(ct);
        return new ObraSocioResponse(vinculo.Id, vinculo.SocioId, vinculo.Socio.Nome, vinculo.PercentualParticipacao, vinculo.Observacao);
    }

    public async Task<MovimentacaoResponse> RegistrarAporteAsync(Guid obraId, AporteRequest request, CancellationToken ct)
    {
        var obra = await BuscarObraAsync(obraId, ct);
        obra.GarantirAberta();
        ValidarValor(request.Valor);

        var participante = await db.ObraSocios.AnyAsync(os => os.ObraId == obraId && os.SocioId == request.SocioId, ct);
        if (!participante)
        {
            throw new ServiceException("Aporte exige socio participante da obra.");
        }

        var mov = new MovimentacaoFinanceira
        {
            ObraId = obraId,
            Tipo = TipoMovimentacao.Aporte,
            Categoria = "Aporte",
            Valor = request.Valor,
            DataMovimentacao = request.DataAporte,
            Descricao = string.IsNullOrWhiteSpace(request.Descricao) ? "Aporte de socio" : request.Descricao.Trim(),
            SocioId = request.SocioId
        };
        db.MovimentacoesFinanceiras.Add(mov);
        db.Aportes.Add(new Aporte { ObraId = obraId, SocioId = request.SocioId, MovimentacaoFinanceira = mov, Valor = request.Valor, DataAporte = request.DataAporte });
        obra.SaldoAtual += request.Valor;

        await db.SaveChangesAsync(ct);
        return ToMovimentacaoResponse(mov);
    }

    public async Task<MovimentacaoResponse> RegistrarDespesaAsync(Guid obraId, DespesaRequest request, CancellationToken ct)
    {
        var obra = await BuscarObraAsync(obraId, ct);
        obra.GarantirAberta();
        ValidarValor(request.Valor);
        ValidarTexto(request.Descricao, "Descricao da despesa");

        var mov = new MovimentacaoFinanceira
        {
            ObraId = obraId,
            Tipo = TipoMovimentacao.Despesa,
            Categoria = request.Categoria.ToString(),
            Valor = request.Valor,
            DataMovimentacao = request.DataDespesa,
            Descricao = request.Descricao.Trim()
        };
        db.MovimentacoesFinanceiras.Add(mov);
        db.Despesas.Add(new Despesa { ObraId = obraId, MovimentacaoFinanceira = mov, Categoria = request.Categoria, Fornecedor = request.Fornecedor, DocumentoFiscal = request.DocumentoFiscal });
        obra.SaldoAtual -= request.Valor;

        await db.SaveChangesAsync(ct);
        return ToMovimentacaoResponse(mov);
    }

    public async Task<IReadOnlyCollection<MovimentacaoResponse>> ListarMovimentacoesAsync(Guid obraId, CancellationToken ct)
    {
        await GarantirObraExisteAsync(obraId, ct);
        var movimentacoes = await db.MovimentacoesFinanceiras.AsNoTracking()
            .Where(m => m.ObraId == obraId)
            .OrderByDescending(m => m.DataMovimentacao)
            .ThenByDescending(m => m.CriadoEm)
            .ToListAsync(ct);
        return movimentacoes.Select(ToMovimentacaoResponse).ToList();
    }

    public async Task<MovimentacaoResponse> CancelarMovimentacaoAsync(Guid obraId, Guid movimentacaoId, CancellationToken ct)
    {
        var obra = await BuscarObraAsync(obraId, ct);
        obra.GarantirAberta();
        var mov = await db.MovimentacoesFinanceiras.FirstOrDefaultAsync(m => m.Id == movimentacaoId && m.ObraId == obraId, ct)
            ?? throw new ServiceException("Movimentacao nao encontrada.");
        if (mov.Status == StatusMovimentacao.Cancelada)
        {
            return ToMovimentacaoResponse(mov);
        }

        if (mov.ParcelaReceberId.HasValue)
        {
            throw new ServiceException("Use o cancelamento de pagamento da parcela para esta movimentacao.");
        }

        obra.SaldoAtual -= mov.EfeitoNoSaldo();
        mov.Status = StatusMovimentacao.Cancelada;

        await db.SaveChangesAsync(ct);
        return ToMovimentacaoResponse(mov);
    }

    public async Task<VendaResponse> CriarVendaAsync(Guid obraId, CriarVendaRequest request, CancellationToken ct)
    {
        var obra = await BuscarObraAsync(obraId, ct);
        obra.GarantirAberta();
        ValidarTexto(request.CompradorNome, "Nome do comprador");
        ValidarValor(request.ValorTotalNegociado);
        if (request.ValorEntrada < 0)
        {
            throw new ServiceException("Valor de entrada nao pode ser negativo.");
        }
        if (await db.Vendas.AnyAsync(v => v.ObraId == obraId && v.Status != StatusVenda.Cancelada, ct))
        {
            throw new ServiceException("MVP permite apenas uma venda ativa por obra.");
        }

        var venda = new Venda
        {
            ObraId = obraId,
            Tipo = request.Tipo,
            ValorTotalNegociado = request.ValorTotalNegociado,
            ValorEntrada = request.ValorEntrada,
            DataVenda = request.DataVenda,
            CompradorNome = request.CompradorNome.Trim(),
            CompradorDocumento = request.CompradorDocumento,
            Observacao = request.Observacao
        };
        db.Vendas.Add(venda);

        if (request.ValorEntrada > 0)
        {
            db.MovimentacoesFinanceiras.Add(new MovimentacaoFinanceira
            {
                ObraId = obraId,
                Tipo = TipoMovimentacao.RecebimentoVenda,
                Categoria = "EntradaVenda",
                Valor = request.ValorEntrada,
                DataMovimentacao = request.DataVenda,
                Descricao = $"Entrada da venda para {venda.CompradorNome}"
            });
            obra.SaldoAtual += request.ValorEntrada;
        }

        foreach (var parcela in request.Parcelas.OrderBy(p => p.Numero))
        {
            ValidarValor(parcela.Valor);
            venda.Parcelas.Add(new ParcelaReceber
            {
                ObraId = obraId,
                Numero = parcela.Numero,
                Valor = parcela.Valor,
                DataVencimento = parcela.DataVencimento
            });
        }

        obra.Status = ObraStatus.Vendida;
        await db.SaveChangesAsync(ct);
        return await ObterVendaPorObraAsync(obraId, ct);
    }

    public async Task<VendaResponse> ObterVendaPorObraAsync(Guid obraId, CancellationToken ct)
    {
        var venda = await db.Vendas.AsNoTracking()
            .Include(v => v.Parcelas)
            .Include(v => v.Permutas)
            .FirstOrDefaultAsync(v => v.ObraId == obraId && v.Status != StatusVenda.Cancelada, ct)
            ?? throw new ServiceException("Venda nao encontrada.");
        return ToVendaResponse(venda);
    }

    public async Task<IReadOnlyCollection<ParcelaResponse>> AdicionarParcelasAsync(Guid vendaId, IReadOnlyCollection<ParcelaRequest> parcelas, CancellationToken ct)
    {
        var venda = await db.Vendas.Include(v => v.Obra).Include(v => v.Parcelas).FirstOrDefaultAsync(v => v.Id == vendaId, ct)
            ?? throw new ServiceException("Venda nao encontrada.");
        venda.Obra.GarantirAberta();

        foreach (var parcela in parcelas)
        {
            ValidarValor(parcela.Valor);
            if (venda.Parcelas.Any(p => p.Numero == parcela.Numero))
            {
                throw new ServiceException($"Parcela {parcela.Numero} ja existe.");
            }

            venda.Parcelas.Add(new ParcelaReceber { ObraId = venda.ObraId, Numero = parcela.Numero, Valor = parcela.Valor, DataVencimento = parcela.DataVencimento });
        }

        await db.SaveChangesAsync(ct);
        return venda.Parcelas.OrderBy(p => p.Numero).Select(ToParcelaResponse).ToList();
    }

    public async Task<ParcelaResponse> PagarParcelaAsync(Guid parcelaId, PagarParcelaRequest request, CancellationToken ct)
    {
        var parcela = await db.ParcelasReceber.Include(p => p.Obra).FirstOrDefaultAsync(p => p.Id == parcelaId, ct)
            ?? throw new ServiceException("Parcela nao encontrada.");
        parcela.Obra.GarantirAberta();
        if (parcela.Status == StatusParcela.Paga)
        {
            throw new ServiceException("Parcela ja paga.");
        }

        var mov = new MovimentacaoFinanceira
        {
            ObraId = parcela.ObraId,
            Tipo = TipoMovimentacao.RecebimentoVenda,
            Categoria = "ParcelaVenda",
            Valor = parcela.Valor,
            DataMovimentacao = request.DataPagamento,
            Descricao = $"Pagamento da parcela {parcela.Numero}",
            ParcelaReceber = parcela
        };
        db.MovimentacoesFinanceiras.Add(mov);
        parcela.Status = StatusParcela.Paga;
        parcela.DataPagamento = request.DataPagamento;
        parcela.MovimentacaoFinanceira = mov;
        parcela.Obra.SaldoAtual += parcela.Valor;

        await AtualizarStatusVendaAsync(parcela.VendaId, ct);
        await db.SaveChangesAsync(ct);
        return ToParcelaResponse(parcela);
    }

    public async Task<ParcelaResponse> CancelarPagamentoParcelaAsync(Guid parcelaId, CancellationToken ct)
    {
        var parcela = await db.ParcelasReceber.Include(p => p.Obra).Include(p => p.MovimentacaoFinanceira).FirstOrDefaultAsync(p => p.Id == parcelaId, ct)
            ?? throw new ServiceException("Parcela nao encontrada.");
        parcela.Obra.GarantirAberta();
        if (parcela.Status != StatusParcela.Paga || parcela.MovimentacaoFinanceira is null)
        {
            throw new ServiceException("Parcela nao possui pagamento para cancelar.");
        }

        parcela.Obra.SaldoAtual -= parcela.Valor;
        parcela.MovimentacaoFinanceira.Status = StatusMovimentacao.Cancelada;
        parcela.Status = StatusParcela.Pendente;
        parcela.DataPagamento = null;
        parcela.MovimentacaoFinanceiraId = null;

        await AtualizarStatusVendaAsync(parcela.VendaId, ct);
        await db.SaveChangesAsync(ct);
        return ToParcelaResponse(parcela);
    }

    public async Task<PermutaResponse> AdicionarPermutaAsync(Guid vendaId, PermutaRequest request, CancellationToken ct)
    {
        var venda = await db.Vendas.Include(v => v.Obra).FirstOrDefaultAsync(v => v.Id == vendaId, ct)
            ?? throw new ServiceException("Venda nao encontrada.");
        venda.Obra.GarantirAberta();
        ValidarTexto(request.Descricao, "Descricao da permuta");
        ValidarValor(request.ValorEstimado);

        var permuta = new AtivoPermuta
        {
            VendaId = vendaId,
            ObraId = venda.ObraId,
            Tipo = request.Tipo,
            Descricao = request.Descricao.Trim(),
            ValorEstimado = request.ValorEstimado,
            DocumentoReferencia = request.DocumentoReferencia,
            DataRecebimento = request.DataRecebimento,
            Status = request.Status
        };
        db.AtivosPermuta.Add(permuta);

        await AtualizarStatusVendaAsync(venda.Id, ct);
        await db.SaveChangesAsync(ct);
        return ToPermutaResponse(permuta);
    }

    public async Task<ResumoFinanceiroResponse> ObterResumoFinanceiroAsync(Guid obraId, CancellationToken ct)
    {
        var obra = await BuscarObraAsync(obraId, ct);
        var totais = await CalcularTotaisAsync(obraId, ct);
        return new ResumoFinanceiroResponse(obra.SaldoAtual, totais.TotalInvestido, totais.TotalGasto, totais.TotalRecebido, totais.ValorPermutasEstimado, totais.ResultadoFinanceiro);
    }

    public async Task<PreFechamentoResponse> ObterPreFechamentoAsync(Guid obraId, CancellationToken ct)
    {
        var obra = await db.Obras.AsNoTracking().FirstOrDefaultAsync(o => o.Id == obraId, ct)
            ?? throw new ServiceException("Obra nao encontrada.");
        var socios = await db.ObraSocios.AsNoTracking().Include(os => os.Socio).Where(os => os.ObraId == obraId).ToListAsync(ct);
        var totais = await CalcularTotaisAsync(obraId, ct);
        var pendencias = await ValidarPendenciasFechamentoAsync(obraId, socios, ct);
        var distribuicoes = await CalcularDistribuicoesAsync(obraId, totais.ResultadoFinanceiro, socios, ct);
        return new PreFechamentoResponse(totais.TotalInvestido, totais.TotalGasto, totais.TotalRecebido, totais.ValorPermutasEstimado, totais.ResultadoFinanceiro, obra.SaldoAtual, pendencias, distribuicoes);
    }

    public async Task<EncerramentoResponse> EncerrarObraAsync(Guid obraId, EncerrarObraRequest request, CancellationToken ct)
    {
        var obra = await BuscarObraAsync(obraId, ct);
        obra.GarantirAberta();
        if (await db.EncerramentosObra.AnyAsync(e => e.ObraId == obraId, ct))
        {
            throw new ServiceException("Obra ja possui encerramento.");
        }

        var socios = await db.ObraSocios.Include(os => os.Socio).Where(os => os.ObraId == obraId).ToListAsync(ct);
        var pendencias = await ValidarPendenciasFechamentoAsync(obraId, socios, ct);
        if (pendencias.Count > 0)
        {
            throw new ServiceException("Nao e possivel encerrar: " + string.Join(" ", pendencias));
        }

        var totais = await CalcularTotaisAsync(obraId, ct);
        var distribuicoes = await CalcularDistribuicoesAsync(obraId, totais.ResultadoFinanceiro, socios, ct);
        var encerramento = new EncerramentoObra
        {
            ObraId = obraId,
            TotalInvestido = totais.TotalInvestido,
            TotalGasto = totais.TotalGasto,
            TotalRecebido = totais.TotalRecebido,
            ValorPermutasEstimado = totais.ValorPermutasEstimado,
            ResultadoFinanceiro = totais.ResultadoFinanceiro,
            Observacao = request.Observacao
        };

        foreach (var item in distribuicoes)
        {
            encerramento.Distribuicoes.Add(new DistribuicaoResultado
            {
                SocioId = item.SocioId,
                PercentualParticipacao = item.PercentualParticipacao,
                ValorInvestido = item.ValorInvestido,
                ValorResultado = item.ValorResultado,
                ValorAReceberOuPagar = item.ValorAReceberOuPagar
            });
        }

        db.EncerramentosObra.Add(encerramento);
        obra.Status = ObraStatus.Encerrada;
        obra.DataEncerramento = encerramento.DataEncerramento;
        await db.SaveChangesAsync(ct);

        return new EncerramentoResponse(encerramento.Id, obraId, encerramento.TotalInvestido, encerramento.TotalGasto, encerramento.TotalRecebido, encerramento.ValorPermutasEstimado, encerramento.ResultadoFinanceiro, encerramento.DataEncerramento, distribuicoes);
    }

    public async Task<DashboardResumoResponse> ObterDashboardAsync(CancellationToken ct)
    {
        var obras = await db.Obras.AsNoTracking().OrderBy(o => o.Nome).ToListAsync(ct);
        var resumoObras = new List<DashboardObraResumo>();
        decimal totalInvestido = 0;
        decimal totalGasto = 0;
        decimal totalRecebido = 0;

        foreach (var obra in obras)
        {
            var totais = await CalcularTotaisAsync(obra.Id, ct);
            totalInvestido += totais.TotalInvestido;
            totalGasto += totais.TotalGasto;
            totalRecebido += totais.TotalRecebido;
            resumoObras.Add(new DashboardObraResumo(obra.Id, obra.Nome, obra.Status.ToString(), obra.SaldoAtual, totais.TotalInvestido, totais.TotalGasto, totais.TotalRecebido));
        }

        return new DashboardResumoResponse(obras.Sum(o => o.SaldoAtual), totalInvestido, totalGasto, totalRecebido, obras.Count(o => o.Status != ObraStatus.Encerrada && o.Status != ObraStatus.Cancelada), obras.Count(o => o.Status == ObraStatus.Encerrada), resumoObras);
    }

    public async Task<IReadOnlyCollection<ParcelaPendenteResponse>> ListarParcelasPendentesAsync(CancellationToken ct)
    {
        var hoje = DateOnlyExtensions.Today();
        return await db.ParcelasReceber.AsNoTracking()
            .Include(p => p.Obra)
            .Where(p => p.Status == StatusParcela.Pendente || p.Status == StatusParcela.Vencida)
            .OrderBy(p => p.DataVencimento)
            .Select(p => new ParcelaPendenteResponse(p.Id, p.ObraId, p.Obra.Nome, p.Numero, p.Valor, p.DataVencimento, p.DataVencimento < hoje ? "Vencida" : p.Status.ToString()))
            .ToListAsync(ct);
    }

    private async Task<Obra> BuscarObraAsync(Guid obraId, CancellationToken ct)
    {
        return await db.Obras.FirstOrDefaultAsync(o => o.Id == obraId, ct)
            ?? throw new ServiceException("Obra nao encontrada.");
    }

    private async Task GarantirObraExisteAsync(Guid obraId, CancellationToken ct)
    {
        if (!await db.Obras.AnyAsync(o => o.Id == obraId, ct))
        {
            throw new ServiceException("Obra nao encontrada.");
        }
    }

    private async Task AtualizarStatusVendaAsync(Guid vendaId, CancellationToken ct)
    {
        var venda = await db.Vendas.Include(v => v.Parcelas).Include(v => v.Permutas).FirstOrDefaultAsync(v => v.Id == vendaId, ct);
        if (venda is null || venda.Status == StatusVenda.Cancelada)
        {
            return;
        }

        var parcelasOk = venda.Parcelas.All(p => p.Status == StatusParcela.Paga || p.Status == StatusParcela.Cancelada);
        var permutasOk = venda.Permutas.All(p => p.Status != StatusAtivoPermuta.Pendente);
        venda.Status = parcelasOk && permutasOk ? StatusVenda.Quitada : StatusVenda.Aberta;
    }

    private async Task<TotaisObra> CalcularTotaisAsync(Guid obraId, CancellationToken ct)
    {
        var movs = await db.MovimentacoesFinanceiras.AsNoTracking()
            .Where(m => m.ObraId == obraId && m.Status == StatusMovimentacao.Confirmada)
            .ToListAsync(ct);
        var permutas = await db.AtivosPermuta.AsNoTracking()
            .Where(p => p.ObraId == obraId && p.Status != StatusAtivoPermuta.Pendente)
            .SumAsync(p => p.ValorEstimado, ct);

        var totalInvestido = movs.Where(m => m.Tipo == TipoMovimentacao.Aporte).Sum(m => m.Valor);
        var totalGasto = movs.Where(m => m.Tipo == TipoMovimentacao.Despesa).Sum(m => m.Valor);
        var totalRecebido = movs.Where(m => m.Tipo == TipoMovimentacao.RecebimentoVenda).Sum(m => m.Valor);
        return new TotaisObra(totalInvestido, totalGasto, totalRecebido, permutas, totalRecebido + permutas - totalGasto);
    }

    private async Task<IReadOnlyCollection<DistribuicaoResponse>> CalcularDistribuicoesAsync(Guid obraId, decimal resultadoFinanceiro, IReadOnlyCollection<ObraSocio> socios, CancellationToken ct)
    {
        var aportes = await db.Aportes.AsNoTracking()
            .Where(a => a.ObraId == obraId && a.MovimentacaoFinanceira.Status == StatusMovimentacao.Confirmada)
            .GroupBy(a => a.SocioId)
            .Select(g => new { SocioId = g.Key, Valor = g.Sum(a => a.Valor) })
            .ToListAsync(ct);

        return socios.OrderBy(s => s.Socio.Nome).Select(os =>
        {
            var investido = aportes.FirstOrDefault(a => a.SocioId == os.SocioId)?.Valor ?? 0;
            var valorResultado = decimal.Round(resultadoFinanceiro * os.PercentualParticipacao / 100, 2, MidpointRounding.AwayFromZero);
            return new DistribuicaoResponse(os.SocioId, os.Socio.Nome, os.PercentualParticipacao, investido, valorResultado, investido + valorResultado);
        }).ToList();
    }

    private async Task<List<string>> ValidarPendenciasFechamentoAsync(Guid obraId, IReadOnlyCollection<ObraSocio> socios, CancellationToken ct)
    {
        var pendencias = new List<string>();
        var somaParticipacao = socios.Sum(s => s.PercentualParticipacao);
        if (socios.Count == 0)
        {
            pendencias.Add("A obra precisa ter socios vinculados.");
        }
        if (somaParticipacao != 100)
        {
            pendencias.Add("A soma das participacoes deve ser 100%.");
        }
        if (await db.ParcelasReceber.AnyAsync(p => p.ObraId == obraId && (p.Status == StatusParcela.Pendente || p.Status == StatusParcela.Vencida), ct))
        {
            pendencias.Add("Existem parcelas pendentes.");
        }
        if (await db.AtivosPermuta.AnyAsync(p => p.ObraId == obraId && p.Status == StatusAtivoPermuta.Pendente, ct))
        {
            pendencias.Add("Existem permutas pendentes.");
        }

        return pendencias;
    }

    private static ObraResponse ToObraResponse(Obra obra) => new(obra.Id, obra.Nome, obra.Descricao, obra.Endereco, obra.DataInicio, obra.DataPrevistaConclusao, obra.Status, obra.SaldoAtual, obra.DataEncerramento);
    private static SocioResponse ToSocioResponse(Socio socio) => new(socio.Id, socio.Nome, socio.Documento, socio.Email, socio.Telefone, socio.Ativo);
    private static FornecedorResponse ToFornecedorResponse(Fornecedor fornecedor) => new(fornecedor.Id, fornecedor.Nome, fornecedor.Documento, fornecedor.Telefone, fornecedor.Ativo);
    private static MovimentacaoResponse ToMovimentacaoResponse(MovimentacaoFinanceira mov) => new(mov.Id, mov.ObraId, mov.Tipo, mov.Categoria, mov.Valor, mov.DataMovimentacao, mov.Descricao, mov.SocioId, mov.ParcelaReceberId, mov.Status, mov.CriadoEm);
    private static ParcelaResponse ToParcelaResponse(ParcelaReceber parcela) => new(parcela.Id, parcela.Numero, parcela.Valor, parcela.DataVencimento, parcela.DataPagamento, parcela.Status);
    private static PermutaResponse ToPermutaResponse(AtivoPermuta permuta) => new(permuta.Id, permuta.Tipo, permuta.Descricao, permuta.ValorEstimado, permuta.DataRecebimento, permuta.Status);
    private static VendaResponse ToVendaResponse(Venda venda) => new(venda.Id, venda.ObraId, venda.Tipo, venda.ValorTotalNegociado, venda.ValorEntrada, venda.DataVenda, venda.CompradorNome, venda.Status, venda.Parcelas.OrderBy(p => p.Numero).Select(ToParcelaResponse).ToList(), venda.Permutas.OrderBy(p => p.Descricao).Select(ToPermutaResponse).ToList());

    private static void ValidarTexto(string? value, string campo)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ServiceException($"{campo} e obrigatorio.");
        }
    }

    private static void ValidarValor(decimal valor)
    {
        if (valor <= 0)
        {
            throw new ServiceException("Valor deve ser maior que zero.");
        }
    }

    private static void ValidarPercentual(decimal percentual)
    {
        if (percentual < 0 || percentual > 100)
        {
            throw new ServiceException("Percentual deve estar entre 0 e 100.");
        }
    }

    private sealed record TotaisObra(decimal TotalInvestido, decimal TotalGasto, decimal TotalRecebido, decimal ValorPermutasEstimado, decimal ResultadoFinanceiro);
}
