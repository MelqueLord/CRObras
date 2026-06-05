# Guia de Uso do CRObras

## Introdução

Este guia explica passo a passo como usar o sistema CRObras para gerenciar obras, sócios, finanças, materiais e encerramento.

## 1. Acessar o sistema

1. Abra o aplicativo em seu navegador.
2. Na tela de login, use:
   - Email: `admin@crobras.local`
   - Senha: `123456`
3. Clique em **Entrar**.
4. Se desejar criar um novo usuário, clique em **Criar primeiro usuario**, preencha Nome, Email, Senha e Código de cadastro, e clique em **Criar conta**.

## 2. Visão geral da interface

A tela principal mostra:

- Cabeçalho com o nome `CRObras` e botão **Sair**.
- Painel lateral com os blocos:
  - Resumo geral
  - Recebíveis
  - Atalhos
  - Obras
- Área central com os detalhes da obra selecionada.

## 3. Criar e selecionar uma obra

1. No painel **Obras**, digite o nome da nova obra no campo `Nova obra`.
2. Clique em **Criar**.
3. A nova obra será adicionada à lista.
4. Clique no cartão da obra para selecioná-la e abrir os detalhes.

## 4. Buscar e filtrar obras

- Use o campo de busca para procurar obras por nome, status ou endereço.
- Use os botões de filtro para listar:
  - Todas
  - Planejadas
  - Em andamento
  - Vendidas
  - Encerradas
  - Canceladas
- Selecione ordenação por:
  - Nome
  - Status
  - Maior saldo primeiro
  - Menor saldo primeiro

### Atalhos de teclado

- Pressione `/` para focar a busca de obras.
- Pressione `Escape` para limpar a busca.

## 5. Usar atalhos rápidos

- O painel **Atalhos** mostra as últimas obras acessadas.
- Clique em um atalho para abrir rapidamente uma obra.
- Clique no botão **Fin** para abrir essa obra diretamente na aba `Financeiro`.
- Clique em **Limpar** para remover todos os atalhos.

## 6. Aba Resumo

1. Clique em **Resumo** na área central.
2. Visualize:
   - Saldo da obra
   - Total investido
   - Total gasto
   - Total recebido
   - Valor estimado de permutas
   - Resultado econômico
3. Edite a obra no formulário:
   - Nome
   - Endereço
   - Descrição
   - Status
4. Clique em **Salvar obra** para gravar as alterações.

## 7. Aba Financeiro

1. Clique em **Financeiro**.
2. Para registrar aporte:
   - Selecione o sócio
   - Informe o valor
   - Preencha a descrição
   - Clique em **Aportar**
3. Para registrar despesa:
   - Selecione a categoria
   - Informe valor e descrição
   - Escolha um fornecedor ou crie um novo
   - Clique em **Registrar**
4. Use filtros para pesquisar o extrato financeiro por texto, tipo, status, fornecedor e período.

## 8. Aba Materiais

1. Clique em **Materiais**.
2. Para adicionar material:
   - Preencha `Nome do material`
   - Informe `Quantidade`
   - Informe `Preço unitário` (ex: 12,50)
   - Clique em **Adicionar**
3. A lista mostrará cada material com:
   - Nome
   - Quantidade
   - Preço unitário
   - Total calculado
4. Para remover um material, clique em **Remover**.
5. Para exportar a lista, clique em **Exportar CSV**.

## 9. Aba Venda

1. Clique em **Venda**.
2. Use esta aba para registrar vendas, entradas, parcelas e permutas.
3. Cada item financeiro da venda será ligado à obra selecionada.

## 10. Aba Encerramento

1. Clique em **Encerramento**.
2. Verifique o pré-fechamento da obra.
3. Observe as pendências e os valores finais.
4. Encerrar a obra quando estiver pronto.

## 11. Aba Socios

1. Clique em **Socios**.
2. Para criar um novo sócio:
   - Informe o nome
   - Informe o email (opcional)
   - Clique em **Criar**
3. Edite sócios existentes e marque-os como ativos ou inativos.
4. Na área de vinculação da obra:
   - Selecione o sócio
   - Informe o percentual de participação
   - Clique em **Vincular socio**
5. Ajuste percentuais e clique em **Salvar %**.

## 12. Fluxo recomendado de uso

1. Faça login.
2. Crie uma obra.
3. Crie sócios.
4. Vincule sócios à obra.
5. Registre aportes e despesas na aba Financeiro.
6. Registre materiais na aba Materiais.
7. Registre vendas e permutas na aba Venda, se necessário.
8. Analise o resumo da obra na aba Resumo.
9. Use a aba Encerramento para finalizar o projeto.
10. Clique em **Sair** para encerrar a sessão.

## 13. Observações finais

- O botão **Sair** no cabeçalho encerra a sessão atual.
- O painel **Atalhos** facilita acesso a obras recentes.
- As informações são salvas no backend e devem persistir ao recarregar.

---

Este documento serve como guia rápido para qualquer usuário operar o sistema CRObras.
