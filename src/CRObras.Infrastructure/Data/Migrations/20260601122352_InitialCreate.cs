using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CRObras.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "obras",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Endereco = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataPrevistaConclusao = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    SaldoAtual = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DataEncerramento = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_obras", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "socios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Documento = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Email = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    Telefone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_socios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "encerramentos_obra",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ObraId = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalInvestido = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalGasto = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalRecebido = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ValorPermutasEstimado = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ResultadoFinanceiro = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DataEncerramento = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Observacao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_encerramentos_obra", x => x.Id);
                    table.ForeignKey(
                        name: "FK_encerramentos_obra_obras_ObraId",
                        column: x => x.ObraId,
                        principalTable: "obras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vendas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ObraId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    ValorTotalNegociado = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ValorEntrada = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DataVenda = table.Column<DateOnly>(type: "date", nullable: false),
                    CompradorNome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    CompradorDocumento = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Observacao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vendas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_vendas_obras_ObraId",
                        column: x => x.ObraId,
                        principalTable: "obras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "role_claims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_claims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_role_claims_roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "movimentacoes_financeiras",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ObraId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Categoria = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DataMovimentacao = table.Column<DateOnly>(type: "date", nullable: false),
                    Descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SocioId = table.Column<Guid>(type: "uuid", nullable: true),
                    ParcelaReceberId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CriadoEm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movimentacoes_financeiras", x => x.Id);
                    table.ForeignKey(
                        name: "FK_movimentacoes_financeiras_obras_ObraId",
                        column: x => x.ObraId,
                        principalTable: "obras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_movimentacoes_financeiras_socios_SocioId",
                        column: x => x.SocioId,
                        principalTable: "socios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "obra_socios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ObraId = table.Column<Guid>(type: "uuid", nullable: false),
                    SocioId = table.Column<Guid>(type: "uuid", nullable: false),
                    PercentualParticipacao = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    Observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_obra_socios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_obra_socios_obras_ObraId",
                        column: x => x.ObraId,
                        principalTable: "obras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_obra_socios_socios_SocioId",
                        column: x => x.SocioId,
                        principalTable: "socios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_claims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_claims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_claims_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_logins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_logins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_user_logins_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_roles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_user_roles_roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_roles_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_tokens",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_tokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_user_tokens_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "distribuicoes_resultado",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EncerramentoObraId = table.Column<Guid>(type: "uuid", nullable: false),
                    SocioId = table.Column<Guid>(type: "uuid", nullable: false),
                    PercentualParticipacao = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    ValorInvestido = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ValorResultado = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ValorAReceberOuPagar = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_distribuicoes_resultado", x => x.Id);
                    table.ForeignKey(
                        name: "FK_distribuicoes_resultado_encerramentos_obra_EncerramentoObra~",
                        column: x => x.EncerramentoObraId,
                        principalTable: "encerramentos_obra",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_distribuicoes_resultado_socios_SocioId",
                        column: x => x.SocioId,
                        principalTable: "socios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ativos_permuta",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VendaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ObraId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ValorEstimado = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DocumentoReferencia = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    DataRecebimento = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ativos_permuta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ativos_permuta_obras_ObraId",
                        column: x => x.ObraId,
                        principalTable: "obras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ativos_permuta_vendas_VendaId",
                        column: x => x.VendaId,
                        principalTable: "vendas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "aportes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ObraId = table.Column<Guid>(type: "uuid", nullable: false),
                    SocioId = table.Column<Guid>(type: "uuid", nullable: false),
                    MovimentacaoFinanceiraId = table.Column<Guid>(type: "uuid", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DataAporte = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_aportes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_aportes_movimentacoes_financeiras_MovimentacaoFinanceiraId",
                        column: x => x.MovimentacaoFinanceiraId,
                        principalTable: "movimentacoes_financeiras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_aportes_obras_ObraId",
                        column: x => x.ObraId,
                        principalTable: "obras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_aportes_socios_SocioId",
                        column: x => x.SocioId,
                        principalTable: "socios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "despesas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ObraId = table.Column<Guid>(type: "uuid", nullable: false),
                    MovimentacaoFinanceiraId = table.Column<Guid>(type: "uuid", nullable: false),
                    Categoria = table.Column<int>(type: "integer", nullable: false),
                    Fornecedor = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    DocumentoFiscal = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_despesas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_despesas_movimentacoes_financeiras_MovimentacaoFinanceiraId",
                        column: x => x.MovimentacaoFinanceiraId,
                        principalTable: "movimentacoes_financeiras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_despesas_obras_ObraId",
                        column: x => x.ObraId,
                        principalTable: "obras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "parcelas_receber",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VendaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ObraId = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<int>(type: "integer", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DataVencimento = table.Column<DateOnly>(type: "date", nullable: false),
                    DataPagamento = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    MovimentacaoFinanceiraId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parcelas_receber", x => x.Id);
                    table.ForeignKey(
                        name: "FK_parcelas_receber_movimentacoes_financeiras_MovimentacaoFina~",
                        column: x => x.MovimentacaoFinanceiraId,
                        principalTable: "movimentacoes_financeiras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_parcelas_receber_obras_ObraId",
                        column: x => x.ObraId,
                        principalTable: "obras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_parcelas_receber_vendas_VendaId",
                        column: x => x.VendaId,
                        principalTable: "vendas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_aportes_MovimentacaoFinanceiraId",
                table: "aportes",
                column: "MovimentacaoFinanceiraId");

            migrationBuilder.CreateIndex(
                name: "IX_aportes_ObraId",
                table: "aportes",
                column: "ObraId");

            migrationBuilder.CreateIndex(
                name: "IX_aportes_SocioId",
                table: "aportes",
                column: "SocioId");

            migrationBuilder.CreateIndex(
                name: "IX_ativos_permuta_ObraId_Status",
                table: "ativos_permuta",
                columns: new[] { "ObraId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ativos_permuta_VendaId",
                table: "ativos_permuta",
                column: "VendaId");

            migrationBuilder.CreateIndex(
                name: "IX_despesas_MovimentacaoFinanceiraId",
                table: "despesas",
                column: "MovimentacaoFinanceiraId");

            migrationBuilder.CreateIndex(
                name: "IX_despesas_ObraId",
                table: "despesas",
                column: "ObraId");

            migrationBuilder.CreateIndex(
                name: "IX_distribuicoes_resultado_EncerramentoObraId",
                table: "distribuicoes_resultado",
                column: "EncerramentoObraId");

            migrationBuilder.CreateIndex(
                name: "IX_distribuicoes_resultado_SocioId",
                table: "distribuicoes_resultado",
                column: "SocioId");

            migrationBuilder.CreateIndex(
                name: "IX_encerramentos_obra_ObraId",
                table: "encerramentos_obra",
                column: "ObraId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_financeiras_ObraId_DataMovimentacao",
                table: "movimentacoes_financeiras",
                columns: new[] { "ObraId", "DataMovimentacao" });

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_financeiras_ObraId_Tipo",
                table: "movimentacoes_financeiras",
                columns: new[] { "ObraId", "Tipo" });

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_financeiras_SocioId",
                table: "movimentacoes_financeiras",
                column: "SocioId");

            migrationBuilder.CreateIndex(
                name: "IX_obra_socios_ObraId_SocioId",
                table: "obra_socios",
                columns: new[] { "ObraId", "SocioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_obra_socios_SocioId",
                table: "obra_socios",
                column: "SocioId");

            migrationBuilder.CreateIndex(
                name: "IX_obras_Status",
                table: "obras",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_parcelas_receber_MovimentacaoFinanceiraId",
                table: "parcelas_receber",
                column: "MovimentacaoFinanceiraId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_parcelas_receber_ObraId_Status_DataVencimento",
                table: "parcelas_receber",
                columns: new[] { "ObraId", "Status", "DataVencimento" });

            migrationBuilder.CreateIndex(
                name: "IX_parcelas_receber_VendaId",
                table: "parcelas_receber",
                column: "VendaId");

            migrationBuilder.CreateIndex(
                name: "IX_role_claims_RoleId",
                table: "role_claims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "roles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_claims_UserId",
                table: "user_claims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_logins_UserId",
                table: "user_logins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_RoleId",
                table: "user_roles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "users",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "users",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vendas_ObraId",
                table: "vendas",
                column: "ObraId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "aportes");

            migrationBuilder.DropTable(
                name: "ativos_permuta");

            migrationBuilder.DropTable(
                name: "despesas");

            migrationBuilder.DropTable(
                name: "distribuicoes_resultado");

            migrationBuilder.DropTable(
                name: "obra_socios");

            migrationBuilder.DropTable(
                name: "parcelas_receber");

            migrationBuilder.DropTable(
                name: "role_claims");

            migrationBuilder.DropTable(
                name: "user_claims");

            migrationBuilder.DropTable(
                name: "user_logins");

            migrationBuilder.DropTable(
                name: "user_roles");

            migrationBuilder.DropTable(
                name: "user_tokens");

            migrationBuilder.DropTable(
                name: "encerramentos_obra");

            migrationBuilder.DropTable(
                name: "movimentacoes_financeiras");

            migrationBuilder.DropTable(
                name: "vendas");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "socios");

            migrationBuilder.DropTable(
                name: "obras");
        }
    }
}
