--
-- PostgreSQL database dump
--

\restrict PoznbyVUF0YF7n0e6lFEVLIzzfgO1PUMPghgWGBOK7FJEQICqaVY3CNhbzqCxPh

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL
);


ALTER TABLE public."__EFMigrationsHistory" OWNER TO postgres;

--
-- Name: aportes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aportes (
    "Id" uuid NOT NULL,
    "ObraId" uuid NOT NULL,
    "SocioId" uuid NOT NULL,
    "MovimentacaoFinanceiraId" uuid NOT NULL,
    "Valor" numeric(18,2) NOT NULL,
    "DataAporte" date NOT NULL
);


ALTER TABLE public.aportes OWNER TO postgres;

--
-- Name: ativos_permuta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ativos_permuta (
    "Id" uuid NOT NULL,
    "VendaId" uuid NOT NULL,
    "ObraId" uuid NOT NULL,
    "Tipo" integer NOT NULL,
    "Descricao" character varying(500) NOT NULL,
    "ValorEstimado" numeric(18,2) NOT NULL,
    "DocumentoReferencia" character varying(120),
    "DataRecebimento" date NOT NULL,
    "Status" integer NOT NULL
);


ALTER TABLE public.ativos_permuta OWNER TO postgres;

--
-- Name: despesas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.despesas (
    "Id" uuid NOT NULL,
    "ObraId" uuid NOT NULL,
    "MovimentacaoFinanceiraId" uuid NOT NULL,
    "Categoria" integer NOT NULL,
    "Fornecedor" character varying(160),
    "DocumentoFiscal" character varying(80)
);


ALTER TABLE public.despesas OWNER TO postgres;

--
-- Name: distribuicoes_resultado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.distribuicoes_resultado (
    "Id" uuid NOT NULL,
    "EncerramentoObraId" uuid NOT NULL,
    "SocioId" uuid NOT NULL,
    "PercentualParticipacao" numeric(5,2) NOT NULL,
    "ValorInvestido" numeric(18,2) NOT NULL,
    "ValorResultado" numeric(18,2) NOT NULL,
    "ValorAReceberOuPagar" numeric(18,2) NOT NULL
);


ALTER TABLE public.distribuicoes_resultado OWNER TO postgres;

--
-- Name: encerramentos_obra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.encerramentos_obra (
    "Id" uuid NOT NULL,
    "ObraId" uuid NOT NULL,
    "TotalInvestido" numeric(18,2) NOT NULL,
    "TotalGasto" numeric(18,2) NOT NULL,
    "TotalRecebido" numeric(18,2) NOT NULL,
    "ValorPermutasEstimado" numeric(18,2) NOT NULL,
    "ResultadoFinanceiro" numeric(18,2) NOT NULL,
    "DataEncerramento" timestamp with time zone NOT NULL,
    "Observacao" character varying(1000)
);


ALTER TABLE public.encerramentos_obra OWNER TO postgres;

--
-- Name: fornecedores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fornecedores (
    "Id" uuid NOT NULL,
    "Nome" character varying(160) NOT NULL,
    "Documento" character varying(32),
    "Telefone" character varying(40),
    "Ativo" boolean NOT NULL
);


ALTER TABLE public.fornecedores OWNER TO postgres;

--
-- Name: movimentacoes_financeiras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimentacoes_financeiras (
    "Id" uuid NOT NULL,
    "ObraId" uuid NOT NULL,
    "Tipo" integer NOT NULL,
    "Categoria" character varying(80) NOT NULL,
    "Valor" numeric(18,2) NOT NULL,
    "DataMovimentacao" date NOT NULL,
    "Descricao" character varying(500) NOT NULL,
    "SocioId" uuid,
    "ParcelaReceberId" uuid,
    "Status" integer NOT NULL,
    "CriadoEm" timestamp with time zone NOT NULL
);


ALTER TABLE public.movimentacoes_financeiras OWNER TO postgres;

--
-- Name: obra_socios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.obra_socios (
    "Id" uuid NOT NULL,
    "ObraId" uuid NOT NULL,
    "SocioId" uuid NOT NULL,
    "PercentualParticipacao" numeric(5,2) NOT NULL,
    "Observacao" character varying(500)
);


