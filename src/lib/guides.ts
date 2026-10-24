// Guías para coleccionistas (/guias/<slug>). Contenido propio pensado para
// búsquedas en Google: cada guía enlaza al catálogo y a las demás secciones.

import { categoryPath } from "@/lib/slug";

export type GuideSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type GuideLink = { label: string; href: string };

export type Guide = {
  slug: string;
  title: string;
  // Para Google (≈155 caracteres) y para la tarjeta en /guias.
  description: string;
  emoji: string;
  updated: string; // AAAA-MM-DD
  intro: string;
  sections: GuideSection[];
  links: GuideLink[];
};

export const GUIDES: Guide[] = [
  {
    slug: "figura-original-o-bamba",
    title: "Cómo saber si una figura de anime es original o bamba",
    description:
      "Señales para reconocer una figura de anime falsa (bamba): precio, caja, sellos, pintura y material. Qué pedirle al vendedor antes de pagar.",
    emoji: "🔍",
    updated: "2026-10-07",
    intro:
      "Las réplicas (o \"bambas\") de figuras de anime son cada vez más parecidas a las originales. Estas son las señales que más ayudan a detectarlas antes de pagar.",
    sections: [
      {
        heading: "1. Desconfía de un precio demasiado bajo",
        paragraphs: [
          "Es la señal más clara. Si una S.H.Figuarts, una figma o una figura a escala cuesta la mitad de lo que piden los demás vendedores, lo más probable es que no sea original. Compara precios de la misma figura en el catálogo antes de decidir.",
        ],
      },
      {
        heading: "2. Revisa la caja",
        paragraphs: [
          "Las cajas originales tienen impresión nítida, colores fieles y textos sin errores. En las réplicas es común ver fotos borrosas o pixeladas, colores lavados, letras torcidas, faltas de ortografía en japonés o inglés y cartón delgado.",
        ],
        bullets: [
          "Busca el logo del fabricante (Bandai Spirits, Tamashii Nations, Good Smile Company, Max Factory, SEGA, Taito, FuRyu, Kotobukiya…) y compáralo con el de su web oficial.",
          "Muchas marcas usan un sello holográfico o de autenticidad en la caja. Si falta o se ve impreso en papel común, sospecha.",
          "Una figura \"sin caja\" o con la caja muy dañada no siempre es falsa, pero es más difícil de comprobar: pide más fotos.",
        ],
      },
      {
        heading: "3. Mira la pintura y los detalles",
        bullets: [
          "Ojos chuecos o borrosos, manchas de pintura fuera de lugar y bordes mal definidos.",
          "Colores distintos a los de las fotos oficiales (pelo, piel o ropa más apagados o demasiado brillantes).",
          "Rebabas de plástico, uniones visibles y piezas que no encajan bien.",
          "Un olor fuerte a químico al abrir la caja es típico de plástico de baja calidad.",
        ],
      },
      {
        heading: "4. Compara con las fotos oficiales",
        paragraphs: [
          "Busca la figura en la web del fabricante o de tiendas japonesas reconocidas y compara pose, accesorios, base y tamaño. Las réplicas a veces traen menos accesorios, bases más simples o piezas de otro color.",
        ],
      },
      {
        heading: "5. Qué pedirle al vendedor",
        bullets: [
          "Fotos reales de la figura y de la caja por todos los lados, incluido el sello si lo tiene.",
          "Un video corto girando la figura, o una foto con un papel que tenga su nombre y la fecha.",
          "Si se encuentran en persona, revisa la figura antes de pagar.",
          "En GerStore fíjate en la etiqueta \"📷 Fotos reales\" y en las reseñas del vendedor.",
        ],
      },
    ],
    links: [
      { label: "Ver figuras disponibles", href: "/" },
      { label: "Cómo comprar y vender seguro", href: "/guias/comprar-y-vender-figuras-seguro" },
    ],
  },
  {
    slug: "tipos-de-figuras-anime",
    title: "Tipos de figuras de anime: Banpresto, S.H.Figuarts, Nendoroid, figma y más",
    description:
      "Diferencias entre figuras prize (Banpresto, SEGA, Taito), Ichiban Kuji, S.H.Figuarts, figma, Nendoroid, Pop Up Parade y figuras a escala, para elegir bien.",
    emoji: "🧩",
    updated: "2026-10-07",
    intro:
      "No todas las figuras de anime son iguales: cambian el tamaño, el nivel de detalle, si se pueden mover y, sobre todo, el precio. Esta guía resume las líneas que más vas a ver.",
    sections: [
      {
        heading: "Figuras prize (Banpresto, SEGA, Taito, FuRyu)",
        paragraphs: [
          "Nacieron como premios de las máquinas de garra en Japón. Son fijas (no se articulan), suelen medir entre 15 y 25 cm y son la opción más económica para empezar una colección. Banpresto, de Bandai Spirits, es la marca más conocida (por ejemplo sus líneas Grandista o DXF).",
        ],
      },
      {
        heading: "Ichiban Kuji",
        paragraphs: [
          "Es un sorteo que se hace en tiendas de Japón: cada boleto da un premio, y los premios mayores (A, B, Last One) son figuras exclusivas de muy buena calidad. Como no se venden en tiendas, en reventa suelen costar más que una prize normal.",
        ],
      },
      {
        heading: "S.H.Figuarts (Tamashii Nations)",
        paragraphs: [
          "Figuras articuladas de unos 14 a 16 cm con manos, caras y efectos intercambiables, pensadas para posar. Son muy populares en Dragon Ball, Naruto, One Piece y series de superhéroes.",
        ],
      },
      {
        heading: "figma (Max Factory / Good Smile Company)",
        paragraphs: [
          "También articuladas y de tamaño parecido a las S.H.Figuarts, con varias expresiones y una base con brazo para poses en el aire. Muy comunes en personajes de anime y videojuegos.",
        ],
      },
      {
        heading: "Nendoroid (Good Smile Company)",
        paragraphs: [
          "Figuras pequeñas (unos 10 cm) en estilo chibi, con cabeza grande y caras intercambiables. Se pueden posar y combinar piezas entre ellas.",
        ],
      },
      {
        heading: "Pop Up Parade (Good Smile Company)",
        paragraphs: [
          "Figuras fijas de unos 15 a 18 cm con mejor acabado que una prize pero a un precio más accesible que una figura a escala. Buena opción intermedia.",
        ],
      },
      {
        heading: "Figuras a escala (1/7, 1/8, 1/6…)",
        paragraphs: [
          "La escala indica la proporción respecto al personaje \"real\" (1/7 es siete veces más pequeña). Son fijas, con el mayor nivel de detalle y pintura, y las más caras. Las fabrican marcas como Good Smile Company, Alter, Kotobukiya o Max Factory.",
        ],
      },
      {
        heading: "¿Cuál me conviene?",
        bullets: [
          "Para empezar o decorar con poco presupuesto: prize (Banpresto, SEGA, Taito).",
          "Para posar y armar escenas: S.H.Figuarts o figma.",
          "Si te gusta lo tierno y coleccionar muchos personajes: Nendoroid.",
          "Para una pieza central en la vitrina: Pop Up Parade o una figura a escala.",
        ],
      },
    ],
    links: [
      { label: "Ver figuras S.H.Figuarts", href: "/linea/shfiguarts#catalogo" },
      { label: "Ver figuras Banpresto", href: "/linea/banpresto#catalogo" },
      { label: "Ver premios Ichiban Kuji", href: "/linea/ichibankuji#catalogo" },
    ],
  },
  {
    slug: "cuidar-figuras-anime",
    title: "Cómo cuidar y limpiar tus figuras de anime",
    description:
      "Consejos para que tus figuras de anime no se decoloren, no se llenen de polvo ni se deformen: sol, humedad, limpieza y cómo guardar las cajas.",
    emoji: "🧼",
    updated: "2026-10-07",
    intro:
      "Una figura bien cuidada se ve mejor por años y conserva su valor si algún día la quieres vender. Estos son los cuidados básicos.",
    sections: [
      {
        heading: "Lejos del sol directo",
        paragraphs: [
          "La luz del sol decolora la pintura y puede amarillear el plástico transparente (efectos, bases, cabello). Ubica la vitrina lejos de las ventanas o usa cortinas. Las luces LED dan poco calor y son mejores que los focos tradicionales.",
        ],
      },
      {
        heading: "Contra el polvo: vitrina",
        paragraphs: [
          "Una vitrina cerrada es la mejor protección. Si las tienes al aire libre, quítales el polvo cada semana con una brocha de maquillaje o un pincel suave, o con aire (una perilla de aire para cámaras funciona bien).",
        ],
      },
      {
        heading: "Cómo limpiarlas",
        bullets: [
          "Primero brocha o aire; muchas veces es suficiente.",
          "Para manchas, un paño de microfibra apenas húmedo con agua, sin frotar fuerte.",
          "No uses alcohol, acetona ni limpiadores: pueden borrar la pintura.",
          "Sécalas bien antes de devolverlas a la vitrina.",
        ],
      },
      {
        heading: "Calor y humedad",
        paragraphs: [
          "Con el calor el PVC se ablanda y algunas figuras empiezan a inclinarse con el tiempo, sobre todo las que se apoyan en un solo pie. Evita lugares calurosos y, si notas que una se inclina, revisa que esté bien encajada en su base. En ciudades húmedas, unos sobres de sílica gel dentro de la vitrina ayudan a evitar hongos y olores.",
        ],
      },
      {
        heading: "Figuras articuladas",
        bullets: [
          "Mueve las articulaciones con suavidad; si una está dura, no la fuerces.",
          "Cambia las manos y piezas tomándolas de la base, no del dedo.",
          "No dejes poses muy forzadas por meses: las articulaciones se aflojan.",
        ],
      },
      {
        heading: "Guarda las cajas",
        paragraphs: [
          "Una figura con su caja en buen estado vale bastante más al revenderla. Guárdalas planas o armadas en un lugar seco, junto con las bolsas y los accesorios que no uses.",
        ],
      },
    ],
    links: [
      { label: "Vender una figura", href: "/publicar" },
      { label: "Ver figuras disponibles", href: "/" },
    ],
  },
  {
    slug: "comprar-y-vender-figuras-seguro",
    title: "Cómo comprar y vender figuras de anime de forma segura en Perú",
    description:
      "Consejos para comprar y vender figuras de anime entre coleccionistas sin estafas: fotos, reseñas, pagos por Yape, entregas y preventas.",
    emoji: "🛡️",
    updated: "2026-10-07",
    intro:
      "La mayoría de compras entre coleccionistas salen bien, pero vale la pena seguir unas reglas simples, tanto si compras como si vendes.",
    sections: [
      {
        heading: "Si compras",
        bullets: [
          "Revisa el perfil del vendedor: sus reseñas, desde cuándo está y si tiene la insignia 🏅 Vendedor confiable.",
          "Prefiere publicaciones con \"📷 Fotos reales\" y pide un video o fotos extra si tienes dudas.",
          "Evita adelantar el pago completo a alguien que no conoces; si te piden un adelanto, que sea una parte.",
          "Si se ven en persona, que sea en un lugar público y concurrido (un centro comercial, una estación) y de día.",
          "Revisa la figura antes de pagar: caja, sellos, accesorios y que sea la misma de las fotos.",
        ],
      },
      {
        heading: "Pagos por Yape o Plin",
        bullets: [
          "Confirma el pago en tu propia app, no con una captura que te envían: las capturas se pueden editar.",
          "Verifica que el nombre de quien te paga o a quien le pagas sea el esperado.",
          "Para montos grandes, combina: adelanto pequeño por Yape y el resto en la entrega.",
        ],
      },
      {
        heading: "Si vendes",
        bullets: [
          "Sube fotos reales de tu figura y de la caja; las publicaciones con fotos propias generan más confianza.",
          "Describe con honestidad el estado: nueva, open box o usada, y cualquier detalle o pieza faltante.",
          "Marca tus zonas de entrega para que te encuentren quienes están cerca.",
          "Cuando la vendas, márcala como vendida y pide al comprador que te deje una reseña.",
        ],
      },
      {
        heading: "Preventas y figuras separadas",
        paragraphs: [
          "En una preventa pagas un adelanto y el resto cuando la figura llega. Pregunta la fecha estimada y qué pasa si se retrasa. Una figura \"separada\" ya tiene un adelanto de otra persona, pero quien pague el total puede comprarla igual.",
        ],
      },
      {
        heading: "¿Algo salió mal?",
        paragraphs: [
          "Deja una reseña honesta en el perfil del vendedor y escríbenos desde la página de Contacto. Si fuiste víctima de una estafa, guarda las conversaciones y comprobantes y denúncialo ante la Policía.",
        ],
      },
    ],
    links: [
      { label: "Cómo reconocer una figura original", href: "/guias/figura-original-o-bamba" },
      { label: "Ver figuras disponibles", href: "/" },
    ],
  },  {
    slug: "que-es-ichiban-kuji",
    title: "Qué es Ichiban Kuji: cómo funciona la lotería de figuras de Japón",
    description:
      "Qué es Ichiban Kuji, qué significan los premios A, B, C y Last One, qué es Masterlise y cómo llegan estas figuras a Perú. Guía para coleccionistas.",
    emoji: "🎟️",
    updated: "2026-10-24",
    intro:
      "Ichiban Kuji es una de las formas más populares de conseguir figuras de anime en Japón, y muchas de las que se venden en Perú vienen de ahí. Aquí te explicamos cómo funciona, qué significa cada premio y qué revisar antes de comprar una.",
    sections: [
      {
        heading: "Una lotería donde siempre ganas algo",
        paragraphs: [
          "Ichiban Kuji (一番くじ, algo así como \"el boleto número uno\") es una lotería de Bandai Spirits que se vende en Japón en tiendas de conveniencia, librerías y tiendas de hobby. Cada serie está dedicada a un anime —Dragon Ball, One Piece, Naruto, Demon Slayer, Jujutsu Kaisen y muchos más— y tiene una cantidad fija de boletos por tienda.",
          "Compras un boleto, lo raspas o abres y te dice qué premio te tocó. A diferencia de una lotería común, todos los boletos tienen premio: puede ser una figura grande o un artículo más pequeño, como una toalla, un llavero o un soporte acrílico.",
        ],
      },
      {
        heading: "Premios A, B, C… y el Last One",
        paragraphs: [
          "Los premios se ordenan por letras. Las primeras letras (A, B, C…) suelen ser las figuras más grandes y buscadas, y hay pocas por tienda. Las últimas letras son los premios más comunes.",
          "El premio Last One (ラストワン賞) se lo lleva quien compra el último boleto de la tienda. Normalmente es una versión especial de una de las figuras —otro color, otra pose o una base distinta—, por eso suele ser la más cara en reventa.",
        ],
        bullets: [
          "Algunas series tienen campañas \"Double Chance\": con el código del boleto participas en un sorteo extra.",
          "El precio del boleto en Japón depende de la serie, y el valor real de cada premio lo pone después la demanda de los coleccionistas.",
        ],
      },
      {
        heading: "Qué es Masterlise",
        paragraphs: [
          "Masterlise es la línea de figuras de mejor acabado dentro de Ichiban Kuji: más tamaño, más detalle en la escultura y mejor pintura que las figuras de lotería de años anteriores. Si ves \"Ichiban Kuji Masterlise\" en una publicación, es una figura de esta línea.",
        ],
      },
      {
        heading: "¿Se pueden comprar boletos en Perú?",
        paragraphs: [
          "No. Los boletos se venden en Japón (y en algunas tiendas oficiales de otros países). Las figuras de Ichiban Kuji que ves en Perú llegan por importadores, tiendas que compran lotes de premios en Japón o coleccionistas que las traen y luego las revenden.",
          "Por eso el precio de una figura de Ichiban Kuji en Perú depende de qué premio es (no cuesta lo mismo un premio A que un Last One), de si está sellada y de lo buscado que esté el personaje.",
        ],
      },
      {
        heading: "Qué revisar antes de comprar una",
        bullets: [
          "Que la caja tenga el logo de Ichiban Kuji y la letra del premio (A, B, Last One…). La letra se imprime en la caja.",
          "Si te dicen que es Last One, compara con fotos oficiales: el Last One siempre tiene algo distinto a la versión normal.",
          "Pide fotos de la figura por todos los lados y de la base: las réplicas de figuras de lotería son comunes.",
          "Una figura \"sin caja\" puede ser original, pero vale menos y es más difícil de comprobar.",
        ],
      },
    ],
    links: [
      { label: "Ver figuras de Ichiban Kuji", href: "/linea/ichibankuji" },
      { label: "Cómo reconocer una figura original", href: "/guias/figura-original-o-bamba" },
    ],
  },
  {
    slug: "que-es-sh-figuarts",
    title: "S.H.Figuarts: qué son, versiones, exclusivas y cómo cuidarlas",
    description:
      "Todo sobre las S.H.Figuarts de Tamashii Nations: tamaño, accesorios, exclusivas de Tamashii Web (caja marrón), reediciones y qué revisar al comprar una.",
    emoji: "🦾",
    updated: "2026-10-24",
    intro:
      "Las S.H.Figuarts son las figuras articuladas más buscadas por los coleccionistas de anime en Perú. Esta guía explica qué las hace especiales, qué significan términos como \"exclusiva web\" o \"caja marrón\" y cómo comprarlas sin llevarte sorpresas.",
    sections: [
      {
        heading: "Qué es una S.H.Figuarts",
        paragraphs: [
          "S.H.Figuarts es una línea de figuras de acción de Tamashii Nations, la marca de coleccionables para adultos de Bandai Spirits. Empezó en 2008 y hoy incluye personajes de Dragon Ball, Naruto, One Piece, Demon Slayer, Kamen Rider, Marvel, Star Wars y muchas otras series.",
          "Miden alrededor de 14 a 15 cm (según el personaje) y tienen muchas articulaciones, así que puedes ponerlas en casi cualquier pose de la serie. Las siglas S.H. vienen de \"Simple Style & Heroic Action\", lo que viene impreso en el reverso de la caja.",
        ],
      },
      {
        heading: "Qué trae la caja",
        bullets: [
          "La figura, con su soporte o un punto para colocar uno (en muchas, el soporte Tamashii Stage se vende aparte).",
          "Manos intercambiables: puños, manos abiertas, en pose de ataque…",
          "Caras o expresiones intercambiables, y a veces cabello o piezas alternativas.",
          "En algunas, efectos (un Kamehameha, un Rasengan) o accesorios del personaje.",
        ],
        paragraphs: [
          "Al comprar una usada u open box, pide una foto de todos los accesorios sobre una mesa y compárala con la lista del reverso de la caja: es lo que más se pierde.",
        ],
      },
      {
        heading: "Exclusivas web y la famosa \"caja marrón\"",
        paragraphs: [
          "Algunas S.H.Figuarts no se venden en tiendas, sino solo por pedido en la tienda online de Bandai (Premium Bandai / Tamashii Web Shop) o en eventos como Tamashii Nations. Son las \"exclusivas web\" o \"exclusivas de evento\" y suelen producirse en menor cantidad.",
          "Las exclusivas web se envían dentro de una caja de cartón marrón con la etiqueta del pedido. Muchos coleccionistas guardan esa caja, porque demuestra que la figura vino directo de Bandai; por eso verás publicaciones que dicen \"con caja marrón\".",
        ],
      },
      {
        heading: "Reediciones y versiones 2.0",
        paragraphs: [
          "Cuando una figura es muy pedida, Bandai la vuelve a fabricar (reedición) o lanza una versión mejorada con nueva escultura, a veces llamada 2.0. Fíjate en el año y en las fotos de la caja: una versión antigua y una nueva del mismo personaje pueden tener precios muy diferentes.",
        ],
      },
      {
        heading: "Sellada, open box o usada",
        bullets: [
          "Sellada: la caja nunca se abrió. Es la que más vale.",
          "Open box: se abrió (para revisarla o tomarle fotos) pero está completa y casi sin uso.",
          "Usada: se exhibió o se jugó con ella. Revisa articulaciones flojas, pintura gastada y accesorios faltantes.",
        ],
      },
      {
        heading: "Cuidados básicos",
        bullets: [
          "Mueve las articulaciones con suavidad; si una está dura, no la fuerces.",
          "Cambia manos y caras despacio, sujetando la pieza desde la base.",
          "Si la exhibes en una pose difícil, usa un soporte para que no se caiga ni se aflojen las piernas.",
          "Guárdala lejos del sol: el plástico blanco y los colores claros se ponen amarillos con el tiempo.",
        ],
      },
    ],
    links: [
      { label: "Ver S.H.Figuarts disponibles", href: "/linea/shfiguarts" },
      { label: "Cómo cuidar tus figuras", href: "/guias/cuidar-figuras-anime" },
    ],
  },
  {
    slug: "figuras-dragon-ball-guia",
    title: "Figuras de Dragon Ball: guía de líneas y marcas para coleccionar",
    description:
      "Las principales líneas de figuras de Dragon Ball: S.H.Figuarts, Figuarts ZERO, Ichiban Kuji, Banpresto (Grandista, Match Makers, Blood of Saiyans) y más.",
    emoji: "🐉",
    updated: "2026-10-24",
    intro:
      "Dragon Ball es la serie con más figuras en el mercado, y eso también la hace la más confusa: hay líneas articuladas, estatuas, premios de lotería y figuras económicas de máquinas de premios. Así se diferencian.",
    sections: [
      {
        heading: "S.H.Figuarts (articuladas)",
        paragraphs: [
          "Son las figuras de acción de Tamashii Nations, de unos 14 cm, con muchas articulaciones, manos y caras intercambiables y a veces efectos de energía. Hay de casi todos los personajes de Dragon Ball, Z, GT y Super, incluidas versiones de Super Saiyajin, exclusivas web y colores especiales de eventos. Son las preferidas para armar escenas y poses.",
        ],
      },
      {
        heading: "Figuarts ZERO (estatuas de Tamashii)",
        paragraphs: [
          "También son de Tamashii Nations, pero no son articuladas: son estatuas en una pose fija, con más detalle de escultura y a veces efectos grandes. Una buena opción si quieres algo que solo se exhiba.",
        ],
      },
      {
        heading: "Ichiban Kuji y Masterlise",
        paragraphs: [
          "Son los premios de la lotería Ichiban Kuji de Japón. Las figuras de premio A, B o Last One y la línea Masterlise suelen ser grandes y con muy buen acabado por su precio. Revisa la letra del premio en la caja: no vale lo mismo un premio A que uno de las últimas letras.",
        ],
      },
      {
        heading: "Banpresto: figuras prize",
        paragraphs: [
          "Banpresto (hoy parte de Bandai Spirits) hace figuras para las máquinas de premios de Japón. Son las más accesibles y hay muchas líneas de Dragon Ball:",
        ],
        bullets: [
          "Grandista: figuras grandes, de unos 25 a 30 cm.",
          "Match Makers: figuras pensadas para ponerse frente a frente con otro personaje, recreando un combate.",
          "Blood of Saiyans: los Saiyajin en poses de combate.",
          "Solid Edge Works: personajes en poses dinámicas, llenas de movimiento.",
          "G×materia y otras líneas de colección que salen cada temporada.",
        ],
      },
      {
        heading: "Figure-rise Standard (para armar)",
        paragraphs: [
          "Son kits de modelismo de Bandai Spirits: la figura viene en piezas que se arman sin pegamento. Al terminar quedan articuladas y con sus colores, porque cada pieza viene en el plástico del color que corresponde. Ideales si te gusta armar tus propias figuras.",
        ],
      },
      {
        heading: "Cuidado con las réplicas",
        paragraphs: [
          "Por ser tan popular, Dragon Ball es la serie con más figuras falsas, sobre todo de Ichiban Kuji y S.H.Figuarts. Desconfía de precios muy bajos, revisa la caja y el sello, y si la publicación dice \"bootleg\" o \"genérica\", es una réplica (no siempre es mala, pero debe costar mucho menos).",
        ],
      },
    ],
    links: [
      { label: "Ver figuras de Dragon Ball", href: categoryPath("Dragon Ball Z") },
      { label: "Qué es Ichiban Kuji", href: "/guias/que-es-ichiban-kuji" },
      { label: "Cómo reconocer una figura original", href: "/guias/figura-original-o-bamba" },
    ],
  },
  {
    slug: "fotos-para-vender-figuras",
    title: "Cómo tomar buenas fotos para vender tus figuras más rápido",
    description:
      "Consejos simples para fotografiar figuras de anime con el celular: luz, fondo, ángulos, fotos de la caja y detalles. Vende más rápido y con más confianza.",
    emoji: "📸",
    updated: "2026-10-24",
    intro:
      "Una publicación con buenas fotos se vende antes y genera menos preguntas. No necesitas cámara profesional: con tu celular y estos consejos es suficiente.",
    sections: [
      {
        heading: "Usa luz natural",
        paragraphs: [
          "La mejor luz es la de una ventana durante el día, sin sol directo sobre la figura. Evita el flash: genera brillos en la caja y aplana los colores. De noche, usa una lámpara blanca a un costado y no la luz amarilla del techo.",
        ],
      },
      {
        heading: "Fondo limpio",
        paragraphs: [
          "Un fondo liso (una cartulina blanca, una pared o una mesa ordenada) hace que la figura resalte y que la foto se vea profesional. Retira objetos que distraigan, cables o ropa.",
        ],
      },
      {
        heading: "Qué fotos subir",
        bullets: [
          "Una foto de frente de la caja: será la portada de tu publicación.",
          "La caja por detrás y por los costados, incluido el sello si tiene uno.",
          "Si está abierta, la figura sola desde varios ángulos y todos los accesorios juntos.",
          "Primer plano de la cara y de cualquier detalle o defecto.",
          "Una foto con algo que muestre el tamaño, o junto a otra figura conocida.",
        ],
      },
      {
        heading: "Muestra los defectos",
        paragraphs: [
          "Si la caja tiene una esquina golpeada o la figura un detalle de pintura, fotografíalo y menciónalo. Parece contradictorio, pero genera confianza: el comprador sabe lo que recibe y evitas reclamos después.",
        ],
      },
      {
        heading: "Sin filtros ni fotos de internet",
        paragraphs: [
          "Los filtros cambian los colores y hacen dudar de si la figura es original. Y las fotos sacadas de internet no muestran el estado real de tu figura: en GerStore, las publicaciones con fotos propias muestran la etiqueta \"📷 Fotos reales\", que da más confianza a los compradores.",
        ],
      },
      {
        heading: "Un video corto ayuda mucho",
        paragraphs: [
          "Un video de 10 a 15 segundos girando la caja o la figura responde la mayoría de preguntas. Tenlo listo para enviarlo por WhatsApp cuando te escriban.",
        ],
      },
    ],
    links: [
      { label: "Publicar una figura", href: "/publicar" },
      { label: "Cómo poner precio a tu figura", href: "/guias/precio-para-vender-figuras" },
    ],
  },
  {
    slug: "precio-para-vender-figuras",
    title: "Cómo poner precio a una figura de anime para venderla",
    description:
      "Qué mirar para ponerle un precio justo a tu figura: línea, estado (sellada, open box, sin caja), exclusividad, reediciones y precios de otros vendedores.",
    emoji: "🏷️",
    updated: "2026-10-24",
    intro:
      "Un precio muy alto hace que tu figura se quede meses publicada; uno muy bajo te hace perder dinero. Estos son los factores que más influyen en lo que un coleccionista está dispuesto a pagar.",
    sections: [
      {
        heading: "1. Busca la misma figura",
        paragraphs: [
          "Empieza por buscar la misma figura en el catálogo y en otros grupos de venta. Fíjate en el precio de las que están en el mismo estado que la tuya y en las que ya se vendieron: dicen más que las que llevan mucho tiempo publicadas.",
        ],
      },
      {
        heading: "2. El estado lo cambia todo",
        bullets: [
          "Sellada (nunca abierta): el precio más alto.",
          "Open box (abierta pero completa y sin uso): un poco menos que sellada.",
          "Usada o exhibida: depende de cómo esté la pintura, las articulaciones y si tiene todos sus accesorios.",
          "Sin caja: vale bastante menos, porque muchos coleccionistas quieren la caja.",
          "Caja dañada: baja el precio aunque la figura esté perfecta.",
        ],
      },
      {
        heading: "3. Línea y exclusividad",
        paragraphs: [
          "Una S.H.Figuarts, una figura de Ichiban Kuji o una figura a escala cuestan más que una figura prize. Las exclusivas web, de evento o los premios Last One suelen valer más porque se hicieron menos. Si tu figura es una de estas, dilo en el título.",
        ],
      },
      {
        heading: "4. Reediciones",
        paragraphs: [
          "Si Bandai anuncia la reedición de una figura, su precio de reventa suele bajar. Al revés, una figura agotada hace años y sin reedición puede subir de valor.",
        ],
      },
      {
        heading: "5. Deja margen para negociar",
        paragraphs: [
          "Muchos compradores van a pedirte un descuento. Si te quieres dejar un margen, súmalo al precio o marca la opción \"🤝 Acepto ofertas\" al publicar. Y si tu figura lleva semanas sin consultas, bajarle un poco el precio la vuelve a poner en movimiento: los precios en oferta se marcan en el catálogo.",
        ],
      },
      {
        heading: "6. Original o réplica, siempre claro",
        paragraphs: [
          "Si tu figura es una réplica (bootleg), dilo en la publicación y ponle un precio de réplica. Venderla como original es engañar al comprador y termina en malas reseñas.",
        ],
      },
    ],
    links: [
      { label: "Publicar una figura", href: "/publicar" },
      { label: "Cómo tomar buenas fotos", href: "/guias/fotos-para-vender-figuras" },
    ],
  },
  {
    slug: "enviar-figuras-a-provincias",
    title: "Cómo enviar una figura a provincias sin que llegue dañada",
    description:
      "Cómo empacar y enviar una figura de anime a provincias en Perú: caja dentro de caja, relleno, agencias, clave de recojo, video del empaque y pagos seguros.",
    emoji: "📦",
    updated: "2026-10-24",
    intro:
      "Vender a provincias multiplica tus compradores, pero una caja aplastada arruina la venta. Con un buen empaque y algunas precauciones, la figura llega igual que salió.",
    sections: [
      {
        heading: "Empaca caja dentro de caja",
        paragraphs: [
          "Nunca envíes la figura solo con su caja original: la caja también es parte del valor. Envuélvela en plástico de burbujas y métela dentro de una caja de cartón más grande y resistente.",
        ],
        bullets: [
          "Deja unos centímetros de espacio por cada lado y rellénalo con burbupack, papel arrugado o espuma, para que no se mueva.",
          "Protege las esquinas: son lo primero que se golpea.",
          "Cierra con cinta de embalaje en todas las uniones y marca \"FRÁGIL\" en varios lados.",
          "Si es una figura usada sin caja, envuelve cada accesorio por separado.",
        ],
      },
      {
        heading: "Elige la agencia",
        paragraphs: [
          "En Perú hay varias agencias de envío a provincias, como Shalom, Olva Courier o Marvisur. Compara precio y tiempo de entrega al destino, y pregunta si ofrecen seguro para paquetes de valor. Envía a una agencia cercana al comprador para que pueda recoger rápido.",
        ],
      },
      {
        heading: "Graba el empaque",
        paragraphs: [
          "Un video corto mostrando la figura, cómo la empacas y cómo cierras la caja te protege ante cualquier reclamo. Pídele al comprador que también grabe cuando abra el paquete: si algo llega mal, ese video sirve para reclamar a la agencia.",
        ],
      },
      {
        heading: "Datos y comprobante",
        bullets: [
          "Pide al comprador su nombre completo y DNI tal como aparecen en su documento, porque las agencias lo piden para entregar.",
          "Envíale una foto del comprobante o guía del envío apenas lo despaches.",
          "Si la agencia usa una clave de recojo, compártela solo con el comprador.",
        ],
      },
      {
        heading: "El pago",
        paragraphs: [
          "En envíos a provincias lo normal es que el comprador pague antes del envío (por Yape, Plin o transferencia) y aparte el costo de la agencia. Como comprador, revisa las reseñas del vendedor antes de pagar y pide fotos o video del paquete listo. Como vendedor, confirma el pago en tu propia app antes de enviar: las capturas se pueden editar.",
        ],
      },
    ],
    links: [
      { label: "Cómo comprar y vender seguro", href: "/guias/comprar-y-vender-figuras-seguro" },
      { label: "Ver figuras disponibles", href: "/" },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
