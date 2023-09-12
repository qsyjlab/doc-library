# @vitejs/plugin-legacy 

[![npm](https://img.shields.io/npm/v/@vitejs/plugin-legacy.svg)](https://npmjs.com/package/@vitejs/plugin-legacy)

Vite默认的浏览器支持基线是原生ESM、原生ESM动态导入和import.meta。这个插件为在生产环境中构建时不支持这些特性的旧浏览器提供支持。

默认情况下，这个插件将做以下:

- 为最终bundle中的每个块生成相应的遗留块（legacy），使用@babel/preset-env转换并作为SystemJS模块发出(仍然支持代码分割!)
- 
- 生成一个包含SystemJS运行时的polyfill块，以及由指定的浏览器目标和bundle中的实际使用情况决定的任何必要的polyfill块。

- 在生成的HTML中注入 `<script nomodule>` 标签，以有条件地加载polyfills和遗留包（legacy），仅在没有广泛可用的特性支持的浏览器中加载。

- 注入import.meta.env.LEGACY env变量，该变量仅在遗留产品构建中为真，在所有其他情况下为假。

## Usage

```js
// vite.config.js
import legacy from '@vitejs/plugin-legacy'

export default {
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
}
```

必须安装Terser，因为遗留插件使用Terser进行最小化。



```sh
npm add -D terser
```

> 实测不安装似乎也没什么太大的问题


## Options

### `targets`

- **Type:** `string | string[] | { [key: string]: string }`
- **Default:** [`'last 2 versions and not dead, > 0.3%, Firefox ESR'`](https://browsersl.ist/#q=last+2+versions+and+not+dead%2C+%3E+0.3%25%2C+Firefox+ESR)

   如果显示声明, 它被传递给 [`@babel/preset-env`](https://babeljs.io/docs/en/babel-preset-env#targets).

  这些查询条件也可以是 [兼容 Browserslist ](https://github.com/browserslist/browserslist)。 更多详情请看[Browserslist 最佳实践](https://github.com/browserslist/browserslist#best-practices)。

### `polyfills`

- **Type:** `boolean | string[]`
- **Default:** `true`

  默认情况下, 一个polyfills块是根据目标浏览器范围和最终包中的实际使用情况生成的。 (通过检测 `@babel/preset-env`'s `useBuiltIns: 'usage'`).
  
  设置字符串列表来显示控制哪个 `polyfills` 被包含在其中。更多详情请看 [Polyfill Specifiers](#polyfill-specifiers)

  设置为 `false` 避免生成 `polyfills` 和 处理他自己 （这将仍然会生成带有语法转换的 `legacy`）

### `additionalLegacyPolyfills`

- **Type:** `string[]`

  增加自定义导入这些 `legacy polyfills chunk`。由于基于使用的填充检测仅覆盖ES语言特性，因此可能需要使用此选项手动指定额外的DOM API填充。

  Note: 如果 `modern` 和 `legacy` 都需要额外的 `polyfills` ，它们可以简单地导入到应用程序源代码中。

### `ignoreBrowserslistConfig`

- **Type:** `boolean`
- **Default:** `false`

  `@babel/preset-env` 自动检测 [`browserslist` config sources （配置源）](https://github.com/browserslist/browserslist#browserslist-):

  - `browserslist` field in `package.json`
  - `.browserslistrc` file in cwd.
 
  设置 `true` 忽略这些配置源。

### `modernPolyfills`

- **Type:** `boolean | string[]`
- **Default:** `false`


  默认为 `false`。启用这个选项对于 `modern` build 将生成一个单独的 `polyfills` chunk。(targeting [browsers that support widely-available features](#browsers-that-supports-esm-but-does-not-support-widely-available-features)).

  设置字符串列表来显式控制包含哪些 `polyfills`。更多详情请看 [Polyfill Specifiers](#polyfill-specifiers)


  Note  **不推荐** 设置为 `true`  (使用自动检测) 。因为 `core-js@3` `polyfill` 代码侵入性非常强 ,由于它支持所有前言的特性。 甚至当 `target` 支持 `native esm` ，他依然注入 15kb 的 `polyfills`


  如果你不特别依赖前言的特性运行时，在现代构建中避免使用`polyfills` 是不难的。或者考虑使用按需服务 [Polyfill.io](https://polyfill.io/v3/) 基于实际浏览器的 `user-agents` 仅仅注入必要的 `polyfills`。（大多数现代浏览器是不需要任何的代码注入）

### `renderLegacyChunks`

- **Type:** `boolean`
- **Default:** `true`

  设置 `false` 禁用生成 `legacy chunks` . 这是有用的如果你使用 `modernPolyfills`, 本质上允许你使用这个插件注入 `polyfills` 到 现代构建中。

  ```js
  import legacy from '@vitejs/plugin-legacy'
  
  export default {
    plugins: [
      legacy({
        modernPolyfills: [
          /* ... */
        ],
        renderLegacyChunks: false,
      }),
    ],
  }
  ```

### `externalSystemJS`

- **Type:** `boolean`
- **Default:** `false`

  默认为 `false`. 启用这个选项将排除 `systemjs/dist/s.min.js` 从 `polyfills-legacy chunk`

  这允许你在外面自己引入。

### `renderModernChunks`

- **Type:** `boolean`
- **Default:** `true`

  设置为 `false` 仅输出 支持 `targets` 目标浏览器的 `legacy bundles`。

##  支持 `esm` 但不支持大部分可用的特性的浏览器 


这个 `legacy` 插件提供一个在现代构建原生使用大部分特性的方法，同时退回到带有原生ESM但不支持这些功能的传统内置浏览器(例如legacy Edge)。该特性通过注入一个运行时检查，并在需要时用SystemJs运行时加载遗留包来工作。有以下缺点:

- 现代构建产物 会被全部 esm 浏览器下载
- 现代构建产物 会抛出 `SyntaxError` 在没有特性支持的浏览器

以下语法是被广泛使用的

- dynamic import
- `import.meta`
- async generator


## Polyfill 说明符（Polyfill Specifiers）

Polyfill specifier strings for `polyfills` and `modernPolyfills` can be either of the following:


- Any [`core-js` 3 sub import paths](https://unpkg.com/browse/core-js@latest/) - e.g. `es/map` will import `core-js/es/map`

- Any [individual `core-js` 3 modules](https://unpkg.com/browse/core-js@latest/modules/) - e.g. `es.array.iterator` will import `core-js/modules/es.array.iterator.js`


polyfills和 的Polyfill 说明符字符串modernPolyfills可以是以下之一：
- 任何 core-js3 个子导入路径- 例如es/map将导入core-js/es/map
- 任何单独的 core-js3 个模块- 例如es.array.iterator将导入core-js/modules/es.array.iterator.js

**Example**

```js
import legacy from '@vitejs/plugin-legacy'

export default {
  plugins: [
    legacy({
      polyfills: ['es.promise.finally', 'es/map', 'es/set'],
      modernPolyfills: ['es.promise.finally'],
    }),
  ],
}
```

## 内容安全政策 (Content Security Policy )

The legacy plugin requires inline scripts for [Safari 10.1 `nomodule` fix](https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc), SystemJS initialization, and dynamic import fallback. If you have a strict CSP policy requirement, you will need to [add the corresponding hashes to your `script-src` list](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_inline_script):

旧版插件需要用于Safari 10.1nomodule修复、SystemJS 初始化和动态导入回退的内联脚本。如果您有严格的 CSP 策略要求，则需要将相应的哈希值添加到您的script-src列表中：

- `sha256-MS6/3FCg4WjP9gwgaBGwLpRCY6fZBgwmhVCdrPrNf3E=`
- `sha256-tQjf8gvb2ROOMapIxFvFAYBeUJ0v1HCbOcSmDNXGtDo=`
- `sha256-4y/gEB2/KIwZFTfNqwXJq4olzvmQ0S214m9jwKgNXoc=`
- `sha256-+5XkZFazzJo8n0iOP4ti/cLCMUudTf//Mzkb7xNPXIc=`


这些值（不带sha256-前缀）也可以通过以下方式检索

```js
import { cspHashes } from '@vitejs/plugin-legacy'
```

当使用regenerator-runtimepolyfill时，它会尝试使用该globalThis对象来注册自己。如果globalThis不可用（它是相当新的并且没有得到广泛支持，包括 IE 11），它会尝试执行Function(...)违反 CSP 的动态调用。为了避免eval在没有动态的情况下globalThis考虑添加core-js/proposals/global-thistoadditionalLegacyPolyfills来定义它。

## References

- [Vue CLI modern mode](https://cli.vuejs.org/guide/browser-compatibility.html#modern-mode)
- [Using Native JavaScript Modules in Production Today](https://philipwalton.com/articles/using-native-javascript-modules-in-production-today/)
- [rollup-native-modules-boilerplate](https://github.com/philipwalton/rollup-native-modules-boilerplate)
