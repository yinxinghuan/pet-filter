# Technical

## 1. 技术栈

- 游戏：Pet Filter
- 类型：social
- 简述：提交肖像给 19 世纪博物学会 — 学会查阅照片后判定你属于十二目中的哪一种（猫、水豚、章鱼、巨蚌、蝾螈、蜗牛...共十二种）。输出是手绘 Audubon 式雕版图鉴，人脸与物种特征精妙融合。可申请二审、分享判词、在档案室翻阅其他博物学家收录的标本。5 语言（en/zh/ja/ko/es）。AlterU 系列。
- 框架 / 语言 / 构建：React, TypeScript, Vite, Less
- 渲染方式：Canvas/WebGL
- 依赖摘录：@types/react@^18.2.0, @types/react-dom@^18.2.0, @vitejs/plugin-react@^4.2.1, less@^4.2.0, react@^18.2.0, react-dom@^18.2.0, typescript@^5.3.3, vite@^5.1.0
- 平台元信息：meta.title=Pet Filter；cover_url=/poster.png；category=social；uuid=fe0ac62d-462e-42a4-8622-85586a99d133

## 2. 目录结构

- `index.html`：Vite/浏览器入口，挂载根节点和基础 meta。
- `package.json`：定义 npm 脚本、依赖和工程名称。
- `vite.config.ts`：配置构建、插件和相对路径 base。
- `meta.json`：平台发布元信息，包含标题和封面。
- `src/App.tsx`：React 组件和交互界面。
- `src/main.tsx`：React 组件和交互界面。
- `src/index.less`：视觉样式、布局、动画和响应式规则。
- `src/shared.d.ts`：游戏源码模块。
- `src/vite-env.d.ts`：游戏源码模块。
- `src/game-id.ts`：游戏源码模块。
- `src/PetFilter/PetFilter.tsx`：React 组件和交互界面。
- `src/PetFilter/types.ts`：游戏源码模块。
- `src/PetFilter/PetFilter.less`：视觉样式、布局、动画和响应式规则。
- `src/PetFilter/index.ts`：游戏源码模块。
- `src/PetFilter/utils/audio.ts`：游戏源码模块。
- `src/PetFilter/utils/pets.ts`：游戏源码模块。
- `src/PetFilter/utils/reactions.ts`：游戏源码模块。
- `src/PetFilter/utils/selfie.ts`：游戏源码模块。
- `src/shared/runtime/media.ts`：AlterU 媒体任务提交、轮询、结构化错误、尺寸规整和幂等键。
- `src/shared/runtime/useGenImage.ts`：固定 `edit`、单引用、1024×1024 和一次受控重试。
- `scripts/gen-species-assets.mjs`、`gen_all.py`、`gen_hybrid_only.py`、`gen_demo_portraits.py`：离线素材生成工具，同样提交并轮询 AlterU 媒体任务，不再调用历史图片服务。

关键源码模块：

- `src/App.tsx`
- `src/main.tsx`
- `src/index.less`
- `src/shared.d.ts`
- `src/vite-env.d.ts`
- `src/game-id.ts`
- `src/PetFilter/PetFilter.tsx`
- `src/PetFilter/types.ts`
- `src/PetFilter/PetFilter.less`
- `src/PetFilter/index.ts`
- `src/PetFilter/utils/audio.ts`
- `src/PetFilter/utils/pets.ts`
- `src/PetFilter/utils/reactions.ts`
- `src/PetFilter/utils/selfie.ts`
- `src/PetFilter/components/BestiaryPage.tsx`
- `src/PetFilter/components/ProcessingScreen.tsx`
- `src/PetFilter/components/Ticket.tsx`
- `src/PetFilter/components/FrontispieceArt.tsx`
- `src/PetFilter/components/PickerScreen.tsx`
- `src/PetFilter/components/Wall.tsx`
- `src/PetFilter/components/ReactionIcons.tsx`
- `src/PetFilter/components/FrontispiecePage.tsx`
- `src/PetFilter/components/ResultScreen.tsx`
- `src/PetFilter/components/PetEngraving.tsx`

## 3. 核心模块

- 状态管理与节奏：通过 React 状态与定时器处理倒计时、阶段推进或生成节奏。
- 渲染方式：Canvas/WebGL，样式由 CSS/Less 和组件结构共同完成。
- 碰撞 / 更新：源码包含命中、距离、边界或重叠判断，结果会影响得分、生命或阶段。
- 音频：包含程序化音频或音频文件播放，按交互事件触发。
- 多语言：包含 i18n / locale 检测或 `t()` 文案函数。
- 存储：使用 localStorage、useGameSave 或 persist 保存分数、收藏、墙数据或本地状态。
- Aigram 运行时：接入 `@shared/runtime` 或平台桥接能力，用于用户、资料页、分享、通知或平台 API。
- AI / 生成接口：物种分类和维多利亚式判词继续走现有 `game-chat` LLM；肖像通过现有上传边界取得公网 URL；最终图鉴只走 AlterU 独立媒体任务服务，不再调用旧图片转发接口。
- 社交墙 / 归档：包含 wall、gallery、feed 或 archive 数据流与浏览界面。

## 4. 扩展点

- 改玩法参数：优先查找 `src/` 内大写常量、hooks、主组件顶部配置或关卡数组。
- 换素材：替换 `public/`、`src/img/` 或源码 import 的图片/音频文件，并保持相对路径。
- 调视觉：修改主样式文件中的颜色、间距、动画时长、网格尺寸和响应式规则。
- 改文案：修改 i18n 字典、组件内标题按钮文案，保持 zh/en 同步。
- 加平台能力：在已有 `@shared/runtime`、useGameSave、排行榜、墙或通知调用附近扩展，避免另起一套存储。
