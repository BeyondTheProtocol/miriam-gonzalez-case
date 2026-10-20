<template>
  <main class="section-container max-w-3xl py-16 sm:py-20">
    <p class="eyebrow mb-3 block">Información legal</p>
    <h1 class="heading-display text-3xl sm:text-4xl text-berenjena mb-2" style="letter-spacing: -0.03em">
      Aviso legal
    </h1>
    <p class="font-mono text-xs text-tinta mb-8">
      Última actualización · 20 de octubre de 2026
    </p>

    <div class="alert-callout mb-10">
      <p class="alert-callout__title">
        <Icon name="ph:warning-circle-fill" class="w-4 h-4" aria-hidden="true" />
        Pendiente: NIF y domicilio
      </p>
      El NIF y el domicilio de Beyond the Protocol se añadirán cuando la entidad esté constituida.
    </div>

    <article class="prose prose-ink max-w-none">
      <h2>1 · Datos identificativos del titular</h2>
      <p>En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de que el titular de este sitio web es:</p>
      <ul>
        <li><strong>Titular:</strong> Beyond the Protocol (iniciativa sin ánimo de lucro)</li>
        <li><strong>NIF:</strong> <span class="text-coral-deep">[pendiente — en proceso de constitución]</span></li>
        <li><strong>Contacto a efectos de notificaciones:</strong> beyondtheprotocolteam@gmail.com</li>
        <li><strong>Sitio web:</strong> helpmiriam.com</li>
      </ul>
      <p>helpmiriam.com es una iniciativa personal sin ánimo de lucro vinculada a <strong>Beyond the Protocol</strong>, cuyo objeto es informar sobre el caso clínico de Miriam González y canalizar la ayuda económica para su tratamiento e investigación asociada.</p>

      <h2>2 · Objeto y ámbito de aplicación</h2>
      <p>El presente Aviso legal regula el acceso, la navegación y el uso del sitio web helpmiriam.com. La navegación por el sitio atribuye la condición de usuario e implica la aceptación plena de todas las cláusulas aquí recogidas. Si no está de acuerdo con ellas, le rogamos que no haga uso del sitio.</p>

      <h2>3 · Condiciones de uso</h2>
      <p>El usuario se compromete a hacer un uso adecuado y lícito del sitio y de sus contenidos, conforme a la legislación vigente, la buena fe y el orden público. En particular, se compromete a no emplear el sitio para difundir contenidos ilícitos, lesivos, difamatorios o que vulneren derechos de terceros, ni a introducir virus o cualquier elemento que pueda dañar el sistema.</p>

      <h2>4 · Propiedad intelectual e industrial</h2>
      <p>Los textos, ilustraciones, el sistema de diseño, los signos distintivos (incluido el nombre y el monograma de helpmiriam.com) y demás elementos del sitio son titularidad del titular o de terceros que han autorizado su uso, y están protegidos por la normativa de propiedad intelectual e industrial.</p>
      <p>Queda prohibida su reproducción, distribución o transformación sin autorización expresa, salvo el uso de los materiales de difusión expresamente puestos a disposición para compartir el caso.</p>

      <h2>5 · Naturaleza de las donaciones</h2>
      <p>Las aportaciones realizadas a través de este sitio tienen carácter de <strong>donación voluntaria y solidaria</strong>, sin contraprestación. Se destinan íntegramente a sufragar gastos médicos, diagnósticos, logísticos y de investigación relacionados con el caso de Miriam González, según el desglose público de partidas.</p>
      <p>Las donaciones se procesan a través de plataformas de terceros (p. ej. GoFundMe), sujetas a sus propias condiciones y comisiones. El titular publica un informe periódico de gastos en aras de la transparencia.</p>

      <h2>6 · Aviso médico</h2>
      <p>El contenido clínico de este sitio (perfil molecular, hipótesis terapéuticas, cronología) tiene <strong>finalidad exclusivamente informativa y divulgativa</strong>. No constituye consejo médico, diagnóstico ni recomendación de tratamiento, y no sustituye el criterio de un profesional sanitario. Las decisiones clínicas corresponden al equipo médico responsable.</p>

      <h2>7 · Enlaces a terceros</h2>
      <p>El sitio puede contener enlaces a páginas de terceros (plataformas de donación, redes sociales, medios de comunicación). El titular no se responsabiliza de los contenidos ni de las políticas de privacidad de dichos sitios, cuyo acceso queda bajo la responsabilidad del usuario.</p>

      <h2>8 · Exclusión de responsabilidad</h2>
      <p>El titular procura mantener la información actualizada y veraz, pero no garantiza la ausencia de errores ni la disponibilidad ininterrumpida del sitio. No será responsable de los daños derivados del uso del sitio, de la imposibilidad de acceso o de la presencia de elementos lesivos introducidos por terceros ajenos a su control.</p>

      <h2>9 · Protección de datos</h2>
      <p>Beyond the Protocol, como titular del sitio web, cumple con el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas en lo que respecta al tratamiento de sus datos personales y a la libre circulación de estos datos, y demás normativa vigente en cada momento, y vela por garantizar un correcto uso y tratamiento de los datos personales del usuario. Si desea obtener información más detallada sobre el tratamiento de los datos recabados a través del sitio web, consulte nuestra <NuxtLink :to="localePath('privacidad')" class="link-inline">Política de privacidad</NuxtLink> y la <NuxtLink :to="localePath('cookies')" class="link-inline">Política de cookies</NuxtLink>, que forman parte integrante de este Aviso legal.</p>

      <h2>10 · Legislación aplicable y jurisdicción</h2>
      <p>El presente Aviso legal se rige por la legislación española. Los juzgados y tribunales del domicilio del titular serán competentes para resolver todos los conflictos derivados o relacionados con el uso del sitio, a menos que el usuario actúe como consumidor, en cuyo caso la competencia recaerá en los juzgados y tribunales correspondientes al domicilio del consumidor.</p>

      <h2>11 · Modificación del Aviso legal</h2>
      <p>Beyond the Protocol se reserva el derecho de ampliar, modificar o sustituir los términos de este Aviso legal. Si se producen cambios relevantes, se publicarán en este sitio web con una antelación razonable a su entrada en vigor.</p>
    </article>
  </main>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
// Con placeholders sin rellenar, no indexar todavía.
useSeoMeta({ title: 'Aviso legal · helpmiriam.com', robots: 'noindex, nofollow' })
</script>
