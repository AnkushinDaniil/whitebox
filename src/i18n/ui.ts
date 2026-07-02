// All site-chrome strings, per language. Long-form page prose (About) lives in
// its own component; content (explorables/notes) lives in per-locale MDX.
export const languages = { en: "English", ru: "Русский" } as const;
export const defaultLang = "en";
export type Lang = keyof typeof languages;

export const ui = {
  en: {
    site: {
      tagline: "How Ethereum actually works, made transparent.",
      description:
        "Interactive, explorable explanations of how Ethereum really works — cryptography, state, the EVM, consensus, and networking — for engineers who want real depth, not hand-waving.",
    },
    skip: "Skip to content",
    nav: { hub: "The Execution Layer", notes: "Notes", about: "About" },
    footer: {
      fine: "An authored, practitioner's guide to how Ethereum's execution layer really works.",
      rss: "RSS",
    },
    home: {
      eyebrow: "Interactive explanations of the execution layer",
      headline1: "Ethereum's execution layer,",
      headline2: "made transparent.",
      sub: "Most of Ethereum is taught as a black box: dense specs on one side, app-layer tutorials on the other, nothing in between. Whitebox lives in that gap — one mechanism at a time, each with a live widget you can take apart. Written by a practitioner, for engineers who want to actually understand how it works under the hood.",
      ctaPrimary: "Start with:",
      ctaGhost: "See the full path",
      builtFor: "Built for",
      builtForItems: [
        "Engineers who can read code and reason about systems",
        "Node operators & infra people",
        "Aspiring core / protocol contributors",
      ],
      notFor: "Not for",
      notForItems: [
        '"Crypto-curious" newcomers',
        "Solidity / dApp beginners",
        "Anyone wanting price talk",
      ],
      featuredTag: "Flagship explorable",
      featuredGo: "Open the explorable →",
      spineTitle: "The Execution Layer, explained",
      spineBlurb:
        "An evergreen, ordered path through how Ethereum's EL actually works. Written once, built to last — not a content treadmill.",
      upcomingTitle: "More explorables in progress",
      upcomingDesc:
        "Transactions, gas & the EVM, the mempool, block building, the engine API…",
    },
    hub: {
      eyebrow: "A book you can run",
      h1: "Ethereum, from scratch",
      lede: "One book, read in order. Part I designs the machine from a shared spreadsheet up to a programmable world computer; Part II shows it running; Part III walks every consequential upgrade in the order it shipped. Every chapter derives its idea from a concrete problem, carried by animations built to explain — not decorate.",
      seriesTitle: "Start here — the guided series",
      catTitle: "EIPs by category",
      catLede: "The same upgrades, grouped by what they change. Each links to a full, derive-it-yourself explorable.",
      catExecution: "Execution",
      catExecutionD: "The EVM, gas, and transaction formats — what runs on-chain.",
      catConsensus: "Consensus",
      catConsensusD: "Proof-of-stake, validators, and the beacon chain.",
      catGeneral: "General",
      catGeneralD: "Cross-cutting and application-layer standards.",
      forksTitle: "Every fork, every EIP",
      forksLede: "Ethereum's whole upgrade history, newest first. Highlighted EIPs open a full explorable; the rest link to the spec.",
      forksCl: "CL",
      roadmapTitle: "On the workbench",
      roadmapNote:
        "The path is being built deliberately, not dumped. Next mechanisms in the queue:",
      roadmapItems: [
        "The mempool & the EIP-1559 fee market",
        "The EVM: stack, memory, storage & a live opcode stepper",
        "Gas & metering: what every instruction costs",
        "Blocks, validation & the state transition",
        "Consensus: Proof of Stake, finality & fork choice",
        "Blobs (EIP-4844), statelessness & rollups",
        "Node sync: full, snap, light & checkpoint",
      ],
    },
    notes: {
      eyebrow: "Notes",
      h1: "What changed, explained simply.",
      lede: "The evergreen explorables teach the mechanisms. These are the thin layer on top: when the protocol changes, a short, plain-English note on what moved and why — written for engineers who don't want a 40-tweet thread. Low frequency. High signal.",
      captureHeading: "Get the next note",
    },
    exp: {
      updated: "Updated",
      min: "min",
      byline: "An authored explorable",
      assumed: "Assumed",
    },
    book: {
      part: "Part",
      chapter: "Chapter",
      of: "of",
      prev: "Previous",
      next: "Next",
      toc: "Contents",
      readingChapter: "Reading chapter",
      appLayer: "Application layer",
      parts: {
        I: {
          title: "Designing the machine",
          blurb:
            "Build Ethereum from a shared spreadsheet up to a programmable, staked world computer — inventing each piece the moment you feel its absence.",
        },
        II: {
          title: "Running it",
          blurb:
            "The live clockwork: how a million validators with no leader agree every twelve seconds, how a fresh node catches up, and how clients actually keep the state on disk.",
        },
        III: {
          title: "The upgrades, in order",
          blurb:
            "Every consequential change to Ethereum, in the order it shipped — each one a problem the network hit, derived to its fix.",
        },
      },
    },
    email: {
      eyebrow: "Whitebox · Notes",
      heading: "Get the next explorable",
      blurb:
        "One practitioner's note when something new ships — a new explorable, or a plain-English read on what changed in the protocol. No noise.",
      placeholder: "you@node.eth",
      subscribe: "Subscribe",
      emailLabel: "Email address",
      invalid: "That doesn't look like a valid email.",
      success: "You're in. I'll send the next note when it ships.",
    },
    go: { spec: "SPEC", code: "CODE", eip: "EIP", post: "READ", tool: "TOOL" },
    spec: { fromSpec: "From the spec", clientCode: "Client code", formula: "Formula" },
    widget: { interactive: "Interactive" },
    depth: {
      intuition: { label: "Intuition", n: "01", blurb: "The picture in your head" },
      mechanism: { label: "Mechanism", n: "02", blurb: "How it actually works" },
      spec: { label: "Spec & Code", n: "03", blurb: "Grounded in the real thing" },
      deeper: { label: "Go Deeper", n: "04", blurb: "Where to take it from here" },
    },
    langName: "EN",
  },
  ru: {
    site: {
      tagline: "Как на самом деле работает Ethereum — прозрачно и по-настоящему.",
      description:
        "Интерактивные, разбираемые объяснения того, как на самом деле устроен Ethereum — криптография, состояние, EVM, консенсус и сети — для инженеров, которым нужна настоящая глубина, без размахивания руками.",
    },
    skip: "Перейти к содержимому",
    nav: { hub: "Исполнительный слой", notes: "Заметки", about: "О проекте" },
    footer: {
      fine: "Авторский, практический разбор того, как на самом деле работает исполнительный слой Ethereum.",
      rss: "RSS",
    },
    home: {
      eyebrow: "Интерактивные объяснения исполнительного слоя",
      headline1: "Исполнительный слой Ethereum —",
      headline2: "понятно и прозрачно.",
      sub: "Обычно Ethereum преподают как чёрный ящик: с одной стороны — плотные спецификации, с другой — туториалы прикладного уровня, а между ними пусто. Whitebox живёт ровно в этом промежутке — по одному механизму за раз, каждый с живым виджетом, который можно разобрать на части. Написано практиком для инженеров, которые хотят по-настоящему понять, как всё работает под капотом.",
      ctaPrimary: "Начните с:",
      ctaGhost: "Весь путь целиком",
      builtFor: "Для кого",
      builtForItems: [
        "Инженеров, которые читают код и рассуждают о системах",
        "Операторов узлов и инфраструктурщиков",
        "Будущих контрибьюторов в ядро / протокол",
      ],
      notFor: "Не для",
      notForItems: [
        "«Любопытствующих к крипте» новичков",
        "Начинающих в Solidity / dApp",
        "Тех, кто хочет разговоров о цене",
      ],
      featuredTag: "Флагманский разбор",
      featuredGo: "Открыть разбор →",
      spineTitle: "Исполнительный слой: объяснение",
      spineBlurb:
        "Вечнозелёный, упорядоченный путь по тому, как на самом деле работает исполнительный слой Ethereum. Написано один раз и надолго — это не конвейер контента.",
      upcomingTitle: "Ещё разборы в работе",
      upcomingDesc:
        "Транзакции, газ и EVM, мемпул, сборка блоков, Engine API…",
    },
    hub: {
      eyebrow: "Книга, которую можно запустить",
      h1: "Ethereum с нуля",
      lede: "Одна книга, которую читают по порядку. Часть I проектирует машину — от общей таблицы до программируемого мирового компьютера; Часть II показывает её в работе; Часть III разбирает каждое значимое обновление в порядке выхода. Каждая глава выводит идею из конкретной проблемы, а анимации созданы, чтобы объяснять, а не украшать.",
      seriesTitle: "Начните здесь — путеводитель",
      catTitle: "EIP по категориям",
      catLede: "Те же обновления, сгруппированные по тому, что они меняют. Каждое ведёт к полному разбору.",
      catExecution: "Исполнение",
      catExecutionD: "EVM, газ и форматы транзакций — то, что исполняется в сети.",
      catConsensus: "Консенсус",
      catConsensusD: "Proof-of-stake, валидаторы и beacon-цепочка.",
      catGeneral: "Общее",
      catGeneralD: "Сквозные стандарты и уровень приложений.",
      forksTitle: "Все форки, все EIP",
      forksLede: "Вся история обновлений Ethereum, новые сверху. Выделенные EIP открывают разбор; остальные ведут к спецификации.",
      forksCl: "CL",
      roadmapTitle: "В работе",
      roadmapNote:
        "Путь выстраивается осознанно, а не сваливается кучей. Следующие механизмы в очереди:",
      roadmapItems: [
        "Мемпул и рынок комиссий EIP-1559",
        "EVM: стек, память, хранилище и пошаговый прогон опкодов",
        "Газ и учёт стоимости: сколько стоит каждая инструкция",
        "Блоки, валидация и переход состояния",
        "Консенсус: Proof of Stake, финальность и выбор форка",
        "Блобы (EIP-4844), безсостоятельность и роллапы",
        "Синхронизация узла: full, snap, light и checkpoint",
      ],
    },
    notes: {
      eyebrow: "Заметки",
      h1: "Что изменилось — простыми словами.",
      lede: "Вечнозелёные разборы учат механизмам. А это тонкий слой поверх: когда протокол меняется, короткая заметка простым языком о том, что сдвинулось и почему — для инженеров, которым не нужна ветка из 40 твитов. Редко. По делу.",
      captureHeading: "Получить следующую заметку",
    },
    exp: {
      updated: "Обновлено",
      min: "мин",
      byline: "Авторский разбор",
      assumed: "Предполагается",
    },
    book: {
      part: "Часть",
      chapter: "Глава",
      of: "из",
      prev: "Назад",
      next: "Далее",
      toc: "Содержание",
      readingChapter: "Читаете главу",
      appLayer: "Уровень приложений",
      parts: {
        I: {
          title: "Проектируем машину",
          blurb:
            "Соберите Ethereum от общей таблицы до программируемого мирового компьютера со ставками — изобретая каждую деталь в тот момент, когда чувствуете её нехватку.",
        },
        II: {
          title: "Как это работает",
          blurb:
            "Живой механизм: как миллион валидаторов без лидера договариваются каждые двенадцать секунд, как свежий узел догоняет цепочку и как клиенты на самом деле хранят состояние на диске.",
        },
        III: {
          title: "Обновления, по порядку",
          blurb:
            "Каждое значимое изменение Ethereum в порядке его выхода — каждое как проблема, с которой столкнулась сеть, выведенная до своего решения.",
        },
      },
    },
    email: {
      eyebrow: "Whitebox · Заметки",
      heading: "Получать новые разборы",
      blurb:
        "Одно письмо от практика, когда выходит что-то новое — новый разбор или понятный текст о том, что изменилось в протоколе. Без шума.",
      placeholder: "you@node.eth",
      subscribe: "Подписаться",
      emailLabel: "Электронная почта",
      invalid: "Похоже, это не корректный адрес почты.",
      success: "Готово. Пришлю следующую заметку, когда она выйдет.",
    },
    go: { spec: "СПЕК", code: "КОД", eip: "EIP", post: "ЧИТАТЬ", tool: "ИНСТР" },
    spec: { fromSpec: "Из спецификации", clientCode: "Код клиента", formula: "Формула" },
    widget: { interactive: "Интерактив" },
    depth: {
      intuition: { label: "Интуиция", n: "01", blurb: "Картинка в голове" },
      mechanism: { label: "Механизм", n: "02", blurb: "Как это работает на деле" },
      spec: { label: "Спека и код", n: "03", blurb: "На основе настоящего" },
      deeper: { label: "Глубже", n: "04", blurb: "Куда двигаться дальше" },
    },
    langName: "RU",
  },
} as const;

export type DepthTierKey = keyof (typeof ui)["en"]["depth"];
