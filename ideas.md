# Meridian Design Brainstorm

## 产品定位
Meridian 是一个 AI Sales Intelligence 平台，面向 B2B 销售团队。核心是将非结构化的对话数据转化为可行动的销售洞察。用户是销售专业人士，需要快速、清晰、可操作的信息。

---

<response>
<idea>

## Idea 1: "Intelligence Cartography" — 情报制图风格

**Design Movement**: 受军事/情报分析界面启发的 Analytical Dashboard 风格，融合现代数据可视化美学。

**Core Principles**:
1. **信息密度优先** — 每一寸屏幕都承载有意义的数据，但通过层级关系避免混乱
2. **状态即颜色** — 用色彩系统直接传达健康度，无需阅读文字即可判断状态
3. **空间即关系** — 利用空间位置表达 stakeholder 之间的关系和影响力

**Color Philosophy**: 以深蓝灰 (#1a1f36) 为底色，搭配琥珀色 (#f59e0b) 作为警告/注意力引导色，翡翠绿 (#10b981) 表示健康，珊瑚红 (#ef4444) 表示风险。白色用于高亮关键数据。整体传达"专业、冷静、可信赖"的情报分析氛围。

**Layout Paradigm**: 左侧固定导航 + Pipeline 列表 (240px)，中间主内容区域自适应，右侧可收起的 Context Panel。三栏结构确保信息层级清晰。

**Signature Elements**:
1. 连接线动画 — Stakeholder Map 中的关系线带有流动粒子效果
2. 信心指数仪表盘 — 圆形进度环，颜色随数值变化
3. 时间轴脉搏 — Deal Timeline 像心电图一样展示活跃度

**Interaction Philosophy**: 悬停即预览，点击即深入。所有卡片 hover 时展开更多信息，减少页面跳转。拖拽操作用于 Stakeholder Map 的位置调整。

**Animation**: 页面切换使用 slide + fade 组合，数据更新使用 spring 动画，Stakeholder Map 的连接线使用 SVG path 动画。所有动画控制在 200-400ms。

**Typography System**: 
- Display: Space Grotesk (Bold) — 用于页面标题和关键数字
- Body: Inter (Regular/Medium) — 用于正文和标签
- Mono: JetBrains Mono — 用于数据指标和代码

</idea>
<probability>0.08</probability>
<text>情报制图风格，深色底色搭配状态色彩系统，三栏布局，强调信息密度和空间关系</text>
</response>

<response>
<idea>

## Idea 2: "Soft Command Center" — 柔和指挥中心

**Design Movement**: 受 Linear、Notion 启发的现代 SaaS 设计，但更温暖、更有人情味。不是冰冷的数据面板，而是"你的销售伙伴"。

**Core Principles**:
1. **呼吸感** — 大量留白，让信息有呼吸的空间
2. **渐进式披露** — 默认展示最重要的信息，细节按需展开
3. **温度感** — 用暖色调和圆润的形状传达"AI 是你的伙伴"

**Color Philosophy**: 浅暖灰底色 (#fafaf8)，主色调为靛蓝 (#4f46e5) 传达专业感，辅以暖橙 (#f97316) 作为行动召唤色。Risk 用柔和的玫瑰红 (#e11d48)，Success 用薄荷绿 (#059669)。整体感觉像"晨光中的工作台"。

**Layout Paradigm**: 窄侧边栏 (60px icon-only) + 可展开的 Deal 列表面板 (280px) + 主内容区。侧边栏极简，只有图标，hover 展开标签。

**Signature Elements**:
1. 卡片微光效果 — 重要卡片有微妙的光晕边框，随状态变化
2. 关系图谱 — Stakeholder Map 使用气泡图风格，大小代表影响力
3. AI 洞察气泡 — AI 生成的建议以对话气泡形式出现

**Interaction Philosophy**: 一切皆可点击展开。卡片点击展开详情面板（不跳转页面），Stakeholder 点击展开个人档案。强调"流畅的单页体验"。

**Animation**: 使用 Framer Motion 的 layout 动画实现卡片展开/收起。页面转场使用 opacity + scale 组合。Stakeholder Map 使用 spring physics 实现拖拽回弹。

**Typography System**:
- Display: DM Sans (Bold) — 温暖但专业的标题字体
- Body: DM Sans (Regular/Medium) — 统一字体家族保持一致性
- Accent: DM Mono — 用于数字和指标

</idea>
<probability>0.06</probability>
<text>柔和指挥中心风格，浅暖色调，强调呼吸感和渐进式披露，温暖的 AI 伙伴感</text>
</response>

<response>
<idea>

## Idea 3: "Blueprint" — 蓝图/建筑图纸风格

**Design Movement**: 受建筑蓝图和工程图纸启发，将销售流程视为"建造一栋大楼"的过程。每个 Deal 是一个建筑项目，Stakeholders 是建筑团队。

**Core Principles**:
1. **结构即美** — 用网格线、对齐和精确的间距传达工程感
2. **过程可视化** — 将销售阶段视为建造楼层，每层有不同的角色
3. **标注系统** — 像建筑图纸一样，用标注线连接数据和说明

**Color Philosophy**: 深蓝底色 (#0f172a) 模拟蓝图纸，白色/浅蓝 (#93c5fd) 线条和文字。点缀色用琥珀 (#fbbf24) 标记"施工中"的部分，红色 (#ef4444) 标记"结构问题"。

**Layout Paradigm**: 全屏画布式布局，左侧固定的项目列表，中间是可缩放的"蓝图画布"。Stakeholder Map 就是蓝图的核心，占据主要视觉面积。

**Signature Elements**:
1. 网格背景 — 细微的点阵网格，像工程纸
2. 标注线 — 从 Stakeholder 节点延伸出的标注线，连接到信息面板
3. 进度条作为"楼层" — Deal Stage 用垂直的楼层图表示

**Interaction Philosophy**: 画布可缩放和平移，双击节点编辑，拖拽重新布局。像使用 Figma 一样操作 Stakeholder Map。

**Animation**: 连接线绘制动画（像画图纸），节点出现使用 scale + fade，画布缩放使用 smooth transform。

**Typography System**:
- Display: Space Mono (Bold) — 工程图纸感的等宽标题
- Body: IBM Plex Sans (Regular/Medium) — 技术文档风格的正文
- Labels: IBM Plex Mono — 标注和数据标签

</idea>
<probability>0.04</probability>
<text>蓝图风格，深蓝底色白色线条，画布式布局，将销售过程比喻为建筑工程</text>
</response>

---

## 选择

**选择 Idea 1: "Intelligence Cartography"**

理由：
1. 最符合 Meridian 的产品定位 — 销售情报平台需要"情报分析"的视觉语言
2. 深色主题在数据密集型应用中更专业，减少视觉疲劳
3. 三栏布局最适合 Deal 列表 + Stakeholder Map + Context 的信息架构
4. 状态色彩系统直接服务于"actionable insight"的核心需求
5. 参考图片中的设计语言（浅紫色调 + 卡片式布局）可以融入这个方向
