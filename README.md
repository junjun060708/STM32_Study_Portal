# STM32 进阶极客研习社 (P43 ~ P50 交互式学习站点)

> **芯片平台**：STM32F103C8T6 (ARM Cortex-M3, 72MHz)  
> **固件库**：STM32F10x 标准外设库 V3.5.0  
> **技术风格**：纯静态免构建单页 / 深色科技感极客风 / 全端响应式自适应 (手机 & PC)

---

## 📖 项目简介

本项目专为跟随 B 站江科大（江协科技）《STM32入门教程》学习到 **[12-3] 读写备份寄存器 & 实时时钟** 后的学习者打造。

项目不仅系统整理并梳理了 **第 13、14、15 章以及全篇总结（P44 ~ P50）** 的所有硬件原理与标准库实战代码，还配备了 **三个开创性的动态外设模拟沙盘**，帮助你在写单片机代码前把抽象的电源域、喂狗时序和 Flash 擦写机制彻底吃透！

---

## 🌟 核心特色与功能

1. **赛博极客终端风**：黑曜石底色、赛博荧光蓝与终端绿点缀、毛玻璃质感，专为工科开发者打造。
2. **三大外设交互式动态沙盘**：
   - **低功耗模式沙盘 (P44/P45)**：动态切换 Run / Sleep / Stop / Standby，实时查看 CPU、时钟源、SRAM 与电流计读数模拟；
   - **WWDG 窗口看门狗动态走针 (P46/P47)**：直观体验“过早喂狗复位”、“窗口内安全喂狗”与“超时未喂复位”；
   - **Flash 64KB 存储矩阵地图 (P48/P49)**：可视化 64 个 1KB 扇区分布，体验“先擦后写”与“读取 96 位全球唯一 UID”。
3. **高质量标准库 C 源码**：每小节提供带详尽中文注释的标准库代码，支持一键复制代码直接粘贴至 Keil 5。
4. **硬件安全守护**：严格保护 SWD（PA13/PA14）调试引脚不被误配置为普通 GPIO，防止芯片变砖。
5. **多端自适应**：无论是电脑大屏，还是手机浏览器，排版自动优化，随时随地在手机上复习。

---

## 🖥️ 本地快速体验（零环境依赖）

本站点采用**极简免配置架构**，你的电脑不需要安装 Node.js、npm 等任何前端工具：

1. 进入本地目录：`D:\Antigravity\STM32_Study_Portal`
2. **直接双击 `index.html`**，即可在 Chrome、Edge、Safari 等任何现代浏览器中打开并开始学习！

---

## 🌐 如何让任何人的手机和电脑都能打开？（部署到 GitHub Pages）

由于直接在电脑打开使用的是本地文件路径（其他人无法访问你的本地硬盘），若想让**全球任何人、任何手机或电脑只要点开一个链接就能访问**，请按以下 4 步将其免费托管到 **GitHub Pages**：

### 步骤 1：新建 GitHub 仓库
1. 登录你的 [GitHub 账号](https://github.com/)；
2. 点击右上角的 **`+` -> `New repository`**；
3. 仓库名称填入：`stm32-study`（公开仓库 Public），点击 **Create repository**。

### 步骤 2：上传项目代码
在本地电脑打开终端（Terminal 或 PowerShell），进入本目录并执行：

```bash
cd D:\Antigravity\STM32_Study_Portal
git init
git add .
git commit -m "feat: init STM32 geek study portal"
git branch -M main
git remote add origin https://github.com/<你的GitHub用户名>/stm32-study.git
git push -u origin main
```
*(也可以直接在 GitHub 网页端点击 "uploading an existing file" 手动上传本文件夹下的所有文件)*

### 步骤 3：一键开启 GitHub Pages
1. 在 GitHub 仓库页面顶部点击 **Settings**；
2. 在左侧导航栏找到并点击 **Pages**；
3. 在 **Build and deployment** 下方的 **Branch** 下拉框中：
   - 选择 **`main`** 分支；
   - 目录选择 **`/ (root)`**；
   - 点击 **Save** 保存。

### 步骤 4：获取专属公开网址
等待 1~2 分钟刷新页面，页面顶部会出现绿色提示：
> **Your site is live at `https://<你的GitHub用户名>.github.io/stm32-study/`**

**大功告成！** 把这个链接复制下来：
- 发到手机微信里直接点开，手机自适应排版极佳；
- 发给任何朋友或老师，他们无论身在何处都能秒开学习！

---

## 📂 目录结构

```
D:\Antigravity\STM32_Study_Portal\
├── index.html          # 网站主入口（HUD 监视栏、响应式主体、部署弹窗）
├── css/
│   └── style.css       # 极客深色主题、发光动效、毛玻璃质感、移动端媒体查询
├── js/
│   ├── data.js         # P43~P50 完整知识库、通俗类比、带注释标准库 C 源码、避坑宝典
│   └── app.js          # 交互控制器、动态模拟沙盘逻辑、多端抽屉与代码复制
└── README.md           # 详细说明文档与 GitHub Pages 上线全流程
```
