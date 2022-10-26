// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  ssr: false,
  modules: [
    '@vueuse/nuxt',
  ],
  "meta": [
    {
      "name": "viewport",
      "content": "initial-scale=1.0, user-scalable=no, viewport-fit=cover"
    },
    {
      "charset": "utf-8"
    }
  ],
  "link": [
  ],
  "style": [
  ],
  "script": [],
  "noscript": []
})