ALTER TABLE public.obra_socios OWNER TO postgres;

--
-- Name: obras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.obras (
    "Id" uuid NOT NULL,
    "Nome" character varying(160) NOT NULL,
    "Descricao" character varying(1000),
    "Endereco" character varying(500),
    "DataInicio" date NOT NULL,
    "DataPrevistaConclusao" date,
    "Status" integer NOT NULL,
    "SaldoAtual" numeric(18,2) NOT NULL,
    "DataEncerramento" timestamp with time zone
);


ALTER TABLE public.obras OWNER TO postgres;

--
-- Name: parcelas_receber; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parcelas_receber (
    "Id" uuid NOT NULL,
    "VendaId" uuid NOT NULL,
    "ObraId" uuid NOT NULL,
    "Numero" integer NOT NULL,
    "Valor" numeric(18,2) NOT NULL,
    "DataVencimento" date NOT NULL,
    "DataPagamento" date,
    "Status" integer NOT NULL,
    "MovimentacaoFinanceiraId" uuid
);


ALTER TABLE public.parcelas_receber OWNER TO postgres;

--
-- Name: role_claims; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_claims (
    "Id" integer NOT NULL,
    "RoleId" uuid NOT NULL,
    "ClaimType" text,
    "ClaimValue" text
);


ALTER TABLE public.role_claims OWNER TO postgres;

--
-- Name: role_claims_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.role_claims ALTER COLUMN "Id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."role_claims_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    "Id" uuid NOT NULL,
    "Name" character varying(256),
    "NormalizedName" character varying(256),
    "ConcurrencyStamp" text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: socios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.socios (
    "Id" uuid NOT NULL,
    "Nome" character varying(160) NOT NULL,
    "Documento" character varying(32),
    "Email" character varying(160),
    "Telefone" character varying(40),
    "Ativo" boolean NOT NULL
);


ALTER TABLE public.socios OWNER TO postgres;

--
-- Name: user_claims; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_claims (
    "Id" integer NOT NULL,
    "UserId" uuid NOT NULL,
    "ClaimType" text,
    "ClaimValue" text
);


ALTER TABLE public.user_claims OWNER TO postgres;

--
-- Name: user_claims_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.user_claims ALTER COLUMN "Id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."user_claims_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_logins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_logins (
    "LoginProvider" text NOT NULL,
    "ProviderKey" text NOT NULL,
    "ProviderDisplayName" text,
    "UserId" uuid NOT NULL
);


ALTER TABLE public.user_logins OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    "UserId" uuid NOT NULL,
    "RoleId" uuid NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_tokens (
    "UserId" uuid NOT NULL,
    "LoginProvider" text NOT NULL,
    "Name" text NOT NULL,
    "Value" text
);


ALTER TABLE public.user_tokens OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    "Id" uuid NOT NULL,
    "Nome" text NOT NULL,
    "UserName" character varying(256),
    "NormalizedUserName" character varying(256),
    "Email" character varying(256),
    "NormalizedEmail" character varying(256),
    "EmailConfirmed" boolean NOT NULL,
    "PasswordHash" text,
    "SecurityStamp" text,
    "ConcurrencyStamp" text,
    "PhoneNumber" text,
    "PhoneNumberConfirmed" boolean NOT NULL,
    "TwoFactorEnabled" boolean NOT NULL,
    "LockoutEnd" timestamp with time zone,
    "LockoutEnabled" boolean NOT NULL,
    "AccessFailedCount" integer NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vendas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendas (
    "Id" uuid NOT NULL,
    "ObraId" uuid NOT NULL,
    "Tipo" integer NOT NULL,
    "ValorTotalNegociado" numeric(18,2) NOT NULL,
    "ValorEntrada" numeric(18,2) NOT NULL,
    "DataVenda" date NOT NULL,
    "CompradorNome" character varying(160) NOT NULL,
    "CompradorDocumento" character varying(32),
    "Observacao" character varying(1000),
    "Status" integer NOT NULL
);


ALTER TABLE public.vendas OWNER TO postgres;

