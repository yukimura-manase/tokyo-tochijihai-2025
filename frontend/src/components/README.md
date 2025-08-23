# Components 作成ルール

## 概要

1. layouts ディレクトリ: Layout 系 Component

2. Page ディレクトリ: Page 系 Component

   - 各ページ固有の Component をここに配置する。

   - component 内で、さらに Component を分離したい場合は、Component の Parts として以下のように分離すること。
     (CustomHooks も同様)

```bash
xxx-component % tree -L 1
.
├── hooks
│   ├── custom-hooks-a
│   └── custom-hooks-b
├── parts
│   ├── parts-component-a
│   └── parts-component-b
└── index.tsx
```

3. shared ディレクトリ: 共有 系 Component

   - ui-elements: 1 つの Component かつ、共有して使用する Component をここに配置する。

     - Atomic Design でいうところの Atoms 単位の Component をここに配置する。

   - ui-parts: 2 つ以上の Component が組み合わさるものかつ、共有して使用する Component をここに配置する。

     - Atomic Design でいうところの Molecules, Organisms 単位の Component をここに配置する。

```bash
components % tree -L 1
.
├── README.md
├── layouts
├── pages
└── shared
```

## Custom Hooks

1. Custom Hooks は、local で使用する Components の Dir 内に `/hooks` Dir を作成して、その中に作成する。

2. UI ファイルとは別に機能(Logic)をちゃんと分離すること。

3. Global な Custom Hooks は、`src/hooks` 内に作成する。
