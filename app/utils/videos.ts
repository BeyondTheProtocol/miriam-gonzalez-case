/**
 * Vídeos públicos de /videos (· /en/videos). Una sola fuente para la página.
 *
 * Los ficheros viven en public/videos/ recodificados a 720p H.264 + AAC con
 * `-movflags +faststart` (≤ 12 MB cada uno). Los originales a 1080p están en el archivo
 * de Miriam, no en el repo.
 *
 * La transcripción es lo que dice la voz, sin añadidos: los promos salen de la línea de
 * tiempo del render (`polaris-story-v19` EN, `polaris-story-es-v3` ES) y el explicativo
 * del guion `guion-video-adc-v6`. Los subtítulos ya van grabados en la imagen de los tres.
 *
 * El texto de título y descripción (`titulo`, `descripcion`) vive aquí y no en i18n porque
 * cada vídeo existe en un idioma, no en los dos: ES y EN no se traducen entre sí.
 */

export type IdiomaVideo = 'es' | 'en'

export interface VideoWeb {
  id: string
  /** Idioma de la voz. */
  voz: IdiomaVideo
  titulo: string
  descripcion: string
  /** Segundos, ffprobe del fichero publicado. */
  segundos: number
  src: string
  poster: string
  /** Una línea en inglés para quien lee la página EN cuando el vídeo no está en inglés. */
  resumenEn?: string
  transcripcion: string[]
}

const promoEs: VideoWeb = {
  id: 'polaris-es',
  voz: 'es',
  titulo: 'Polaris, hasta ahora',
  descripcion: 'Cómo trabajo con un equipo de agentes de IA para entender mi caso: qué hace Polaris, qué me deja en borrador y qué firmo yo.',
  segundos: 94.5,
  src: '/videos/polaris-story-es.mp4',
  poster: '/videos/polaris-story-es-poster.jpg',
  transcripcion: [
      "Tengo cáncer de mama. Raro. Bueno, ultrarraro. Y metastásico. Con un tumor de dos caras que los protocolos estándar no contemplan.",
      "Así que tocaba ir más allá y buscar mis propias opciones.",
      "Soy ingeniera, y lo que necesitaba, lo construí. Se llama Polaris. Un equipo de agentes de IA con un solo objetivo: NED. Sin evidencia de enfermedad. Y nada sale de aquí sin mi firma.",
      "Para mí, lo mejor ha sido conocer mi tumor de verdad. Entenderlo. Y hasta verlo.",
      "Convirtió mis pruebas de imagen en mapas 3D de mis lesiones. Y el de los huesos me ayudó a elegir qué lesión biopsiar.",
      "Cada día rastrea ensayos clínicos en todo el mundo. Y me trae opciones que yo sola no habría encontrado.",
      "En el día a día me echa un cable: gestionar el envío de mis muestras a los laboratorios, responder emails, contactar con profesionales y organizar los viajes del tratamiento. Todo sale en borrador y lo firmo yo. Me quita muchísima carga.",
      "Hasta me ayudó a montar la web donde lo comparto todo.",
      "Y hace muchas cosas más. Tantas, que ahora mismo ni me acuerdo.",
      "Polaris no decide. Deciden mis médicos. Pero yo llego a consulta entendiendo mi caso.",
      "Y sigo investigando hasta llegar a NED.",
      "Todo mi caso está explicado en helpmiriam.com.",
    ],
}

const promoEn: VideoWeb = {
  id: 'polaris-en',
  voz: 'en',
  titulo: 'Polaris, so far',
  descripcion: 'How I work with a team of AI agents to understand my case: what Polaris does, what it leaves as a draft and what I sign off myself.',
  segundos: 83.9,
  src: '/videos/polaris-story-en.mp4',
  poster: '/videos/polaris-story-en-poster.jpg',
  transcripcion: [
      "I have a rare breast cancer. Ultra-rare, actually, and metastatic. My tumor has two sides, and the standard protocols don't really account for that.",
      "So I had to go further and find out what my real options were.",
      "I'm an engineer. I built Polaris because I needed it. It's a team of AI agents with one written goal: N-E-D. No evidence of disease. And nothing leaves the system without my sign-off.",
      "What it's helped me with most is getting to know my own tumor. Understanding it, and even seeing it.",
      "It turned my scans into 3D maps of my lesions. I used the bone map to help choose which one to biopsy.",
      "Every day, it searches for trials all over the world, and turns up options I wouldn't have found on my own.",
      "On the practical side, it helps me work out how my samples get to the labs, sort through the messages people send me, and plan my trips for treatment. It takes so much off my plate.",
      "It even helped me build the website where I share all of it.",
      "And honestly, a lot more that I'm forgetting right now.",
      "It doesn't decide. My doctors do. But I walk into my appointments understanding my own case.",
      "We're still going for N-E-D.",
      "My whole case is explained at helpmiriam.com.",
    ],
}

