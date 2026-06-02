# CRObras - Tasks De Implementacao

## Concluidas

1. Scaffold da solucao .NET com projetos `Domain`, `Application`, `Infrastructure`, `Api` e `Tests`.
2. Scaffold do frontend React/Vite/Tailwind.
3. Modelagem de dominio de obras, socios, aportes, despesas, venda, parcelas, permutas e encerramento.
4. Configuracao EF Core/PostgreSQL e migration inicial.
5. Configuracao ASP.NET Core Identity com JWT.
6. Implementacao de endpoints de autenticacao.
7. Implementacao de CRUD basico de obras e socios.
8. Implementacao de vinculo de socios por obra.
9. Implementacao de aportes, despesas, extrato e saldo isolado por obra.
10. Implementacao de venda, entrada, parcelas e permutas.
11. Implementacao de pre-fechamento, validacoes e encerramento de obra.
12. Implementacao de dashboard basico.
13. Implementacao da UI operacional principal.
14. Criacao de testes automatizados para saldo, permuta e bloqueio apos encerramento.
15. Configuracao de Docker Compose para PostgreSQL.
16. Aplicacao da migration no banco local.
17. Execucao local da API e do frontend.
18. Seed automatico de usuario admin em ambiente de desenvolvimento.
19. Atualizacao da documentacao com portas reais em uso local.
20. Melhorar UI de parcelas, incluindo criacao e pagamento pela tela.
21. Adicionar edicao de obras, socios e percentuais pela UI.
22. Adicionar cancelamento de movimentacoes pela UI.
23. Adicionar filtros no extrato financeiro.
24. Adicionar relatorio de fechamento em tela/impressao.
25. Adicionar testes de integracao dos controllers.
26. Adicionar validacoes frontend mais completas.
27. Melhorar tratamento global de erros nas operacoes da UI.
28. Adicionar selecao de categoria de despesa na UI.
29. Adicionar relatorio detalhado de extrato por periodo.
30. Adicionar confirmacao antes de acoes destrutivas ou definitivas.
31. Melhorar campos de venda para criacao inicial com parcelas.
32. Adicionar indicadores de parcelas vencidas no dashboard lateral.
33. Adicionar resumo financeiro por obra na aba Resumo.
34. Adicionar exclusao/inativacao segura de socios sem uso.
35. Adicionar busca na lista lateral de obras.
36. Adicionar ordenacao da lista de obras por status/saldo/nome.
37. Adicionar destaque visual para obras encerradas/canceladas.
38. Adicionar cadastro de fornecedor simples para despesas recorrentes.
39. Adicionar filtro rapido por status na lista lateral de obras.
40. Adicionar ordenacao de parcelas por vencimento/status.
41. Adicionar filtro de extrato por fornecedor.
42. Adicionar exportacao CSV do extrato financeiro filtrado.

## Ajustes Implementados Agora

1. Adicionada exportacao CSV do extrato financeiro filtrado.
2. Exportacao usa os dados ja filtrados em memoria, sem chamada adicional para a API.
3. CSV inclui data, tipo, categoria, fornecedor, descricao, valor e status.

## Proximas Tasks Recomendadas

43. Adicionar indicadores visuais de carregamento por painel.
