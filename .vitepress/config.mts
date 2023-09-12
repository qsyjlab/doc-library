import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "DocLibrary",
  description: "文档集合",
  srcDir: './packages',
  themeConfig: {
    search: {
      provider: 'local'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '文档', link: '/vite/plugin-legacy' }
    ],

    sidebar: [
      {
        text: 'vite',
        items: [
          { text: '@vitejs/plugin-legacy', link: '/vite/plugin-legacy' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/qsyjlab/doc-library' }
    ]
  }
})
