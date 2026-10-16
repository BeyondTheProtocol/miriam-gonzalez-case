<script setup lang="ts">
/**
 * Bloque 4 · Lo que esta prueba NO puede decir. Caja siempre visible (no plegada): pesa lo
 * mismo que las preguntas. Mismo lenguaje que la tarjeta de límites de /biopsia-osea.
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const id = useId()
</script>

<template>
  <section :aria-labelledby="id" class="cel-lim">
    <h2 :id="id" class="cel-lim__t">
      <Icon name="ph:warning-circle-fill" class="cel-lim__ico" aria-hidden="true" />
      {{ L('Lo que esta prueba no puede decir', 'What this test cannot say') }}
    </h2>
    <ul class="cel-lim__ul">
      <li>
        <strong>{{ L('No lee mutaciones.', 'It does not read mutations.') }}</strong>
        {{ L('Para eso está la secuenciación del exoma, que es otra prueba.', 'That is what exome sequencing is for, which is a different test.') }}
      </li>
      <li>
        <strong>{{ L('No ve los receptores de los linfocitos T.', 'It does not see T-cell receptors.') }}</strong>
        {{ L('Puede contar linfocitos, pero no dice qué reconoce cada uno.', 'It can count lymphocytes, but it cannot say what each one recognizes.') }}
      </li>
      <li>
        <strong>{{ L('Solo lee los genes que tienen sonda.', 'It only reads genes that have a probe.') }}</strong>
        {{ L('Hay moléculas sin sonda, como HLA-A, HLA-B y HLA-C. Si una molécula no tiene sonda, no aparecerá en los datos aunque esté en la célula.', 'Some molecules have no probe, such as HLA-A, HLA-B and HLA-C. If a molecule has no probe, it will not appear in the data even if it is in the cell.') }}
      </li>
      <li>
        <strong>{{ L('El ARN no es la proteína.', 'RNA is not protein.') }}</strong>
        {{ L('Que un gen esté encendido no garantiza que la proteína llegue a la superficie de la célula. Lo que salga hay que confirmarlo con otra técnica, como la inmunohistoquímica.', 'A gene being switched on does not guarantee that the protein reaches the cell surface. Whatever comes out has to be confirmed with another technique, such as immunohistochemistry.') }}
      </li>
      <li>
        <strong>{{ L('Son dos trozos pequeños de dos lesiones.', 'These are two small pieces of two lesions.') }}</strong>
        {{ L('No tienen por qué representar al resto del tumor. Además, el hueso hay que descalcificarlo para cortarlo, y eso puede dañar el ARN; cuánto, se sabrá al ver los datos.', 'They do not necessarily represent the rest of the tumor. Bone also has to be decalcified to be cut, and that can degrade the RNA; how much will only be known once the data are seen.') }}
        <DatosSello s="inferido" :lang="lang" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.cel-lim {
  background: var(--color-bg-card);
  border: 2px solid var(--color-text);
  border-radius: 12px;
  padding: 20px 22px;
}
.cel-lim__t {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--font-display); font-weight: 600; color: var(--color-text);
  font-size: clamp(20px, 2.2vw, 26px); line-height: 1.25; letter-spacing: -0.01em;
}
.cel-lim__ico { width: 26px; height: 26px; flex: none; color: var(--color-text); }
.cel-lim__ul { margin: 14px 0 0; padding: 0; list-style: none; display: grid; gap: 12px; }
.cel-lim__ul li { color: var(--color-text-soft); line-height: 1.55; padding-left: 16px; border-left: 3px solid var(--color-miriam); }
.cel-lim__ul strong { color: var(--color-text); display: block; }
</style>
