import {
  createConfigForNuxt,
  defineFlatConfigs,
} from '@nuxt/eslint-config/flat'
import playwright from 'eslint-plugin-playwright'

export default defineFlatConfigs(
  createConfigForNuxt({
    dirs: {
      // components: ['src/components'], // this will turn off multi-word component name
      pages: ['src/pages'],
      composables: ['src/composables', 'src/utils'],
      layouts: ['src/layouts'],
      plugins: ['src/plugins'],
    },
  }),
  {
    ...playwright.configs['flat/recommended'],
    files: ['e2e/**/*.{js,ts,jsx,tsx}'],
  },
  {
    rules: {
      'vue/valid-v-slot': ['error', { allowModifiers: true }], // allow vuetify slot modifier
      'vue/no-multiple-template-root': 'off', // nuxt allow it but plain vue don't
      '@typescript-eslint/no-explicit-any': 'off',
       'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'vue/v-slot-style': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: { component: 'any' },
        },
      ],

    },
  },
)
