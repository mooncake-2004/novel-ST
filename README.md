# Novel-ST (小说剧情沙盒引擎)

> 专为 [SillyTavern (酒馆)](https://github.com/SillyTavern/SillyTavern) 打造的长篇小说交互式分镜拆解、双轨记忆与 IF 变轨沙盒引擎。

---

## ✨ 核心特性

1. **🎭 化身角色参与剧情，改变走向**
   * **原著分镜大纲 (Canon Scene Graph)**：将长篇小说结构化拆解为具有时空、在场角色、原著预期结局的连续分镜。
   * **因果判定裁判 (Director Engine)**：实时监控玩家行为，判定是否达成原著目标或引发蝴蝶效应脱轨。
2. **🧠 三层双轨记忆库 (Dual-track Memory)**
   * **L1: 绝对静态设定 (World Lore)**：力量体系、地理历史等不可变世界书。
   * **L2: 时间线切片记忆 (Canon Snapshot)**：严格时间锚点锁定，杜绝剧透未来剧情。
   * **L3: 动态演变记忆 (IF Divergence)**：玩家产生的蝴蝶效应新因果，动态覆写原著设定（Dynamic Masking 防止死者复活等冲突）。
3. **💡 剧外锦囊引导 (OOC Guide HUD)**
   * 在侧边栏实时提供原著经典台词/行为提示与主线任务清单，让玩家**不翻书也能按原著顺畅对戏**。
4. **🔮 IF 演变与烂尾续写 (Sequel & Divergence)**
   * 自动追踪全书未闭合伏笔与暗线，基于玩家创造的变轨走向推演生成专属 IF 番外与圆满大纲。
5. **⚡ 灵活的双轨 API 调度体系**
   * **主 API 零配置**：默认直接复用 SillyTavern 当前主聊天模型执行后台判定与引导。
   * **多副 API 渠道指派**：支持添加多个 OpenAI 兼容端点（如硅基流动、DeepSeek、Claude 等），并将【剧情裁判】、【分镜清洗】、【动态记忆总结】、【烂尾续写】分别指派给不同模型。

---

## 📥 安装方法

### 方式 1：通过 SillyTavern 扩展管理器直接安装（推荐）

1. 打开 SillyTavern。
2. 进入 **扩展 (Extensions)** 标签页（顶部积木图标）。
3. 点击 **安装扩展 (Install Extension)**。
4. 在 Git 仓库 URL 输入框中粘贴：
   ```
   https://github.com/mooncake-2004/novel-ST
   ```
5. 点击安装并刷新页面即可。

### 方式 2：手动克隆

将本仓库克隆至 SillyTavern 的 `public/scripts/extensions/third-party/novel-ST` 目录下：
```bash
cd SillyTavern/public/scripts/extensions/third-party/
git clone https://github.com/mooncake-2004/novel-ST.git
```

---

## 🛠️ 本地开发与构建

```bash
# 1. 安装依赖
npm install

# 2. 生产打包构建
npm run build
```
打包产物将输出至 `dist/` 目录。

---

## 📄 开源协议

MIT License
