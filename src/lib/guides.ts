// Guías para coleccionistas (/guias/<slug>). Contenido propio pensado para
// búsquedas en Google: cada guía enlaza al catálogo y a las demás secciones.

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
          "En FigurasAnime fíjate en la etiqueta \"📷 Fotos reales\" y en las reseñas del vendedor.",
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
      { label: "Ver figuras S.H.Figuarts", href: "/?linea=shfiguarts#catalogo" },
      { label: "Ver figuras Banpresto", href: "/?linea=banpresto#catalogo" },
      { label: "Ver premios Ichiban Kuji", href: "/?linea=ichibankuji#catalogo" },
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
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
