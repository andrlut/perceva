import { normalizeSearch } from '@/lib/icons';

/**
 * The categorized, bilingual icon catalog behind IconPickerModal.
 * GENERATED on 2026-09-22 from a curated list + review patches; every id was
 * verified against the Ionicons / MaterialCommunityIcons glyph maps at
 * generation time. Bare ids are Ionicons, `mdi:` ids are
 * MaterialCommunityIcons (see lib/icons). Labels are what a person types to
 * find the icon, in both app languages; an id that lives in more than one
 * category carries the SAME label everywhere (a different meaning gets a
 * different glyph), so the cell announces what the section shows.
 */
export type IconCategoryId =
  | 'health'
  | 'food'
  | 'sport'
  | 'mind'
  | 'work'
  | 'tech'
  | 'home'
  | 'people'
  | 'fun'
  | 'outdoors'
  | 'quit'
  | 'time'
  | 'symbols';

export interface IconEntry {
  id: string;
  /** Short pt-BR label (search + accessibility). */
  pt: string;
  /** Short en-US label. */
  en: string;
  /** Extra search words, both languages. */
  kw?: string;
}

export interface IconCategory {
  id: IconCategoryId;
  /** Chip glyph. */
  icon: string;
  /** Category words (both languages) every entry is searchable by. */
  kw: string;
  entries: IconEntry[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    id: 'health',
    icon: 'heart',
    kw: 'saúde saude health sono sleep bem-estar wellness',
    entries: [
      { id: 'heart', pt: 'coração', en: 'heart', kw: 'saúde amor health love' },
      { id: 'pulse', pt: 'batimentos', en: 'pulse', kw: 'pulso cardio heartbeat' },
      { id: 'bed', pt: 'cama', en: 'bed', kw: 'dormir deitar sleep arrumar' },
      { id: 'mdi:sleep', pt: 'sono', en: 'sleep', kw: 'dormir noite night' },
      { id: 'water', pt: 'água', en: 'water', kw: 'hidratação beber hydration drink' },
      { id: 'sunny', pt: 'sol', en: 'sun', kw: 'manhã luz acordar sunlight dia day clima weather claridade' },
      { id: 'medkit', pt: 'kit médico', en: 'first aid', kw: 'primeiros socorros medkit' },
      { id: 'mdi:pill', pt: 'remédio', en: 'pill', kw: 'comprimido medicamento medicine' },
      { id: 'bandage', pt: 'curativo', en: 'bandage', kw: 'band-aid ferida machucado wound' },
      { id: 'thermometer', pt: 'termômetro', en: 'thermometer', kw: 'febre temperatura fever' },
      { id: 'mdi:tooth', pt: 'dente', en: 'tooth', kw: 'dentista dental teeth' },
      { id: 'mdi:toothbrush', pt: 'escova de dente', en: 'toothbrush', kw: 'escovar dentes brush teeth' },
      { id: 'mdi:shower', pt: 'banho', en: 'shower', kw: 'chuveiro ducha bath' },
      { id: 'mdi:scale-bathroom', pt: 'balança', en: 'scale', kw: 'peso pesar weight weigh' },
      { id: 'eye', pt: 'olho', en: 'eye', kw: 'visão enxergar vision' },
      { id: 'glasses', pt: 'óculos', en: 'glasses', kw: 'visão oculista eyeglasses leitura reading ler' },
      { id: 'mdi:shield-sun', pt: 'protetor solar', en: 'sunscreen', kw: 'sol proteção fps sun protection' },
      { id: 'mdi:stethoscope', pt: 'estetoscópio', en: 'stethoscope', kw: 'médico consulta doctor checkup' },
      { id: 'mdi:lungs', pt: 'pulmão', en: 'lungs', kw: 'respirar respiração breathe' },
      { id: 'mdi:hand-wash', pt: 'lavar as mãos', en: 'hand washing', kw: 'higiene hygiene hands' },
      { id: 'mdi:face-mask', pt: 'máscara', en: 'face mask', kw: 'proteção gripe covid' },
      { id: 'mdi:lotion', pt: 'hidratante', en: 'lotion', kw: 'creme pele skincare cream' },
      { id: 'alarm', pt: 'despertador', en: 'alarm', kw: 'acordar relógio wake up alarme' },
      { id: 'mdi:needle', pt: 'vacina', en: 'vaccine', kw: 'injeção agulha shot injection' },
      { id: 'mdi:doctor', pt: 'médico', en: 'doctor', kw: 'consulta hospital clinic' },
      { id: 'body', pt: 'corpo', en: 'body', kw: 'postura físico posture' },
      { id: 'mdi:content-cut', pt: 'cabelo', en: 'haircut', kw: 'barba barbeiro salão corte' },
    ],
  },
  {
    id: 'food',
    icon: 'restaurant',
    kw: 'comida food alimentação alimentacao bebida drink',
    entries: [
      { id: 'restaurant', pt: 'refeição', en: 'meal', kw: 'restaurante comer talheres eat almoço jantar lunch dinner' },
      { id: 'cafe', pt: 'café', en: 'coffee', kw: 'cafeína xícara caffeine' },
      { id: 'nutrition', pt: 'fruta', en: 'fruit', kw: 'maçã apple saudável' },
      { id: 'mdi:nutrition', pt: 'nutrição', en: 'nutrition', kw: 'dieta saudável prato healthy diet' },
      { id: 'fast-food', pt: 'fast food', en: 'fast food', kw: 'hambúrguer lanche burger junk delivery ifood pedir' },
      { id: 'pizza', pt: 'pizza', en: 'pizza', kw: 'fatia italiana' },
      { id: 'mdi:bottle-soda', pt: 'garrafa de água', en: 'water bottle', kw: 'garrafinha hidratar hydration' },
      { id: 'mdi:tea', pt: 'chá', en: 'tea', kw: 'infusão verde' },
      { id: 'beer', pt: 'cerveja', en: 'beer', kw: 'álcool chope bebida alcohol beber drink drinking chopp breja copo' },
      { id: 'wine', pt: 'vinho', en: 'wine', kw: 'taça álcool alcohol beber bebida drink drinking glass' },
      { id: 'mdi:glass-cocktail', pt: 'drink', en: 'cocktail', kw: 'coquetel bebida álcool bar beber drinking alcohol' },
      { id: 'ice-cream', pt: 'sorvete', en: 'ice cream', kw: 'doce gelado dessert' },
      { id: 'mdi:chef-hat', pt: 'cozinhar', en: 'cooking', kw: 'cozinha receita chef cook' },
      { id: 'mdi:bowl', pt: 'salada', en: 'salad', kw: 'tigela verduras greens bowl' },
      { id: 'mdi:carrot', pt: 'cenoura', en: 'carrot', kw: 'legume verdura vegetal vegetable' },
      { id: 'egg', pt: 'ovo', en: 'egg', kw: 'café da manhã proteína breakfast' },
      { id: 'mdi:food-drumstick', pt: 'frango', en: 'chicken', kw: 'carne proteína meat protein' },
      { id: 'mdi:food-steak', pt: 'carne', en: 'meat', kw: 'churrasco bife steak beef' },
      { id: 'fish', pt: 'peixe', en: 'fish', kw: 'frutos do mar seafood' },
      { id: 'mdi:bread-slice', pt: 'pão', en: 'bread', kw: 'padaria torrada toast' },
      { id: 'mdi:rice', pt: 'arroz', en: 'rice', kw: 'grão cereal grain' },
      { id: 'mdi:noodles', pt: 'macarrão', en: 'pasta', kw: 'massa noodles' },
      { id: 'mdi:cake-variant', pt: 'bolo', en: 'cake', kw: 'sobremesa aniversário dessert birthday' },
      { id: 'mdi:cookie', pt: 'biscoito', en: 'cookie', kw: 'bolacha lanche snack' },
      { id: 'mdi:candy', pt: 'doce', en: 'candy', kw: 'bala açúcar sweets sugar chocolate' },
      { id: 'mdi:blender', pt: 'vitamina', en: 'smoothie', kw: 'liquidificador shake suco juice' },
    ],
  },
  {
    id: 'sport',
    icon: 'barbell',
    kw: 'esporte esportes sport sports exercício exercicio exercise treino workout',
    entries: [
      { id: 'walk', pt: 'caminhada', en: 'walk', kw: 'caminhar andar walking' },
      { id: 'mdi:run', pt: 'corrida', en: 'run', kw: 'correr running jog treino exercício exercise workout' },
      { id: 'fitness', pt: 'cardio', en: 'cardio', kw: 'treino exercício fitness workout coração heart' },
      { id: 'barbell', pt: 'musculação', en: 'weights', kw: 'academia halter gym dumbbell treino exercício exercise workout' },
      { id: 'mdi:weight-lifter', pt: 'levantar peso', en: 'weight lifting', kw: 'crossfit powerlifting' },
      { id: 'bicycle', pt: 'bicicleta', en: 'bicycle', kw: 'pedalar bike ciclismo cycling' },
      { id: 'mdi:yoga', pt: 'yoga', en: 'yoga', kw: 'ioga pilates' },
      { id: 'mdi:meditation', pt: 'meditação', en: 'meditation', kw: 'mindfulness respirar meditar meditate breathe' },
      { id: 'mdi:human-handsup', pt: 'alongamento', en: 'stretching', kw: 'alongar mobilidade stretch' },
      { id: 'mdi:swim', pt: 'natação', en: 'swimming', kw: 'nadar piscina pool' },
      { id: 'football', pt: 'futebol', en: 'soccer', kw: 'bola pelada football' },
      { id: 'basketball', pt: 'basquete', en: 'basketball', kw: 'bola cesta hoop' },
      { id: 'tennisball', pt: 'tênis', en: 'tennis', kw: 'raquete racket' },
      { id: 'mdi:volleyball', pt: 'vôlei', en: 'volleyball', kw: 'volei voleibol' },
      { id: 'mdi:boxing-glove', pt: 'boxe', en: 'boxing', kw: 'luva muay thai' },
      { id: 'mdi:karate', pt: 'luta', en: 'martial arts', kw: 'karatê jiu-jitsu judô taekwondo' },
      { id: 'mdi:hiking', pt: 'trilha', en: 'hiking', kw: 'montanha trekking caminhada hike walk' },
      { id: 'mdi:jump-rope', pt: 'pular corda', en: 'jump rope', kw: 'skipping' },
      { id: 'mdi:arm-flex', pt: 'força', en: 'strength', kw: 'músculo bíceps muscle' },
      { id: 'footsteps', pt: 'passos', en: 'steps', kw: 'passo pegadas walking' },
      { id: 'mdi:dance-ballroom', pt: 'dança', en: 'dance', kw: 'dançar zumba dancing baile' },
      { id: 'mdi:table-tennis', pt: 'ping-pong', en: 'table tennis', kw: 'tênis de mesa' },
      { id: 'mdi:rowing', pt: 'remo', en: 'rowing', kw: 'remar remador' },
      { id: 'mdi:skateboard', pt: 'skate', en: 'skateboard', kw: 'skating' },
      { id: 'mdi:surfing', pt: 'surfe', en: 'surfing', kw: 'surf prancha onda wave' },
      { id: 'mdi:carabiner', pt: 'escalada', en: 'climbing', kw: 'escalar boulder climb' },
    ],
  },
  {
    id: 'mind',
    icon: 'book',
    kw: 'mente mind estudo study aprender learn',
    entries: [
      { id: 'book', pt: 'livro', en: 'book', kw: 'ler leitura read reading estudar estudo study aprender learn curso course prova exam romance' },
      { id: 'library', pt: 'biblioteca', en: 'library', kw: 'livros books estante shelf estudar estudo study curso course prova exam' },
      { id: 'school', pt: 'escola', en: 'school', kw: 'formatura graduation faculdade college estudar estudo study curso course aula class prova exam' },
      { id: 'pencil', pt: 'lápis', en: 'pencil', kw: 'escrever write escrita writing desenhar draw' },
      { id: 'journal', pt: 'diário', en: 'journal', kw: 'caderno notebook anotações notes' },
      { id: 'mdi:brain', pt: 'cérebro', en: 'brain', kw: 'mente mind memória memory' },
      { id: 'mdi:meditation', pt: 'meditação', en: 'meditation', kw: 'mindfulness respirar meditar meditate breathe' },
      { id: 'bulb', pt: 'ideia', en: 'idea', kw: 'lâmpada lightbulb insight' },
      { id: 'extension-puzzle', pt: 'quebra-cabeça', en: 'puzzle', kw: 'peça piece jogo game' },
      { id: 'mdi:chess-knight', pt: 'xadrez', en: 'chess', kw: 'cavalo knight estratégia strategy tabuleiro board' },
      { id: 'language', pt: 'idioma', en: 'language', kw: 'tradução translate inglês english' },
      { id: 'calculator', pt: 'calculadora', en: 'calculator', kw: 'matemática math contas' },
      { id: 'flask', pt: 'ciência', en: 'science', kw: 'frasco flask química chemistry lab' },
      { id: 'telescope', pt: 'telescópio', en: 'telescope', kw: 'astronomia astronomy estrelas stars' },
      { id: 'mdi:microscope', pt: 'microscópio', en: 'microscope', kw: 'laboratório lab biologia biology' },
      { id: 'mdi:atom', pt: 'átomo', en: 'atom', kw: 'física physics ciência science' },
      { id: 'mdi:podcast', pt: 'podcast', en: 'podcast', kw: 'áudio audio audiobook ouvir listen episódio' },
      { id: 'glasses', pt: 'óculos', en: 'glasses', kw: 'visão oculista eyeglasses leitura reading ler' },
      { id: 'mdi:target', pt: 'foco', en: 'focus', kw: 'alvo target concentração concentration' },
      { id: 'timer', pt: 'pomodoro', en: 'pomodoro', kw: 'cronômetro timer tempo time temporizador contagem countdown' },
      { id: 'mdi:thought-bubble', pt: 'reflexão', en: 'reflection', kw: 'pensar think pensamento thought' },
      { id: 'mdi:notebook', pt: 'caderno', en: 'notebook', kw: 'anotações notes estudo study estudar lição lesson dever homework curso course prova exam' },
      { id: 'newspaper', pt: 'notícias', en: 'news', kw: 'jornal newspaper artigo article' },
      { id: 'easel', pt: 'quadro', en: 'whiteboard', kw: 'aula class lousa ensinar teach curso course estudar' },
      { id: 'mdi:dna', pt: 'dna', en: 'dna', kw: 'genética genetics biologia biology' },
      { id: 'mdi:hands-pray', pt: 'oração', en: 'prayer', kw: 'rezar orar igreja gratidão pray' },
      { id: 'mdi:head-heart', pt: 'terapia', en: 'therapy', kw: 'psicólogo terapeuta saúde mental health' },
    ],
  },
  {
    id: 'work',
    icon: 'briefcase',
    kw: 'trabalho work dinheiro money carreira career finanças financas finance',
    entries: [
      { id: 'briefcase', pt: 'trabalho', en: 'work', kw: 'maleta emprego job carreira career' },
      { id: 'business', pt: 'escritório', en: 'office', kw: 'prédio building empresa company' },
      { id: 'cash', pt: 'dinheiro', en: 'cash', kw: 'grana money nota bill' },
      { id: 'card', pt: 'cartão', en: 'credit card', kw: 'crédito débito debit' },
      { id: 'wallet', pt: 'carteira', en: 'wallet', kw: 'dinheiro money' },
      { id: 'mdi:piggy-bank', pt: 'cofrinho', en: 'piggy bank', kw: 'poupança savings economizar save investir investimento invest poupar' },
      { id: 'mdi:bank', pt: 'banco', en: 'bank', kw: 'conta account' },
      { id: 'trending-up', pt: 'crescimento', en: 'growth', kw: 'gráfico chart tendência trend investir investimento invest poupar alta subir' },
      { id: 'receipt', pt: 'recibo', en: 'receipt', kw: 'conta bill fatura nota fiscal' },
      { id: 'pricetag', pt: 'etiqueta', en: 'price tag', kw: 'preço promoção sale' },
      { id: 'cart', pt: 'carrinho', en: 'cart', kw: 'compras shopping mercado groceries' },
      { id: 'storefront', pt: 'loja', en: 'store', kw: 'comércio shop' },
      { id: 'mdi:handshake', pt: 'acordo', en: 'handshake', kw: 'negociação deal parceria partnership aperto de mão abraço hug encontro' },
      { id: 'mdi:presentation', pt: 'apresentação', en: 'presentation', kw: 'reunião meeting slides' },
      { id: 'mdi:clipboard-check', pt: 'checklist', en: 'checklist', kw: 'lista tarefas tasks prancheta' },
      { id: 'document-text', pt: 'documento', en: 'document', kw: 'arquivo file contrato contract anotação note nota notas texto' },
      { id: 'mdi:bullseye-arrow', pt: 'meta', en: 'goal', kw: 'alvo target objetivo' },
      { id: 'mdi:safe', pt: 'cofre', en: 'safe', kw: 'vault segurança security' },
      { id: 'logo-usd', pt: 'cifrão', en: 'dollar', kw: 'moeda coin currency real' },
      { id: 'stats-chart', pt: 'gráfico', en: 'chart', kw: 'estatística stats relatório report' },
      { id: 'calendar', pt: 'agenda', en: 'calendar', kw: 'calendário prazo deadline data date' },
      { id: 'mdi:account-group', pt: 'equipe', en: 'team', kw: 'time grupo group' },
      { id: 'mail', pt: 'e-mail', en: 'email', kw: 'correio inbox mensagem carta mail letter' },
      { id: 'mdi:percent', pt: 'juros', en: 'interest', kw: 'porcentagem percent desconto discount' },
      { id: 'mdi:bitcoin', pt: 'cripto', en: 'crypto', kw: 'bitcoin investimento investment' },
    ],
  },
  {
    id: 'tech',
    icon: 'phone-portrait',
    kw: 'tech tecnologia technology telas screens digital',
    entries: [
      { id: 'phone-portrait', pt: 'celular', en: 'phone', kw: 'smartphone telefone mobile' },
      { id: 'mdi:cellphone-off', pt: 'sem celular', en: 'phone off', kw: 'desligado detox digital offline tela screen telefone desligar' },
      { id: 'laptop', pt: 'notebook', en: 'laptop', kw: 'computador computer' },
      { id: 'desktop', pt: 'computador', en: 'desktop', kw: 'pc monitor tela screen computer' },
      { id: 'mdi:keyboard', pt: 'teclado', en: 'keyboard', kw: 'digitar typing' },
      { id: 'mdi:mouse', pt: 'mouse', en: 'mouse', kw: 'clique click' },
      { id: 'hardware-chip', pt: 'chip', en: 'chip', kw: 'processador cpu processor' },
      { id: 'server', pt: 'servidor', en: 'server', kw: 'dados data rack' },
      { id: 'wifi', pt: 'wi-fi', en: 'wifi', kw: 'internet rede network conexão' },
      { id: 'bluetooth', pt: 'bluetooth', en: 'bluetooth', kw: 'sem fio wireless' },
      { id: 'battery-full', pt: 'bateria', en: 'battery', kw: 'carga charge carregador charger' },
      { id: 'watch', pt: 'smartwatch', en: 'smartwatch', kw: 'relógio watch pulseira' },
      { id: 'tv', pt: 'tv', en: 'tv', kw: 'televisão television série series assistir' },
      { id: 'headset', pt: 'headset', en: 'headset', kw: 'fone headphones áudio fones ouvir listen' },
      { id: 'game-controller', pt: 'videogame', en: 'game controller', kw: 'jogo controle gamepad jogar play' },
      { id: 'mdi:robot', pt: 'robô', en: 'robot', kw: 'ia ai inteligência artificial' },
      { id: 'code-slash', pt: 'código', en: 'code', kw: 'programar programming dev' },
      { id: 'terminal', pt: 'terminal', en: 'terminal', kw: 'console shell comando command' },
      { id: 'tablet-portrait', pt: 'tablet', en: 'tablet', kw: 'ipad' },
      { id: 'camera', pt: 'câmera', en: 'camera', kw: 'foto photo fotografia' },
      { id: 'mdi:usb-flash-drive', pt: 'pendrive', en: 'usb', kw: 'flash drive' },
      { id: 'mdi:harddisk', pt: 'armazenamento', en: 'storage', kw: 'hd disco disk memória memory' },
      { id: 'cloud', pt: 'nuvem', en: 'cloud', kw: 'backup sincronizar sync' },
      { id: 'mdi:router-wireless', pt: 'roteador', en: 'router', kw: 'modem internet' },
      { id: 'mdi:earbuds', pt: 'fone de ouvido', en: 'earbuds', kw: 'airpods fones' },
      { id: 'qr-code', pt: 'qr code', en: 'qr code', kw: 'código escanear scan' },
    ],
  },
  {
    id: 'home',
    icon: 'home',
    kw: 'casa home rotina routine tarefas domésticas chores',
    entries: [
      { id: 'home', pt: 'casa', en: 'home', kw: 'lar house' },
      { id: 'bed', pt: 'cama', en: 'bed', kw: 'dormir deitar sleep arrumar' },
      { id: 'mdi:broom', pt: 'vassoura', en: 'broom', kw: 'varrer sweep faxina limpar limpeza clean cleaning' },
      { id: 'mdi:washing-machine', pt: 'máquina de lavar', en: 'washing machine', kw: 'roupa laundry lavanderia' },
      { id: 'mdi:dishwasher', pt: 'louça', en: 'dishes', kw: 'lava-louças dishwasher pratos' },
      { id: 'mdi:stove', pt: 'fogão', en: 'stove', kw: 'cozinhar cooking cozinha kitchen' },
      { id: 'mdi:fridge', pt: 'geladeira', en: 'fridge', kw: 'refrigerator' },
      { id: 'trash', pt: 'lixo', en: 'trash', kw: 'lixeira garbage bin' },
      { id: 'mdi:bathtub', pt: 'banheira', en: 'bathtub', kw: 'banho bath relaxar' },
      { id: 'mdi:vacuum', pt: 'aspirador', en: 'vacuum', kw: 'aspirar pó dust limpar limpeza clean cleaning' },
      { id: 'mdi:iron', pt: 'ferro de passar', en: 'iron', kw: 'roupa ironing' },
      { id: 'mdi:hanger', pt: 'cabide', en: 'hanger', kw: 'roupa clothes armário closet' },
      { id: 'mdi:sofa', pt: 'sofá', en: 'sofa', kw: 'sala couch' },
      { id: 'key', pt: 'chave', en: 'key', kw: 'porta door' },
      { id: 'basket', pt: 'cesta', en: 'shopping basket', kw: 'compras mercado groceries' },
      { id: 'cart', pt: 'carrinho', en: 'cart', kw: 'compras shopping mercado groceries' },
      { id: 'build', pt: 'chave inglesa', en: 'wrench', kw: 'conserto repair ferramenta tool' },
      { id: 'hammer', pt: 'martelo', en: 'hammer', kw: 'reforma diy ferramenta' },
      { id: 'mdi:format-paint', pt: 'rolo de tinta', en: 'paint roller', kw: 'pintar parede wall' },
      { id: 'mdi:recycle', pt: 'reciclagem', en: 'recycle', kw: 'reciclar lixo' },
      { id: 'mdi:watering-can', pt: 'regador', en: 'watering can', kw: 'planta plant regar water' },
      { id: 'mdi:toilet', pt: 'vaso sanitário', en: 'toilet', kw: 'banheiro bathroom privada' },
      { id: 'cog', pt: 'engrenagem', en: 'settings', kw: 'ajustes config gear' },
      { id: 'shirt', pt: 'camiseta', en: 't-shirt', kw: 'roupa roupas clothes' },
      { id: 'construct', pt: 'ferramentas', en: 'tools', kw: 'construir build reforma consertar fix' },
    ],
  },
  {
    id: 'people',
    icon: 'people',
    kw: 'pessoas people afeto relações relacionamento relationships família family social',
    entries: [
      { id: 'people', pt: 'pessoas', en: 'people', kw: 'grupo group amigos friends' },
      { id: 'person', pt: 'pessoa', en: 'person', kw: 'alguém someone perfil' },
      { id: 'heart', pt: 'coração', en: 'heart', kw: 'saúde amor health love' },
      { id: 'mdi:hand-heart', pt: 'cuidado', en: 'care', kw: 'carinho ajuda help apoio' },
      { id: 'chatbubbles', pt: 'conversa', en: 'chat', kw: 'mensagem message papo' },
      { id: 'call', pt: 'ligação', en: 'phone call', kw: 'telefonar telefone ligar telefonema' },
      { id: 'mail', pt: 'e-mail', en: 'email', kw: 'correio inbox mensagem carta mail letter' },
      { id: 'gift', pt: 'presente', en: 'gift', kw: 'presentear surprise' },
      { id: 'mdi:party-popper', pt: 'festa', en: 'party', kw: 'celebração celebration comemorar' },
      { id: 'mdi:cake-variant', pt: 'bolo', en: 'cake', kw: 'sobremesa aniversário dessert birthday' },
      { id: 'mdi:baby-face', pt: 'bebê', en: 'baby', kw: 'criança child filho kid' },
      { id: 'mdi:dog', pt: 'cachorro', en: 'dog', kw: 'cão pet' },
      { id: 'mdi:cat', pt: 'gato', en: 'cat', kw: 'pet' },
      { id: 'paw', pt: 'pata', en: 'paw', kw: 'pet animal bicho' },
      { id: 'mdi:ring', pt: 'aliança', en: 'ring', kw: 'casal couple casamento wedding' },
      { id: 'mdi:human-male-female-child', pt: 'família', en: 'family', kw: 'pais filhos parents kids' },
      { id: 'mdi:human-male-female', pt: 'casal', en: 'couple', kw: 'namoro dating parceiro partner namorada namorado girlfriend boyfriend' },
      { id: 'mdi:handshake', pt: 'acordo', en: 'handshake', kw: 'negociação deal parceria partnership aperto de mão abraço hug encontro' },
      { id: 'happy', pt: 'sorriso', en: 'smiley', kw: 'feliz alegria happy joy' },
      { id: 'videocam', pt: 'videochamada', en: 'video call', kw: 'vídeo chamada facetime' },
      { id: 'mdi:flower-tulip', pt: 'tulipa', en: 'tulip', kw: 'flor flores buquê bouquet' },
      { id: 'mdi:account-heart', pt: 'amizade', en: 'friendship', kw: 'amigo friend querido' },
      { id: 'mdi:teddy-bear', pt: 'ursinho', en: 'teddy bear', kw: 'criança brincar child play' },
      { id: 'mdi:baby-carriage', pt: 'carrinho de bebê', en: 'stroller', kw: 'passeio baby walk' },
      { id: 'logo-whatsapp', pt: 'whatsapp', en: 'whatsapp', kw: 'zap mensagem message' },
    ],
  },
  {
    id: 'fun',
    icon: 'game-controller',
    kw: 'lazer fun diversão diversao hobby cultura culture entretenimento entertainment',
    entries: [
      { id: 'musical-notes', pt: 'música', en: 'music', kw: 'som ouvir listen' },
      { id: 'headset', pt: 'headset', en: 'headset', kw: 'fone headphones áudio fones ouvir listen' },
      { id: 'mic', pt: 'microfone', en: 'microphone', kw: 'cantar sing karaokê' },
      { id: 'mdi:guitar-acoustic', pt: 'violão', en: 'guitar', kw: 'tocar play instrumento' },
      { id: 'mdi:piano', pt: 'piano', en: 'piano', kw: 'teclado keyboard tocar' },
      { id: 'mdi:violin', pt: 'violino', en: 'violin', kw: 'instrumento orquestra orchestra' },
      { id: 'film', pt: 'filme', en: 'movie', kw: 'cinema assistir watch' },
      { id: 'mdi:popcorn', pt: 'pipoca', en: 'popcorn', kw: 'cinema sessão' },
      { id: 'tv', pt: 'tv', en: 'tv', kw: 'televisão television série series assistir' },
      { id: 'camera', pt: 'câmera', en: 'camera', kw: 'foto photo fotografia' },
      { id: 'image', pt: 'imagem', en: 'picture', kw: 'pintura painting quadro galeria' },
      { id: 'color-palette', pt: 'paleta', en: 'palette', kw: 'arte art pintar cores colors' },
      { id: 'brush', pt: 'pincel', en: 'brush', kw: 'pintar paint desenho draw' },
      { id: 'game-controller', pt: 'videogame', en: 'game controller', kw: 'jogo controle gamepad jogar play' },
      { id: 'dice', pt: 'dado', en: 'dice', kw: 'tabuleiro board game rpg' },
      { id: 'mdi:cards-playing', pt: 'baralho', en: 'playing cards', kw: 'cartas poker truco pôquer' },
      { id: 'extension-puzzle', pt: 'quebra-cabeça', en: 'puzzle', kw: 'peça piece jogo game' },
      { id: 'ticket', pt: 'ingresso', en: 'ticket', kw: 'evento event show' },
      { id: 'mdi:drama-masks', pt: 'teatro', en: 'theater', kw: 'peça play máscara drama' },
      { id: 'mdi:dance-ballroom', pt: 'dança', en: 'dance', kw: 'dançar zumba dancing baile' },
      { id: 'book', pt: 'livro', en: 'book', kw: 'ler leitura read reading estudar estudo study aprender learn curso course prova exam romance' },
      { id: 'mdi:podcast', pt: 'podcast', en: 'podcast', kw: 'áudio audio audiobook ouvir listen episódio' },
      { id: 'mdi:chess-knight', pt: 'xadrez', en: 'chess', kw: 'cavalo knight estratégia strategy tabuleiro board' },
      { id: 'mdi:ferris-wheel', pt: 'roda-gigante', en: 'ferris wheel', kw: 'parque diversão amusement' },
      { id: 'mdi:trumpet', pt: 'trompete', en: 'trumpet', kw: 'instrumento banda band' },
      { id: 'balloon', pt: 'balão', en: 'balloon', kw: 'festa party aniversário birthday' },
      { id: 'logo-youtube', pt: 'youtube', en: 'youtube', kw: 'vídeo video canal' },
    ],
  },
  {
    id: 'outdoors',
    icon: 'leaf',
    kw: 'natureza nature ar livre outdoors viagem travel transporte',
    entries: [
      { id: 'leaf', pt: 'folha', en: 'leaf', kw: 'natureza nature planta verde' },
      { id: 'mdi:tree', pt: 'árvore', en: 'tree', kw: 'parque park floresta forest' },
      { id: 'flower', pt: 'flor', en: 'flower', kw: 'jardim garden' },
      { id: 'earth', pt: 'planeta', en: 'earth', kw: 'terra mundo world globo' },
      { id: 'sunny', pt: 'sol', en: 'sun', kw: 'manhã luz acordar sunlight dia day clima weather claridade' },
      { id: 'rainy', pt: 'chuva', en: 'rain', kw: 'clima weather' },
      { id: 'snow', pt: 'neve', en: 'snow', kw: 'frio cold inverno winter' },
      { id: 'umbrella', pt: 'guarda-chuva', en: 'umbrella', kw: 'chuva rain' },
      { id: 'map', pt: 'mapa', en: 'map', kw: 'rota route viagem' },
      { id: 'location', pt: 'local', en: 'map pin', kw: 'lugar place destino' },
      { id: 'compass', pt: 'bússola', en: 'compass', kw: 'direção direction explorar' },
      { id: 'car', pt: 'carro', en: 'car', kw: 'dirigir drive' },
      { id: 'bicycle', pt: 'bicicleta', en: 'bicycle', kw: 'pedalar bike ciclismo cycling' },
      { id: 'bus', pt: 'ônibus', en: 'bus', kw: 'transporte transit' },
      { id: 'train', pt: 'trem', en: 'train', kw: 'metrô subway' },
      { id: 'airplane', pt: 'avião', en: 'airplane', kw: 'viagem travel voo flight' },
      { id: 'boat', pt: 'barco', en: 'boat', kw: 'navio ship mar sea' },
      { id: 'mdi:bag-suitcase', pt: 'mala', en: 'suitcase', kw: 'viagem travel bagagem' },
      { id: 'mdi:passport', pt: 'passaporte', en: 'passport', kw: 'viagem travel exterior abroad' },
      { id: 'mdi:tent', pt: 'barraca', en: 'tent', kw: 'acampar camping' },
      { id: 'mdi:campfire', pt: 'fogueira', en: 'campfire', kw: 'acampamento camping fogo' },
      { id: 'mdi:beach', pt: 'praia', en: 'beach', kw: 'mar sea sol' },
      { id: 'mdi:image-filter-hdr', pt: 'montanha', en: 'mountain', kw: 'trilha hike serra' },
      { id: 'mdi:hiking', pt: 'trilha', en: 'hiking', kw: 'montanha trekking caminhada hike walk' },
      { id: 'binoculars', pt: 'binóculos', en: 'binoculars', kw: 'observar watch explorar' },
      { id: 'mdi:hook', pt: 'pesca', en: 'fishing', kw: 'pescar peixe anzol' },
      { id: 'mdi:motorbike', pt: 'moto', en: 'motorbike', kw: 'motocicleta motorcycle' },
    ],
  },
  {
    id: 'quit',
    icon: 'ban',
    kw: 'largar quit parar stop evitar avoid vício vicio vice hábito habit cut back',
    entries: [
      { id: 'mdi:smoking', pt: 'cigarro', en: 'cigarette', kw: 'fumar smoke tabaco nicotina nicotine vape pod' },
      { id: 'mdi:smoking-off', pt: 'sem cigarro', en: 'no smoking', kw: 'parar de fumar quit' },
      { id: 'ban', pt: 'proibido', en: 'forbidden', kw: 'não nunca bloqueio ban stop largar parar evitar zero quit avoid' },
      { id: 'mdi:bottle-wine', pt: 'bebida', en: 'alcohol', kw: 'álcool garrafa bottle booze beber drink drinking' },
      { id: 'mdi:glass-cocktail-off', pt: 'sem álcool', en: 'no alcohol', kw: 'sóbrio sober abstinência dry' },
      { id: 'beer', pt: 'cerveja', en: 'beer', kw: 'álcool chope bebida alcohol beber drink drinking chopp breja copo' },
      { id: 'wine', pt: 'vinho', en: 'wine', kw: 'taça álcool alcohol beber bebida drink drinking glass' },
      { id: 'mdi:glass-cocktail', pt: 'drink', en: 'cocktail', kw: 'coquetel bebida álcool bar beber drinking alcohol' },
      { id: 'mdi:cellphone-off', pt: 'sem celular', en: 'phone off', kw: 'desligado detox digital offline tela screen telefone desligar' },
      { id: 'logo-instagram', pt: 'redes sociais', en: 'social media', kw: 'rede scroll rolagem rolar feed instagram tiktok youtube facebook whatsapp zap celular' },
      { id: 'mdi:television-off', pt: 'sem tv', en: 'tv off', kw: 'televisão television série streaming' },
      { id: 'mdi:candy-off', pt: 'sem doce', en: 'no sweets', kw: 'açúcar sugar candy bala chocolate' },
      { id: 'mdi:hamburger-off', pt: 'sem fast food', en: 'no junk food', kw: 'besteira porcaria lanche delivery ifood pedir' },
      { id: 'mdi:bottle-soda-classic', pt: 'refrigerante', en: 'soda', kw: 'coca refri açúcar sugar' },
      { id: 'mdi:coffee-off', pt: 'sem café', en: 'no coffee', kw: 'cafeína caffeine' },
      { id: 'mdi:cart-off', pt: 'sem compras', en: 'no shopping', kw: 'gastar spending carrinho cart' },
      { id: 'mdi:credit-card-off', pt: 'sem cartão', en: 'no credit card', kw: 'gastos dívida debt parcela' },
      { id: 'mdi:poker-chip', pt: 'apostas', en: 'gambling', kw: 'aposta bets betting jogo de azar cassino casino' },
      { id: 'mdi:slot-machine', pt: 'caça-níquel', en: 'slot machine', kw: 'cassino casino aposta bet apostas bets betting' },
      { id: 'mdi:cards-playing', pt: 'baralho', en: 'playing cards', kw: 'cartas poker truco pôquer' },
      { id: 'mdi:cannabis', pt: 'maconha', en: 'cannabis', kw: 'erva weed marijuana droga drogas drugs' },
      { id: 'mdi:pill-off', pt: 'drogas', en: 'drugs', kw: 'droga remédio pills vício' },
      { id: 'mdi:sleep-off', pt: 'dormir tarde', en: 'late night', kw: 'madrugada insônia virar a noite sleep' },
      { id: 'mdi:controller-off', pt: 'sem videogame', en: 'no gaming', kw: 'jogo game controle console' },
      { id: 'mdi:cigar', pt: 'charuto', en: 'cigar', kw: 'tabaco tobacco' },
      { id: 'mdi:alarm-snooze', pt: 'soneca', en: 'snooze', kw: 'adiar alarme oversleep' },
      { id: 'mdi:food-off', pt: 'jejum', en: 'fasting', kw: 'sem comer beliscar snacking' },
      { id: 'mdi:food-takeout-box', pt: 'delivery', en: 'takeout', kw: 'ifood pedir comida' },
      { id: 'mdi:hand-back-left', pt: 'roer unha', en: 'nail biting', kw: 'unhas nails' },
    ],
  },
  {
    id: 'time',
    icon: 'time',
    kw: 'tempo time rotina planning organização organizacao planejamento agenda',
    entries: [
      { id: 'time', pt: 'relógio', en: 'clock', kw: 'hora hour horário time' },
      { id: 'alarm', pt: 'despertador', en: 'alarm', kw: 'acordar relógio wake up alarme' },
      { id: 'calendar', pt: 'agenda', en: 'calendar', kw: 'calendário prazo deadline data date' },
      { id: 'mdi:calendar-check', pt: 'compromisso', en: 'appointment', kw: 'calendário check agenda done' },
      { id: 'hourglass', pt: 'ampulheta', en: 'hourglass', kw: 'tempo espera wait' },
      { id: 'timer', pt: 'pomodoro', en: 'pomodoro', kw: 'cronômetro timer tempo time temporizador contagem countdown' },
      { id: 'checkbox', pt: 'check', en: 'checkbox', kw: 'feito done concluído tick' },
      { id: 'list', pt: 'lista', en: 'list', kw: 'itens tarefas items' },
      { id: 'flag', pt: 'bandeira', en: 'flag', kw: 'marco milestone meta' },
      { id: 'bookmark', pt: 'marcador', en: 'bookmark', kw: 'favorito salvar save' },
      { id: 'notifications', pt: 'lembrete', en: 'reminder', kw: 'sino bell notificação alerta' },
      { id: 'mdi:progress-check', pt: 'progresso', en: 'progress', kw: 'andamento avanço status' },
      { id: 'mdi:bullseye-arrow', pt: 'meta', en: 'goal', kw: 'alvo target objetivo' },
      { id: 'pin', pt: 'alfinete', en: 'pin', kw: 'fixar fixado pinned' },
      { id: 'folder', pt: 'pasta', en: 'folder', kw: 'arquivo organizar files' },
      { id: 'document-text', pt: 'documento', en: 'document', kw: 'arquivo file contrato contract anotação note nota notas texto' },
      { id: 'repeat', pt: 'rotina', en: 'routine', kw: 'repetir repeat hábito ciclo' },
      { id: 'mdi:weather-sunset-up', pt: 'amanhecer', en: 'sunrise', kw: 'manhã morning nascer do sol' },
      { id: 'mdi:weather-sunset-down', pt: 'entardecer', en: 'sunset', kw: 'noite evening pôr do sol tarde' },
      { id: 'mdi:calendar-week', pt: 'semana', en: 'week', kw: 'agenda semanal weekly' },
      { id: 'today', pt: 'hoje', en: 'today', kw: 'dia day calendário' },
      { id: 'clipboard', pt: 'prancheta', en: 'clipboard', kw: 'planejamento plan planner' },
      { id: 'mdi:clock-alert', pt: 'prazo', en: 'deadline', kw: 'urgente urgent atraso late' },
      { id: 'mdi:calendar-clock', pt: 'agendamento', en: 'schedule', kw: 'horário marcar booking' },
    ],
  },
  {
    id: 'symbols',
    icon: 'sparkles',
    kw: 'símbolos simbolos symbols energia energy motivação motivation',
    entries: [
      { id: 'star', pt: 'estrela', en: 'star', kw: 'favorito favorite' },
      { id: 'sparkles', pt: 'brilho', en: 'sparkles', kw: 'faísca magia novo shine' },
      { id: 'trophy', pt: 'troféu', en: 'trophy', kw: 'vitória win conquista' },
      { id: 'medal', pt: 'medalha', en: 'medal', kw: 'prêmio award' },
      { id: 'ribbon', pt: 'prêmio', en: 'award', kw: 'roseta fita ribbon' },
      { id: 'diamond', pt: 'diamante', en: 'diamond', kw: 'joia gem valor' },
      { id: 'flame', pt: 'chama', en: 'flame', kw: 'fogo fire ofensiva streak' },
      { id: 'flash', pt: 'raio', en: 'lightning', kw: 'energia energy relâmpago bolt' },
      { id: 'rocket', pt: 'foguete', en: 'rocket', kw: 'lançamento impulso launch' },
      { id: 'shield', pt: 'escudo', en: 'shield', kw: 'proteção protection defesa' },
      { id: 'infinite', pt: 'infinito', en: 'infinity', kw: 'sempre eterno forever' },
      { id: 'mdi:scale-balance', pt: 'equilíbrio', en: 'balance', kw: 'balança scale justiça' },
      { id: 'mdi:yin-yang', pt: 'yin yang', en: 'yin yang', kw: 'harmonia harmony tao' },
      { id: 'mdi:peace', pt: 'paz', en: 'peace', kw: 'calma tranquilidade' },
      { id: 'mdi:crown', pt: 'coroa', en: 'crown', kw: 'rei king rainha queen' },
      { id: 'mdi:heart-multiple', pt: 'corações', en: 'hearts', kw: 'amor love carinho' },
      { id: 'mdi:spa', pt: 'lótus', en: 'lotus', kw: 'spa zen relax flor' },
      { id: 'mdi:candle', pt: 'vela', en: 'candle', kw: 'luz light calma' },
      { id: 'mdi:compass-rose', pt: 'rosa dos ventos', en: 'compass rose', kw: 'direção direction norte bússola' },
      { id: 'sync-circle', pt: 'ciclo', en: 'cycle', kw: 'sincronia sync renovar' },
      { id: 'checkmark-circle', pt: 'concluído', en: 'done', kw: 'check feito ok sucesso' },
      { id: 'trending-up', pt: 'crescimento', en: 'growth', kw: 'gráfico chart tendência trend investir investimento invest poupar alta subir' },
      { id: 'mdi:summit', pt: 'cume', en: 'summit', kw: 'montanha mountain pico peak topo' },
      { id: 'sunny', pt: 'sol', en: 'sun', kw: 'manhã luz acordar sunlight dia day clima weather claridade' },
      { id: 'moon', pt: 'lua', en: 'moon', kw: 'noite night' },
      { id: 'mdi:auto-fix', pt: 'varinha', en: 'magic wand', kw: 'mágica truque' },
    ],
  },
];