const adc: VideoWeb = {
  id: 'adc-es',
  voz: 'es',
  titulo: 'Cómo funciona un ADC',
  descripcion: 'Qué es un anticuerpo conjugado a fármaco y qué hace, desde que entra por la vena hasta lo que ocurre dentro de la célula. Es una explicación general, no un consejo médico.',
  segundos: 132.7,
  resumenEn: 'A general explainer, in Spanish: what an antibody-drug conjugate (ADC) is and how it works, from the vein to the inside of the cell. Not medical advice.',
  src: '/videos/como-funciona-un-adc.mp4',
  poster: '/videos/como-funciona-un-adc-poster.jpg',
  transcripcion: [
      "¿Qué es un ADC? Son las siglas en inglés de anticuerpo conjugado a fármaco, un tipo de tratamiento contra el cáncer. En dos minutos, cómo funciona: desde que entra por la vena hasta lo que hace dentro de la célula.",
      "La quimio clásica viaja suelta por la sangre y daña sobre todo a las células que se dividen, sean del tumor o sanas. Un ADC ata un fármaco parecido a un anticuerpo que lo guía, y lo suelta dentro de la célula. Tiene sus propios efectos secundarios, porque esa señal también está en tejidos sanos y parte de la carga se escapa.",
      "Un ADC tiene tres partes. Un anticuerpo, que es el que busca la señal. Un fármaco muy potente, que es la carga. Y un enganche, que mantiene la carga sujeta hasta llegar. El de este ejemplo se llama Dato-DXd.",
      "Se pone por la vena y viaja por la sangre por todo el cuerpo. Durante el viaje la carga va enganchada: en la sangre se mide muy poca carga suelta.",
      "El anticuerpo busca esa señal en la superficie de las células. En este caso se llama TROP2.",
      "Cuando la encuentra, se pega a ella. Y la célula, sin saberlo, se lo traga entero.",
      "Dentro, la célula intenta digerirlo. Y justo al digerirlo rompe el enganche y deja la carga suelta.",
      "La carga va al ADN, que es el manual de instrucciones de la célula, y lo rompe. Sin ese manual, la célula muere.",
      "Se cree que parte de la carga puede salir y pasar a las células de al lado.",
      "¿Y los días después? El medicamento no desaparece de golpe. Cada cinco días, más o menos, queda la mitad. A la semana aún queda un tercio. Y a las tres semanas, cuando casi no queda, toca la siguiente dosis.",
      "Lo más frecuente son las llagas en la boca: en la mitad de los casos empiezan en las dos primeras semanas. También son habituales las náuseas y el cansancio. Las molestias en los ojos tardan más: aparecen al cabo de meses. Y hay un efecto raro pero grave en el pulmón: si aparece tos o ahogo, se avisa al equipo médico.",
      "En resumen: busca la célula, entra, suelta la carga y rompe su ADN.",
      "Sigue todo mi caso en helpmiriam.com.",
    ],
}

/** Orden de cada página: primero el vídeo en el idioma de quien lee. */
export const VIDEOS: Record<IdiomaVideo, VideoWeb[]> = {
  es: [promoEs, adc],
  en: [promoEn, adc],
}

/** «1:24», «2:12». Se trunca, como hace el reproductor, para que ambos digan lo mismo. */
export function duracionVideo(segundos: number): string {
  const s = Math.floor(segundos)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Duración ISO 8601 para `<time datetime>`. */
export function duracionIso(segundos: number): string {
  const s = Math.floor(segundos)
  return `PT${Math.floor(s / 60)}M${s % 60}S`
}