--
-- Data for Name: __EFMigrationsHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."__EFMigrationsHistory" ("MigrationId", "ProductVersion") FROM stdin;
20260601122352_InitialCreate	8.0.6
20260602110153_AddFornecedores	8.0.6
\.


--
-- Data for Name: aportes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aportes ("Id", "ObraId", "SocioId", "MovimentacaoFinanceiraId", "Valor", "DataAporte") FROM stdin;
e1b57cbd-2f2d-4778-92e1-c5afa7f8c461	39125a72-c427-4149-a9ec-56df3d9b7831	59b23755-26a2-4099-a880-b9d44bb50983	ebaa7e2d-6e8d-4d97-a5fc-8f965a6a6e10	500000.00	2026-06-01
\.


--
-- Data for Name: ativos_permuta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ativos_permuta ("Id", "VendaId", "ObraId", "Tipo", "Descricao", "ValorEstimado", "DocumentoReferencia", "DataRecebimento", "Status") FROM stdin;
\.


--
-- Data for Name: despesas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.despesas ("Id", "ObraId", "MovimentacaoFinanceiraId", "Categoria", "Fornecedor", "DocumentoFiscal") FROM stdin;
\.


--
-- Data for Name: distribuicoes_resultado; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.distribuicoes_resultado ("Id", "EncerramentoObraId", "SocioId", "PercentualParticipacao", "ValorInvestido", "ValorResultado", "ValorAReceberOuPagar") FROM stdin;
\.


--
-- Data for Name: encerramentos_obra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.encerramentos_obra ("Id", "ObraId", "TotalInvestido", "TotalGasto", "TotalRecebido", "ValorPermutasEstimado", "ResultadoFinanceiro", "DataEncerramento", "Observacao") FROM stdin;
\.


--
-- Data for Name: fornecedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fornecedores ("Id", "Nome", "Documento", "Telefone", "Ativo") FROM stdin;
\.


--
-- Data for Name: movimentacoes_financeiras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimentacoes_financeiras ("Id", "ObraId", "Tipo", "Categoria", "Valor", "DataMovimentacao", "Descricao", "SocioId", "ParcelaReceberId", "Status", "CriadoEm") FROM stdin;
ebaa7e2d-6e8d-4d97-a5fc-8f965a6a6e10	39125a72-c427-4149-a9ec-56df3d9b7831	1	Aporte	500000.00	2026-06-01	TRREE	59b23755-26a2-4099-a880-b9d44bb50983	\N	1	2026-06-01 13:06:48.371813+00
8e897989-7296-4717-ac07-969271f112cd	39125a72-c427-4149-a9ec-56df3d9b7831	3	EntradaVenda	100000.00	2026-06-01	Entrada da venda para THiago	\N	\N	1	2026-06-01 13:24:48.886563+00
\.


--
-- Data for Name: obra_socios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.obra_socios ("Id", "ObraId", "SocioId", "PercentualParticipacao", "Observacao") FROM stdin;
4d5c60e1-a001-444f-bfa0-8b08f092f16b	39125a72-c427-4149-a9ec-56df3d9b7831	59b23755-26a2-4099-a880-b9d44bb50983	50.00	
d91138e1-b570-4d95-bcf7-7ae7d91c4129	39125a72-c427-4149-a9ec-56df3d9b7831	ba72a7b1-9bfb-4acf-90b7-9c15826e178f	35.00	
\.


--
-- Data for Name: obras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.obras ("Id", "Nome", "Descricao", "Endereco", "DataInicio", "DataPrevistaConclusao", "Status", "SaldoAtual", "DataEncerramento") FROM stdin;
39125a72-c427-4149-a9ec-56df3d9b7831	CONDOMINIO X			2026-06-01	\N	3	600000.00	\N
aa036b3d-6a1a-42d5-8ad3-f4e5541fce2b	OBRA @			2026-06-01	\N	2	0.00	\N
\.


--
-- Data for Name: parcelas_receber; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parcelas_receber ("Id", "VendaId", "ObraId", "Numero", "Valor", "DataVencimento", "DataPagamento", "Status", "MovimentacaoFinanceiraId") FROM stdin;
\.


--
-- Data for Name: role_claims; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_claims ("Id", "RoleId", "ClaimType", "ClaimValue") FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles ("Id", "Name", "NormalizedName", "ConcurrencyStamp") FROM stdin;
\.


