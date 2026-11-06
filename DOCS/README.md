# PRD — Plataforma de Anúncios de Serviços

## Desenvolvimento local e Supabase

Instale as dependências e inicie o projeto com:

```bash
npm install
npm run dev
```

Também é possível usar a extensão Live Server do VS Code: abra o projeto pela
opção **Open with Live Server** e acesse o endereço HTTP exibido pela extensão.
Não abra `index.html` diretamente pelo explorador de arquivos (`file://`).

Para testar a confirmação de e-mail em outro dispositivo, inicie o Vite com
`npm run dev -- --host 0.0.0.0` e abra no celular o endereço de rede exibido
(por exemplo, `http://192.168.0.10:5173`), nunca `http://localhost:5173`.
Esse mesmo endereço precisa estar cadastrado no Supabase em **Authentication >
URL Configuration > Redirect URLs**, por exemplo:
`http://192.168.0.10:5173/**`.

As credenciais ficam em `.env`, usando `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY`. O arquivo `.env.example` contém o formato esperado e
`.env` não deve ser versionado.

A estrutura do banco está em
`supabase/migrations/20261102164700_initial_schema.sql`. Execute essa migration
no Supabase MCP ou no SQL Editor antes de usar o cadastro de empresas. O site
usa o Supabase Auth para armazenar as contas (incluindo os e-mails) e `businesses`
para anúncios. A tabela `business_interactions` armazena métricas de
visualizações e contatos.

## Prompt principal para criação do produto

Crie uma plataforma web responsiva de anúncios de serviços e empresas locais. O
site deve permitir que clientes encontrem empresas por categoria, nome ou
localização e entrem em contato com elas por WhatsApp, Instagram, localização no
mapa ou pelo canal de pedidos da própria empresa.

A plataforma deve ter duas experiências separadas:

1. **Área do cliente (`html`)**: interface pública para pesquisar, visualizar e
   selecionar anúncios.
2. **Área administrativa (`htmladm`)**: painel para empresários cadastrarem e
   editarem seus anúncios e acompanharem a quantidade de interações recebidas.

Use uma interface simples, moderna, rápida e acessível, com foco em negócios
locais e uso em dispositivos móveis. Todo texto visível ao usuário deve estar
em português do Brasil.

---

## Objetivo do produto

Centralizar anúncios de empresas e prestadores de serviços em um único local,
facilitando:

- a descoberta de serviços pelos clientes;
- o contato rápido com as empresas;
- o cadastro e a divulgação dos negócios pelos empresários;
- o acompanhamento de quantas vezes cada empresa foi selecionada ou recebeu
  uma interação.

## Perfis de usuário

### Cliente

Pessoa que acessa o site para encontrar um serviço, consultar os dados de uma
empresa e iniciar contato.

### Empresário

Pessoa responsável por uma empresa ou serviço anunciado. Pode criar uma conta,
cadastrar os dados do negócio, editar o anúncio e consultar as métricas.

### Administrador da plataforma

Perfil opcional para moderar cadastros, ocultar anúncios inadequados, gerenciar
categorias e acompanhar o funcionamento geral da plataforma.

---

## Área pública do cliente (`html`)

### Página inicial

Criar uma página inicial com:

- barra de pesquisa em destaque no topo;
- placeholder: **“O que você está procurando?”**;
- opção de filtrar por categoria, cidade/bairro e localização;
- botão para abrir a navegação lateral;
- lista de anúncios em cards;
- categorias ou serviços populares;
- indicação clara de que o cliente pode anunciar sua empresa na área
  administrativa.

### Barra lateral de serviços

Adicionar uma barra lateral inicialmente invisível/recolhida, acessível por um
botão visível com o texto **“Serviços”** ou por um ícone de menu.

Quando aberta, ela deve:

- exibir as categorias de serviços;
- permitir selecionar uma categoria;
- manter a pesquisa e os filtros aplicados;
- fechar por botão, clique fora do painel ou tecla `Esc`;
- funcionar corretamente em telas pequenas e grandes.