interface IndexedEntry extends IconEntry {
  category: IconCategoryId;
  /** Pre-normalized haystack: labels + keywords + category words + the glyph slug. */
  haystack: string;
}

const INDEX: IndexedEntry[] = ICON_CATEGORIES.flatMap((c) =>
  c.entries.map((e) => ({
    ...e,
    category: c.id,
    haystack: normalizeSearch(
      [e.pt, e.en, e.kw ?? '', c.kw, e.id.replace(/^mdi:/, '').replace(/-/g, ' ')].join(' '),
    ),
  })),
);

const BY_ID = new Map(INDEX.map((e) => [e.id, e]));

/** Human label for an id in the app language; a glyph slug when the id is
 *  not in the catalog (an old row, a Studio edit). */
export function iconLabel(id: string, locale: 'pt' | 'en'): string {
  const e = BY_ID.get(id);
  if (e) return locale === 'pt' ? e.pt : e.en;
  return id.replace(/^mdi:/, '').replace(/-/g, ' ');
}

/** Entries whose labels / keywords / category / slug contain the
 *  (normalized) query, label matches first. */
export function searchIcons(normalizedQuery: string, locale: 'pt' | 'en'): IconEntry[] {
  const q = normalizedQuery.trim();
  if (!q) return [];
  const starts: IconEntry[] = [];
  const contains: IconEntry[] = [];
  // An id can live in several categories; the search lists it once.
  const seen = new Set<string>();
  for (const e of INDEX) {
    if (seen.has(e.id)) continue;
    const label = normalizeSearch(locale === 'pt' ? e.pt : e.en);
    if (label.startsWith(q)) {
      starts.push(e);
      seen.add(e.id);
    } else if (e.haystack.includes(q)) {
      contains.push(e);
      seen.add(e.id);
    }
  }
  return [...starts, ...contains];
}
