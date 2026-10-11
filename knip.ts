import type { KnipConfig } from 'knip'
import packageJson from './package.json'

const config: KnipConfig = {
  // Netlify discovers functions outside Nuxt's server directory.
  entry: ['netlify/functions/*.mts'],
  ignoreDependencies: [
    '@netlify/functions', // Netlify's function runtime/types integration.
    '@nuxtjs/robots', // Explicit version used by the SEO meta-module.
    '@takumi-rs/core', // Loaded dynamically by nuxt-og-image's Takumi renderer.
    // Content consumes this optional peer when it is declared directly.
    ...(Object.hasOwn(packageJson.devDependencies, 'valibot') ? ['valibot'] : []),
    'vue-router', // Nuxt generates the router imports.
  ],
}

export default config