Exemplos de categorias:

- alimentação;
- beleza e estética;
- saúde;
- manutenção;
- transporte;
- eventos;
- educação;
- lojas;
- serviços profissionais;
- outros.

### Resultados de busca

Exibir cada empresa em um card contendo, quando disponível:

- nome da empresa;
- imagem ou logo;
- categoria;
- descrição curta;
- cidade, bairro ou endereço resumido;
- horário de atendimento;
- quantidade de cliques/interações;
- botões de ação para WhatsApp, Instagram, localização e pedido.

Ordenar os resultados por relevância por padrão. Permitir também ordenar por
mais acessados e mais recentes. Mostrar um estado vazio amigável quando não
houver resultados e oferecer a opção de limpar os filtros.

### Página/detalhe da empresa

Ao selecionar um anúncio, abrir uma página ou modal de detalhes com:

- todas as informações públicas da empresa;
- descrição completa;
- galeria de imagens, se houver;
- contatos;
- endereço e mapa;
- horário de funcionamento;
- botões grandes e acessíveis para cada canal de contato;
- contador de interações da empresa.

O contador deve ser apresentado com um texto compreensível, como:
**“Esta empresa foi selecionada X vezes”**. Se a métrica pública for considerada
mais adequada, usar **“X pessoas interagiram com este anúncio”**.

---

## Sistema de cliques e interações

Registrar as ações relevantes do cliente sem contar múltiplas vezes o mesmo
evento de forma acidental. Cada interação deve registrar, no mínimo:

- empresa anunciada;
- tipo da ação (`visualização`, `WhatsApp`, `Instagram`, `localização`,
  `pedido` ou `telefone`, se existir);
- data e hora;
- identificador anônimo da sessão/dispositivo, quando possível.

### Regras do contador

- Incrementar a métrica quando o cliente abrir o anúncio e/ou clicar em um
  botão de contato, distinguindo esses eventos.
- Não exibir dados pessoais do cliente.
- Evitar contagem repetida causada por duplo clique ou recarregamento imediato.
- Atualizar o contador de forma segura e consistente.
- Exibir para o empresário o total geral e a divisão por tipo de interação.
- Exibir ao cliente somente a métrica pública definida para o produto, sem
  revelar informações privadas.

No painel administrativo, mostrar:

- total de visualizações;
- total de cliques em cada canal;
- período selecionável (hoje, últimos 7 dias, últimos 30 dias e total);
- gráfico simples de evolução;
- data da última interação.

---

## Área administrativa (`htmladm`)

### Cadastro e autenticação

Criar fluxo de:

- cadastro do empresário;
- login;
- recuperação de acesso;
- logout;
- proteção das rotas administrativas.

Validar os campos obrigatórios e exibir mensagens de erro claras em português.
Não permitir que um usuário edite o anúncio de outra empresa.

### Cadastro da empresa

Criar formulário para o empresário informar:

- nome da empresa;
- categoria principal;
- categorias secundárias, se aplicável;
- descrição;
- logo e imagens;
- telefone;
- link do WhatsApp;
- usuário ou link do Instagram;
- endereço completo;
- localização no mapa ou coordenadas;
- horário de funcionamento;
- canal de pedidos (link, telefone ou instruções);
- cidade e bairro;
- status do anúncio: rascunho, publicado ou pausado.

Usar validação de URL, telefone, campos obrigatórios e tamanho máximo de
descrições/imagens. Antes de publicar, permitir visualizar como o anúncio
aparecerá para o cliente.

### Dashboard do empresário

Após o login, exibir:

- resumo do anúncio;
- status atual;
- total de interações;
- visualizações;
- cliques em WhatsApp, Instagram, localização e pedido;
- gráfico por período;
- botão para editar o anúncio;
- botão para pausar ou reativar a publicação;
- data da última atualização.

---

## Requisitos funcionais