--
-- Data for Name: socios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.socios ("Id", "Nome", "Documento", "Email", "Telefone", "Ativo") FROM stdin;
59b23755-26a2-4099-a880-b9d44bb50983	TESTE				t
ba72a7b1-9bfb-4acf-90b7-9c15826e178f	TESTE2				t
\.


--
-- Data for Name: user_claims; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_claims ("Id", "UserId", "ClaimType", "ClaimValue") FROM stdin;
\.


--
-- Data for Name: user_logins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_logins ("LoginProvider", "ProviderKey", "ProviderDisplayName", "UserId") FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles ("UserId", "RoleId") FROM stdin;
\.


--
-- Data for Name: user_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_tokens ("UserId", "LoginProvider", "Name", "Value") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users ("Id", "Nome", "UserName", "NormalizedUserName", "Email", "NormalizedEmail", "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp", "PhoneNumber", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnd", "LockoutEnabled", "AccessFailedCount") FROM stdin;
a9b06170-06f4-4d58-b002-09e09aaa3ab6	Admin	admin@crobras.local	ADMIN@CROBRAS.LOCAL	admin@crobras.local	ADMIN@CROBRAS.LOCAL	f	AQAAAAIAAYagAAAAEJzAaqvqNX/gt8mwL1t0Ix214Hc5Jd6NqldUovnfZ8IIyfJAOAUJjrXcoBq9sB5wEQ==	ZJGUXIM2LXWZ23QGMH6X2QSBHYZGOHS6	e39fde4b-d448-49f8-9edc-db9967abdc17	\N	f	f	\N	t	0
\.


--
-- Data for Name: vendas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendas ("Id", "ObraId", "Tipo", "ValorTotalNegociado", "ValorEntrada", "DataVenda", "CompradorNome", "CompradorDocumento", "Observacao", "Status") FROM stdin;
f814aa1f-6ac5-4022-933e-e6ae3c0eab47	39125a72-c427-4149-a9ec-56df3d9b7831	4	500000.00	100000.00	2026-06-01	THiago			1
\.


--
-- Name: role_claims_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."role_claims_Id_seq"', 1, false);


--
-- Name: user_claims_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."user_claims_Id_seq"', 1, false);


--
-- Name: __EFMigrationsHistory PK___EFMigrationsHistory; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."__EFMigrationsHistory"
    ADD CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId");


--
-- Name: aportes PK_aportes; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aportes
    ADD CONSTRAINT "PK_aportes" PRIMARY KEY ("Id");


--
-- Name: ativos_permuta PK_ativos_permuta; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ativos_permuta
    ADD CONSTRAINT "PK_ativos_permuta" PRIMARY KEY ("Id");


--
-- Name: despesas PK_despesas; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despesas
    ADD CONSTRAINT "PK_despesas" PRIMARY KEY ("Id");


--
-- Name: distribuicoes_resultado PK_distribuicoes_resultado; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distribuicoes_resultado
    ADD CONSTRAINT "PK_distribuicoes_resultado" PRIMARY KEY ("Id");


--
-- Name: encerramentos_obra PK_encerramentos_obra; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.encerramentos_obra
    ADD CONSTRAINT "PK_encerramentos_obra" PRIMARY KEY ("Id");


--
-- Name: fornecedores PK_fornecedores; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT "PK_fornecedores" PRIMARY KEY ("Id");


--
-- Name: movimentacoes_financeiras PK_movimentacoes_financeiras; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_financeiras
    ADD CONSTRAINT "PK_movimentacoes_financeiras" PRIMARY KEY ("Id");


--
-- Name: obra_socios PK_obra_socios; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obra_socios
    ADD CONSTRAINT "PK_obra_socios" PRIMARY KEY ("Id");


--
-- Name: obras PK_obras; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT "PK_obras" PRIMARY KEY ("Id");


--
-- Name: parcelas_receber PK_parcelas_receber; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas_receber
    ADD CONSTRAINT "PK_parcelas_receber" PRIMARY KEY ("Id");


--
-- Name: role_claims PK_role_claims; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_claims
    ADD CONSTRAINT "PK_role_claims" PRIMARY KEY ("Id");


--
-- Name: roles PK_roles; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_roles" PRIMARY KEY ("Id");


--
-- Name: socios PK_socios; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socios
    ADD CONSTRAINT "PK_socios" PRIMARY KEY ("Id");


--
-- Name: user_claims PK_user_claims; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_claims
    ADD CONSTRAINT "PK_user_claims" PRIMARY KEY ("Id");


--
-- Name: user_logins PK_user_logins; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_logins
    ADD CONSTRAINT "PK_user_logins" PRIMARY KEY ("LoginProvider", "ProviderKey");


--
-- Name: user_roles PK_user_roles; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "PK_user_roles" PRIMARY KEY ("UserId", "RoleId");


--
-- Name: user_tokens PK_user_tokens; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tokens
    ADD CONSTRAINT "PK_user_tokens" PRIMARY KEY ("UserId", "LoginProvider", "Name");


--
-- Name: users PK_users; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_users" PRIMARY KEY ("Id");


--
-- Name: vendas PK_vendas; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT "PK_vendas" PRIMARY KEY ("Id");


--
-- Name: EmailIndex; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailIndex" ON public.users USING btree ("NormalizedEmail");


--
-- Name: IX_aportes_MovimentacaoFinanceiraId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_aportes_MovimentacaoFinanceiraId" ON public.aportes USING btree ("MovimentacaoFinanceiraId");


--
-- Name: IX_aportes_ObraId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_aportes_ObraId" ON public.aportes USING btree ("ObraId");


--
-- Name: IX_aportes_SocioId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_aportes_SocioId" ON public.aportes USING btree ("SocioId");


--
-- Name: IX_ativos_permuta_ObraId_Status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_ativos_permuta_ObraId_Status" ON public.ativos_permuta USING btree ("ObraId", "Status");


--
-- Name: IX_ativos_permuta_VendaId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_ativos_permuta_VendaId" ON public.ativos_permuta USING btree ("VendaId");


--
-- Name: IX_despesas_MovimentacaoFinanceiraId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_despesas_MovimentacaoFinanceiraId" ON public.despesas USING btree ("MovimentacaoFinanceiraId");


--
-- Name: IX_despesas_ObraId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_despesas_ObraId" ON public.despesas USING btree ("ObraId");


--
-- Name: IX_distribuicoes_resultado_EncerramentoObraId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_distribuicoes_resultado_EncerramentoObraId" ON public.distribuicoes_resultado USING btree ("EncerramentoObraId");


--
-- Name: IX_distribuicoes_resultado_SocioId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_distribuicoes_resultado_SocioId" ON public.distribuicoes_resultado USING btree ("SocioId");


--
-- Name: IX_encerramentos_obra_ObraId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IX_encerramentos_obra_ObraId" ON public.encerramentos_obra USING btree ("ObraId");


--
-- Name: IX_fornecedores_Nome; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_fornecedores_Nome" ON public.fornecedores USING btree ("Nome");


--
-- Name: IX_movimentacoes_financeiras_ObraId_DataMovimentacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_movimentacoes_financeiras_ObraId_DataMovimentacao" ON public.movimentacoes_financeiras USING btree ("ObraId", "DataMovimentacao");


--
-- Name: IX_movimentacoes_financeiras_ObraId_Tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_movimentacoes_financeiras_ObraId_Tipo" ON public.movimentacoes_financeiras USING btree ("ObraId", "Tipo");


--
-- Name: IX_movimentacoes_financeiras_SocioId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_movimentacoes_financeiras_SocioId" ON public.movimentacoes_financeiras USING btree ("SocioId");


--
-- Name: IX_obra_socios_ObraId_SocioId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IX_obra_socios_ObraId_SocioId" ON public.obra_socios USING btree ("ObraId", "SocioId");


--
-- Name: IX_obra_socios_SocioId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_obra_socios_SocioId" ON public.obra_socios USING btree ("SocioId");


--
-- Name: IX_obras_Status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_obras_Status" ON public.obras USING btree ("Status");


--
-- Name: IX_parcelas_receber_MovimentacaoFinanceiraId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IX_parcelas_receber_MovimentacaoFinanceiraId" ON public.parcelas_receber USING btree ("MovimentacaoFinanceiraId");


--
-- Name: IX_parcelas_receber_ObraId_Status_DataVencimento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_parcelas_receber_ObraId_Status_DataVencimento" ON public.parcelas_receber USING btree ("ObraId", "Status", "DataVencimento");


--
-- Name: IX_parcelas_receber_VendaId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_parcelas_receber_VendaId" ON public.parcelas_receber USING btree ("VendaId");


--
-- Name: IX_role_claims_RoleId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_role_claims_RoleId" ON public.role_claims USING btree ("RoleId");


--
-- Name: IX_user_claims_UserId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_user_claims_UserId" ON public.user_claims USING btree ("UserId");


--
-- Name: IX_user_logins_UserId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_user_logins_UserId" ON public.user_logins USING btree ("UserId");


--
-- Name: IX_user_roles_RoleId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_user_roles_RoleId" ON public.user_roles USING btree ("RoleId");


--
-- Name: IX_vendas_ObraId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IX_vendas_ObraId" ON public.vendas USING btree ("ObraId");


--
-- Name: RoleNameIndex; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RoleNameIndex" ON public.roles USING btree ("NormalizedName");


--
-- Name: UserNameIndex; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserNameIndex" ON public.users USING btree ("NormalizedUserName");


--
-- Name: aportes FK_aportes_movimentacoes_financeiras_MovimentacaoFinanceiraId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aportes
    ADD CONSTRAINT "FK_aportes_movimentacoes_financeiras_MovimentacaoFinanceiraId" FOREIGN KEY ("MovimentacaoFinanceiraId") REFERENCES public.movimentacoes_financeiras("Id") ON DELETE RESTRICT;


--
-- Name: aportes FK_aportes_obras_ObraId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aportes
    ADD CONSTRAINT "FK_aportes_obras_ObraId" FOREIGN KEY ("ObraId") REFERENCES public.obras("Id") ON DELETE CASCADE;


--
-- Name: aportes FK_aportes_socios_SocioId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aportes
    ADD CONSTRAINT "FK_aportes_socios_SocioId" FOREIGN KEY ("SocioId") REFERENCES public.socios("Id") ON DELETE RESTRICT;


--
-- Name: ativos_permuta FK_ativos_permuta_obras_ObraId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ativos_permuta
    ADD CONSTRAINT "FK_ativos_permuta_obras_ObraId" FOREIGN KEY ("ObraId") REFERENCES public.obras("Id") ON DELETE CASCADE;


--
-- Name: ativos_permuta FK_ativos_permuta_vendas_VendaId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ativos_permuta
    ADD CONSTRAINT "FK_ativos_permuta_vendas_VendaId" FOREIGN KEY ("VendaId") REFERENCES public.vendas("Id") ON DELETE CASCADE;


--
-- Name: despesas FK_despesas_movimentacoes_financeiras_MovimentacaoFinanceiraId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despesas
    ADD CONSTRAINT "FK_despesas_movimentacoes_financeiras_MovimentacaoFinanceiraId" FOREIGN KEY ("MovimentacaoFinanceiraId") REFERENCES public.movimentacoes_financeiras("Id") ON DELETE RESTRICT;


--
-- Name: despesas FK_despesas_obras_ObraId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despesas
    ADD CONSTRAINT "FK_despesas_obras_ObraId" FOREIGN KEY ("ObraId") REFERENCES public.obras("Id") ON DELETE CASCADE;


--
-- Name: distribuicoes_resultado FK_distribuicoes_resultado_encerramentos_obra_EncerramentoObra~; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distribuicoes_resultado
    ADD CONSTRAINT "FK_distribuicoes_resultado_encerramentos_obra_EncerramentoObra~" FOREIGN KEY ("EncerramentoObraId") REFERENCES public.encerramentos_obra("Id") ON DELETE CASCADE;


--
-- Name: distribuicoes_resultado FK_distribuicoes_resultado_socios_SocioId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distribuicoes_resultado
    ADD CONSTRAINT "FK_distribuicoes_resultado_socios_SocioId" FOREIGN KEY ("SocioId") REFERENCES public.socios("Id") ON DELETE RESTRICT;


--
-- Name: encerramentos_obra FK_encerramentos_obra_obras_ObraId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.encerramentos_obra
    ADD CONSTRAINT "FK_encerramentos_obra_obras_ObraId" FOREIGN KEY ("ObraId") REFERENCES public.obras("Id") ON DELETE CASCADE;


--
-- Name: movimentacoes_financeiras FK_movimentacoes_financeiras_obras_ObraId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_financeiras
    ADD CONSTRAINT "FK_movimentacoes_financeiras_obras_ObraId" FOREIGN KEY ("ObraId") REFERENCES public.obras("Id") ON DELETE CASCADE;


--
-- Name: movimentacoes_financeiras FK_movimentacoes_financeiras_socios_SocioId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_financeiras
    ADD CONSTRAINT "FK_movimentacoes_financeiras_socios_SocioId" FOREIGN KEY ("SocioId") REFERENCES public.socios("Id") ON DELETE RESTRICT;


--
-- Name: obra_socios FK_obra_socios_obras_ObraId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obra_socios
    ADD CONSTRAINT "FK_obra_socios_obras_ObraId" FOREIGN KEY ("ObraId") REFERENCES public.obras("Id") ON DELETE CASCADE;


--
-- Name: obra_socios FK_obra_socios_socios_SocioId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.obra_socios
    ADD CONSTRAINT "FK_obra_socios_socios_SocioId" FOREIGN KEY ("SocioId") REFERENCES public.socios("Id") ON DELETE RESTRICT;


--
-- Name: parcelas_receber FK_parcelas_receber_movimentacoes_financeiras_MovimentacaoFina~; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas_receber
    ADD CONSTRAINT "FK_parcelas_receber_movimentacoes_financeiras_MovimentacaoFina~" FOREIGN KEY ("MovimentacaoFinanceiraId") REFERENCES public.movimentacoes_financeiras("Id") ON DELETE RESTRICT;


--
-- Name: parcelas_receber FK_parcelas_receber_obras_ObraId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas_receber
    ADD CONSTRAINT "FK_parcelas_receber_obras_ObraId" FOREIGN KEY ("ObraId") REFERENCES public.obras("Id") ON DELETE CASCADE;


--
-- Name: parcelas_receber FK_parcelas_receber_vendas_VendaId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas_receber
    ADD CONSTRAINT "FK_parcelas_receber_vendas_VendaId" FOREIGN KEY ("VendaId") REFERENCES public.vendas("Id") ON DELETE CASCADE;


--
-- Name: role_claims FK_role_claims_roles_RoleId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_claims
    ADD CONSTRAINT "FK_role_claims_roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES public.roles("Id") ON DELETE CASCADE;


--
-- Name: user_claims FK_user_claims_users_UserId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_claims
    ADD CONSTRAINT "FK_user_claims_users_UserId" FOREIGN KEY ("UserId") REFERENCES public.users("Id") ON DELETE CASCADE;


--
-- Name: user_logins FK_user_logins_users_UserId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_logins
    ADD CONSTRAINT "FK_user_logins_users_UserId" FOREIGN KEY ("UserId") REFERENCES public.users("Id") ON DELETE CASCADE;


--
-- Name: user_roles FK_user_roles_roles_RoleId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_user_roles_roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES public.roles("Id") ON DELETE CASCADE;


--
-- Name: user_roles FK_user_roles_users_UserId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_user_roles_users_UserId" FOREIGN KEY ("UserId") REFERENCES public.users("Id") ON DELETE CASCADE;


--
-- Name: user_tokens FK_user_tokens_users_UserId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tokens
    ADD CONSTRAINT "FK_user_tokens_users_UserId" FOREIGN KEY ("UserId") REFERENCES public.users("Id") ON DELETE CASCADE;


--
-- Name: vendas FK_vendas_obras_ObraId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT "FK_vendas_obras_ObraId" FOREIGN KEY ("ObraId") REFERENCES public.obras("Id") ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict PoznbyVUF0YF7n0e6lFEVLIzzfgO1PUMPghgWGBOK7FJEQICqaVY3CNhbzqCxPh