1. O cliente deve conseguir pesquisar empresas por texto.
2. O cliente deve conseguir filtrar por categoria e localização.
3. O cliente deve conseguir abrir os detalhes de uma empresa.
4. Os links de WhatsApp, Instagram, localização e pedido devem abrir o destino
   correto em uma nova ação, preservando a experiência do usuário.
5. O empresário deve conseguir criar, editar, publicar e pausar seu anúncio.
6. O sistema deve registrar as visualizações e os cliques de contato.
7. O empresário deve conseguir consultar suas métricas.
8. A plataforma deve impedir acesso não autorizado aos dados administrativos.
9. O sistema deve funcionar em celular, tablet e desktop.
10. A interface deve apresentar estados de carregamento, vazio, sucesso e erro.

## Requisitos não funcionais

- Layout responsivo e abordagem mobile-first.
- Boa performance, especialmente na página inicial e na busca.
- Navegação por teclado e suporte a leitores de tela.
- Contraste adequado, foco visível e labels associados aos campos.
- Sanitização e validação de dados no cliente e no servidor.
- Armazenamento seguro de credenciais, sem senhas em texto puro.
- Controle de permissões por usuário e empresa.
- Proteção contra spam, abuso de cliques e links maliciosos.
- Não coletar nem exibir dados pessoais desnecessários.
- Preparar a estrutura para paginação e crescimento do número de anúncios.

## Modelo de dados sugerido

### Empresa/Anúncio

- `id`
- `ownerId`
- `name`
- `description`
- `categories`
- `logoUrl`
- `imageUrls`
- `phone`
- `whatsappUrl`
- `instagramUrl`
- `address`
- `city`
- `neighborhood`
- `latitude`
- `longitude`
- `businessHours`
- `orderUrl`
- `status`
- `createdAt`
- `updatedAt`

### Interação

- `id`
- `companyId`
- `type`
- `sessionId` anonimizado
- `createdAt`

Não armazenar nome, telefone ou outros dados pessoais do cliente apenas para
contabilizar uma interação.

## Critérios de aceitação

- Um cliente consegue encontrar uma empresa digitando um termo na busca.
- A barra lateral de serviços abre e fecha corretamente e aplica filtros.
- Um card apresenta as informações essenciais e os canais disponíveis.
- Cada botão de contato registra o tipo de interação correspondente.
- O contador não aumenta várias vezes por um clique acidental repetido.
- Um empresário consegue criar uma conta e publicar seu anúncio.
- O empresário consegue editar o anúncio sem alterar dados de terceiros.
- O dashboard exibe métricas coerentes com as interações registradas.
- O sistema diferencia anúncio publicado, pausado e em rascunho.
- O layout permanece utilizável em telas de celular e desktop.
- Erros de validação e falhas de rede são informados ao usuário sem dados
  inválidos ou estados de sucesso falsos.

## Entregáveis esperados

1. Interface pública do cliente em `html`.
2. Interface administrativa em `htmladm`.
3. Componentes reutilizáveis de busca, filtros, cards, detalhe e métricas.
4. Fluxo de autenticação e autorização.
5. Persistência dos anúncios e das interações.
6. Validações de formulário e estados de carregamento/erro.
7. Testes dos fluxos principais de busca, cadastro, contato e métricas.
8. Documentação breve para executar o projeto e configurar os serviços
   externos necessários, como mapa, autenticação e armazenamento de imagens.

## Diretriz de implementação

Antes de codificar, analisar a estrutura existente do projeto e reutilizar os
componentes, estilos e padrões já adotados. Não inventar integrações sem
configuração: quando um serviço externo não estiver disponível, criar uma
camada de integração bem definida e documentar as variáveis de ambiente
necessárias. Implementar primeiro o fluxo essencial ponta a ponta:

1. busca pública;
2. detalhe do anúncio;
3. clique em um canal de contato;
4. cadastro/login do empresário;
5. criação do anúncio;
6. dashboard com métricas.

Manter o código organizado, tipado, validado e preparado para a futura inclusão
de moderação, avaliações, favoritos e notificações.