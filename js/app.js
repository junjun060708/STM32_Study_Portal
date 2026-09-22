/**
 * STM32 进阶学习工作台 - 交互控制器 (V3.1 示波器与超清矢量原理图集版)
 * 包含：分类手风琴、打卡统计、即时搜索、高精度矢量示波器、江科大高清矢量架构图渲染与全屏放大
 */

document.addEventListener("DOMContentLoaded", () => {
  const data = window.COURSE_DATA;
  if (!data) {
    console.error("COURSE_DATA 未正确加载！");
    return;
  }

  let currentChapterId = "ch12-3";
  let wwdgTimer = null;
  let wwdgVal = 0x7F;
  const wwdgWindow = 0x5F;
  const wwdgResetThreshold = 0x40;

  // 高清矢量原理图与架构图对应关系字典
  const DIAGRAM_MAP = {
    "ch12-3": { 
      src: "assets/images/rtc_system_architecture.svg", 
      title: "RTC 实时时钟与 BKP 内部架构图", 
      desc: "展示 LSE 32.768kHz 晶振、预分频器 PRL=32767、1Hz 秒脉冲发生器与 32位秒计数器 CNT 的完整拓扑流向" 
    },
    "ch13-1": { 
      src: "assets/images/pwr_architecture_diagram.svg", 
      title: "STM32 四级供电分区与低功耗切断架构图", 
      desc: "直观拆解 VDD 主电源、1.8V 内核供电 (LDO)、VBAT 备份域在不同模式下的通断电与功耗表现" 
    },
    "ch13-2": { 
      src: "assets/images/stm32f103c8t6_pinout.svg", 
      title: "STM32F103C8T6 核心引脚全景图", 
      desc: "实战必备：精准标注 PA0(WKUP唤醒引脚)、PC13(板载LED指示灯)与 PA13/PA14(SWD调试防变砖保护引脚)" 
    },
    "ch14-1": { 
      src: "assets/images/iwdg_wwdg_comparison.svg", 
      title: "IWDG 独立看门狗 vs WWDG 窗口看门狗 内部原理对比图", 
      desc: "清晰展示独立 LSI 40kHz 时钟与 APB1 总线分频时钟的差异，以及 WWDG 7位递减计数器在时间轴上的窗口区间" 
    },
    "ch14-2": { 
      src: "assets/images/iwdg_wwdg_comparison.svg", 
      title: "看门狗硬件时序与防死机实机验证框图", 
      desc: "对比分析主晶振停振下的独立看门狗复位与程序跑飞逻辑错乱下的窗口看门狗复位动作" 
    },
    "ch15-1": { 
      src: "assets/images/flash_64kb_memory_map.svg", 
      title: "Flash 64KB 物理扇区与先擦后写原理图", 
      desc: "直观展示 64 个 1KB 页面的地址划分、代码固件区与最后一页 (Page 63: 0x0800FC00) 掉电存储区的底层状态机" 
    },
    "ch15-2": { 
      src: "assets/images/flash_64kb_memory_map.svg", 
      title: "内部 Flash 模拟 EEPROM 与 96 位 UID 读取图解", 
      desc: "展示 Page 63 擦写时序与直接通过 C 语言指针读取 0x1FFFF7E8 唯一身份 ID 的内存分布" 
    },
    "ch50": { 
      src: "assets/images/stm32f103c8t6_pinout.svg", 
      title: "STM32F103 硬件系统全景图", 
      desc: "全套外设引脚与总线矩阵回顾" 
    },
    "ch03": { 
      src: "assets/images/stm32f103c8t6_pinout.svg", 
      title: "STM32F103C8T6 全引脚功能速查图", 
      desc: "GPIO 推挽输出、上拉输入与外设复用管脚一览" 
    },
    "ch06": { 
      src: "assets/images/pwm_principle_diagram.svg", 
      title: "TIM 定时器输出比较 (OC) 与 PWM 占空比生成图", 
      desc: "经典 CNT 锯齿波与 CCR 比较值相交产生高低电平方波的底层硬件过程" 
    },
    "ch09": { 
      src: "assets/images/stm32f103c8t6_pinout.svg", 
      title: "USART1 串口收发硬件管脚连接图", 
      desc: "展示 PA9(TX) 与 PA10(RX) 交叉连接与通信引脚" 
    },
    "ch10": { 
      src: "assets/images/i2c_bus_timing_diagram.svg", 
      title: "I2C 总线完整通信时序与应答机制图", 
      desc: "起始信号、8位数据稳定传输、从机第9位拉低 ACK、停止信号的完整规范图解" 
    },
    "ch11": { 
      src: "assets/images/spi_modes_timing_diagram.svg", 
      title: "SPI 四种通信模式 (Mode 0 ~ 3) 时钟极性与相位对照图", 
      desc: "CPOL=0/1 与 CPHA=0/1 时钟上升沿与下降沿采样的对比" 
    }
  };

  // 读取本地存储的打卡进度
  let finishedChapters = JSON.parse(localStorage.getItem("stm32_finished_chapters") || "[]");

  // DOM 引用
  const navContainer = document.getElementById("chapter-nav");
  const mainContent = document.getElementById("main-content");
  const hudFreq = document.getElementById("hud-freq");
  const hudMode = document.getElementById("hud-mode");
  const hudProgress = document.getElementById("hud-progress");
  const searchInput = document.getElementById("nav-search");
  const mobileToggle = document.getElementById("mobile-toggle");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");

  // 1. 渲染导航分类与手风琴
  function renderNav(filterKeyword = "") {
    navContainer.innerHTML = "";
    const lowerKey = filterKeyword.trim().toLowerCase();

    data.categories.forEach((cat) => {
      const catChapters = data.chapters.filter((ch) => {
        const inCat = ch.catId === cat.id;
        if (!inCat) return false;
        if (!lowerKey) return true;
        return (
          ch.title.toLowerCase().includes(lowerKey) ||
          ch.num.toLowerCase().includes(lowerKey) ||
          ch.summary.toLowerCase().includes(lowerKey) ||
          ch.badge.toLowerCase().includes(lowerKey)
        );
      });

      if (catChapters.length === 0) return;

      const section = document.createElement("div");
      section.className = "category-group";

      const header = document.createElement("div");
      header.className = "category-header";
      header.innerHTML = `
        <div class="category-header-title">
          <span>${cat.name}</span>
        </div>
        <span class="category-arrow">▾</span>
      `;

      const list = document.createElement("div");
      list.className = "category-list";

      catChapters.forEach((ch) => {
        const isDone = finishedChapters.includes(ch.id);
        const item = document.createElement("div");
        item.className = `chapter-nav-item ${ch.id === currentChapterId ? "active" : ""}`;
        item.setAttribute("data-id", ch.id);
        item.innerHTML = `
          <div class="chapter-nav-header">
            <span class="chapter-num">${ch.num}</span>
            <div style="display:flex; align-items:center; gap:4px;">
              ${isDone ? `<span class="badge-done">✓ 已学</span>` : ""}
              <span class="chapter-tag">${ch.badge}</span>
            </div>
          </div>
          <div class="chapter-title">${ch.title}</div>
        `;

        item.addEventListener("click", () => {
          selectChapter(ch.id);
          if (window.innerWidth <= 768) {
            sidebar.classList.remove("open");
            sidebarBackdrop.classList.remove("open");
          }
        });

        list.appendChild(item);
      });

      header.addEventListener("click", () => {
        list.classList.toggle("collapsed");
        header.querySelector(".category-arrow").textContent = list.classList.contains("collapsed") ? "▸" : "▾";
      });

      section.appendChild(header);
      section.appendChild(list);
      navContainer.appendChild(section);
    });

    updateProgressHUD();
  }

  // 2. 选择章节
  function selectChapter(id) {
    currentChapterId = id;
    const ch = data.chapters.find((c) => c.id === id);
    if (!ch) return;

    document.querySelectorAll(".chapter-nav-item").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-id") === id);
    });

    updateHUD(ch);
    renderChapterDetail(ch);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 3. 更新 HUD
  function updateHUD(ch) {
    if (ch.id === "ch13-1" || ch.id === "ch13-2") {
      hudMode.textContent = "PWR_LOW_POWER";
      hudFreq.textContent = "72MHz -> 8MHz/0Hz";
    } else if (ch.id === "ch14-1" || ch.id === "ch14-2") {
      hudMode.textContent = "WDG_GUARDING";
      hudFreq.textContent = "LSI ~40kHz";
    } else if (ch.id === "ch15-1" || ch.id === "ch15-2") {
      hudMode.textContent = "FLASH_FPEC";
      hudFreq.textContent = "72MHz (2 WS)";
    } else if (ch.id === "ch10") {
      hudMode.textContent = "I2C_BUS_ACTIVE";
      hudFreq.textContent = "400kHz (Fast)";
    } else if (ch.id === "ch11") {
      hudMode.textContent = "SPI_FULL_DUPLEX";
      hudFreq.textContent = "18MHz (SPI1)";
    } else {
      hudMode.textContent = "SYS_ACTIVE";
      hudFreq.textContent = "72MHz";
    }
  }

  // 4. 更新打卡统计 HUD
  function updateProgressHUD() {
    const total = data.chapters.length;
    const done = finishedChapters.length;
    if (hudProgress) {
      const pct = Math.round((done / total) * 100);
      hudProgress.innerHTML = `已学打卡: <strong style="color:var(--green-neon);">${done}/${total}</strong> (${pct}%)`;
    }
  }

  // 5. 渲染章节详情
  function renderChapterDetail(ch) {
    const isDone = finishedChapters.includes(ch.id);

    // 示波器面板 HTML
    let scopeHTML = "";
    if (ch.scope) {
      scopeHTML = createOscilloscopeHTML(ch.scope);
    }

    // 高清矢量原理图 HTML
    let diagramHTML = "";
    const diagram = DIAGRAM_MAP[ch.id];
    if (diagram) {
      diagramHTML = `
        <section class="diagram-card">
          <div class="section-header">
            <h3 class="section-title">📐 江科大高清硬件架构与原理图集 (矢量高清 · 可点击放大)</h3>
            <span class="sandbox-badge">HD VECTOR SCHEMATIC</span>
          </div>
          <div class="diagram-img-wrap" onclick="window.openLightbox('${diagram.src}', '${diagram.title}')" title="点击全屏高清放大查看">
            <img src="${diagram.src}" alt="${diagram.title}" class="diagram-img-view" />
          </div>
          <div class="diagram-caption">
            <strong>🔍 图解核心：${diagram.title}</strong> — ${diagram.desc}
          </div>
        </section>
      `;
    }

    // 交互沙盘 HTML
    let sandboxHTML = "";
    if (ch.id === "ch13-1" || ch.id === "ch13-2") {
      sandboxHTML = createPWRSandboxHTML();
    } else if (ch.id === "ch14-1" || ch.id === "ch14-2") {
      sandboxHTML = createWWDGSandboxHTML();
    } else if (ch.id === "ch15-1" || ch.id === "ch15-2") {
      sandboxHTML = createFlashSandboxHTML();
    }

    // 实物接线表 HTML
    let wiringHTML = "";
    if (ch.wiring && ch.wiring.length > 0) {
      wiringHTML = `
        <section class="wiring-card">
          <div class="section-header">
            <h3 class="section-title">实机接线引脚对照表 (Pinout & Wiring)</h3>
            <span class="sandbox-badge">HARDWARE HOOKUP</span>
          </div>
          <div class="table-responsive">
            <table class="wiring-table">
              <thead>
                <tr>
                  <th>外设引脚</th>
                  <th>STM32 管脚</th>
                  <th>信号方向</th>
                  <th>电气与实战说明</th>
                </tr>
              </thead>
              <tbody>
                ${ch.wiring.map((w) => `
                  <tr>
                    <td><strong>${w.pin}</strong></td>
                    <td><span class="pin-badge">${w.mcu}</span></td>
                    <td>${w.dir}</td>
                    <td style="color: var(--text-muted);">${w.desc}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>
      `;
    }

    // 标准库配置步骤 HTML
    let configStepsHTML = "";
    if (ch.configSteps && ch.configSteps.length > 0) {
      configStepsHTML = `
        <section class="steps-card">
          <div class="section-header">
            <h3 class="section-title">标准库底层配置步骤流程</h3>
            <span class="sandbox-badge">CODE WORKFLOW</span>
          </div>
          <div class="steps-list">
            ${ch.configSteps.map((step, idx) => `
              <div class="step-item">
                <span class="step-index-badge">${idx + 1}</span>
                <span class="step-text">${step}</span>
              </div>
            `).join("")}
          </div>
        </section>
      `;
    }

    // 寄存器位解析 HTML
    let registersHTML = "";
    if (ch.registers && ch.registers.length > 0) {
      registersHTML = `
        <section class="info-card">
          <h3>📘 核心关键寄存器与位说明 (江科大重点拆解)</h3>
          <ul class="info-list">
            ${ch.registers.map((r) => `
              <li><strong style="color:var(--cyan-primary);">${r.name}：</strong>${r.desc}</li>
            `).join("")}
          </ul>
        </section>
      `;
    }

    mainContent.innerHTML = `
      <!-- 章节头部 -->
      <section class="chapter-hero">
        <div class="hero-meta">
          <span class="hero-tag-badge">${ch.num}</span>
          <span class="hero-tag-badge" style="background: rgba(0,255,136,0.1); border-color: rgba(0,255,136,0.3); color: var(--green-neon);">
            难度重要度: ${ch.stars}
          </span>
          <button class="btn-checkin ${isDone ? "is-done" : ""}" id="btn-checkin" data-id="${ch.id}">
            ${isDone ? "✅ 已掌握打卡 (点击取消)" : "🎯 标记为已学会打卡"}
          </button>
        </div>
        <h2 class="hero-title">${ch.title}</h2>
        
        <!-- 大白话秒懂比喻 -->
        <div class="hero-analogy">
          <strong>💡 极客大白话秒懂比喻：</strong><br>
          ${ch.whiteboard.metaphor.replace(/\n/g, "<br>")}
        </div>

        <p class="hero-summary">${ch.summary}</p>
      </section>

      <!-- 灵魂拷问 -->
      <section class="soul-card">
        <div class="soul-header">
          <span>🤔 单片机底层灵魂拷问（打破死记硬背）</span>
        </div>
        <div class="soul-content">
          ${ch.whiteboard.soulQuestion.replace(/\n/g, "<br>")}
        </div>
      </section>

      <!-- 虚拟示波器波形面板 (亮点 1) -->
      ${scopeHTML}

      <!-- 高清硬件架构原理图 (亮点 2) -->
      ${diagramHTML}

      <!-- 动态交互沙盘 (亮点 3) -->
      ${sandboxHTML ? `
      <section class="sandbox-card">
        <div class="section-header">
          <h3 class="section-title">外设动态交互实验沙盘</h3>
          <span class="sandbox-badge">INTERACTIVE SIMULATOR</span>
        </div>
        ${sandboxHTML}
      </section>` : ""}

      <!-- 实物接线引脚表 -->
      ${wiringHTML}

      <!-- 标准库配置步骤 -->
      ${configStepsHTML}

      <!-- 硬件底层机制 & 引脚保护 -->
      <section class="knowledge-grid">
        <div class="info-card">
          <h3>⚡ 硬件核心时钟与寄存器</h3>
          <p style="font-size: 13px; color: var(--cyan-primary); margin-bottom: 8px; font-family: var(--font-mono);">
            ${ch.hardware.domain}
          </p>
          <ul class="info-list">
            ${ch.hardware.key_parts.map((p) => `<li>${p}</li>`).join("")}
          </ul>
        </div>
        <div class="info-card">
          <h3>🛡️ 实操软硬件基准规范</h3>
          <ul class="info-list">
            <li><strong>芯片基准：</strong>STM32F103C8T6 (LQFP48 封装)</li>
            <li><strong>编译环境：</strong>Keil uVision 5 (MDK-ARM) + 标准外设库 V3.5.0</li>
            <li><strong>调试保护：</strong>SWD 模式 (PA13/PA14 绝对保护，禁止改复用)</li>
            <li><strong>板载 LED：</strong>PC13 通用推挽输出，低电平点亮</li>
          </ul>
        </div>
      </section>

      <!-- 寄存器位解析 -->
      ${registersHTML}

      <!-- 标准库 C 源码展示 -->
      <section class="code-card">
        <div class="code-header">
          <div class="code-title-wrap">
            <span class="code-badge">C SOURCE</span>
            <span>STM32F10x 标准库 V3.5.0 规范驱动 (UTF-8 中文注释)</span>
          </div>
          <div class="code-legend">
            <span class="legend-dot-item"><span class="code-legend-dot dot-green"></span><span style="color:#86efac;">绿色教学注释</span></span>
            <span class="legend-dot-item"><span class="code-legend-dot dot-amber"></span><span style="color:#fde047;">★ 本章核心掌握代码</span></span>
            <span class="legend-dot-item"><span class="code-legend-dot dot-blue"></span><span style="color:#7dd3fc;">C关键字</span></span>
          </div>
          <button class="btn-copy-code" id="btn-copy" data-code="${encodeURIComponent(ch.codeSnippet)}">
            📋 复制代码到 Keil
          </button>
        </div>
        <div class="code-body">${renderHighlightedCode(ch.codeSnippet)}</div>
      </section>

      <!-- 避坑指南 -->
      <section class="pitfall-card">
        <div class="pitfall-header">
          <span>🚨 大学生实战避坑防雷指南（常见翻车与考点分析）</span>
        </div>
        <ul class="pitfall-list">
          ${ch.pitfalls.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </section>
    `;

    // 绑定打卡
    const checkinBtn = document.getElementById("btn-checkin");
    if (checkinBtn) {
      checkinBtn.addEventListener("click", () => {
        const id = checkinBtn.getAttribute("data-id");
        if (finishedChapters.includes(id)) {
          finishedChapters = finishedChapters.filter((x) => x !== id);
        } else {
          finishedChapters.push(id);
        }
        localStorage.setItem("stm32_finished_chapters", JSON.stringify(finishedChapters));
        renderNav(searchInput ? searchInput.value : "");
        selectChapter(id);
      });
    }

    // 绑定代码复制
    const copyBtn = document.getElementById("btn-copy");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const code = decodeURIComponent(copyBtn.getAttribute("data-code"));
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.textContent = "✅ 已复制到剪贴板！可以直接粘贴进 Keil 5";
          setTimeout(() => {
            copyBtn.textContent = "📋 复制代码到 Keil";
          }, 2000);
        });
      });
    }

    // 初始化沙盘
    if (ch.id === "ch13-1" || ch.id === "ch13-2") {
      initPWRSandbox();
    } else if (ch.id === "ch14-1" || ch.id === "ch14-2") {
      initWWDGSandbox();
    } else if (ch.id === "ch15-1" || ch.id === "ch15-2") {
      initFlashSandbox();
    }
  }

  // ================= 示波器波形生成引擎 (SVG Engine) =================
  function createOscilloscopeHTML(scope) {
    const svgContent = generateScopeSVG(scope);

    return `
      <section class="scope-panel">
        <div class="scope-top-bar">
          <div class="scope-indicator-group">
            <span class="scope-badge-run">● TRIG'D</span>
            <span class="scope-param">时基: <strong>${scope.timeBase}</strong></span>
            <span class="scope-param">垂直: <strong>${scope.voltsDiv}</strong></span>
            <span class="scope-param">触发: <strong>${scope.trigger}</strong></span>
          </div>
          <span style="color:var(--cyan-primary); font-weight:bold;">VIRTUAL DIGITAL OSCILLOSCOPE</span>
        </div>

        <div class="scope-screen-wrap">
          ${svgContent}
        </div>

        <div class="scope-legend-wrap">
          <div class="scope-signals">
            ${scope.signals.map((sig) => `
              <div class="scope-sig-item">
                <span class="sig-color-dot" style="background: ${sig.color}; box-shadow: 0 0 6px ${sig.color};"></span>
                <span style="color: ${sig.color}; font-weight: bold;">${sig.name}</span>
              </div>
            `).join("")}
          </div>
          <div class="scope-notes">
            <strong>🔍 示波器图解波形分析：</strong> ${scope.notes}
          </div>
        </div>
      </section>
    `;
  }

  function generateScopeSVG(scope) {
    const width = 800;
    const height = 240;
    
    let gridLines = "";
    for (let x = 80; x < width; x += 80) {
      gridLines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(56, 189, 248, 0.12)" stroke-dasharray="2,2"/>`;
    }
    for (let y = 30; y < height; y += 30) {
      gridLines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(56, 189, 248, 0.12)" stroke-dasharray="2,2"/>`;
    }
    gridLines += `<line x1="${width/2}" y1="0" x2="${width/2}" y2="${height}" stroke="rgba(56, 189, 248, 0.25)"/>`;
    gridLines += `<line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="rgba(56, 189, 248, 0.25)"/>`;

    let paths = "";
    scope.signals.forEach((sig, idx) => {
      const pathData = getWaveformPath(sig.type, width, height, idx, scope.signals.length);
      paths += `
        <path d="${pathData}" fill="none" stroke="${sig.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
              style="filter: drop-shadow(0 0 5px ${sig.color});" />
      `;
    });

    return `
      <svg class="scope-svg-canvas" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#030712"/>
        ${gridLines}
        ${paths}
      </svg>
    `;
  }

  function getWaveformPath(type, width, height, index, totalChannels) {
    let d = "";
    const rowHeight = height / (totalChannels + 1);
    const baseY = (index + 1) * rowHeight;
    const amp = Math.min(rowHeight * 0.42, 45);

    switch (type) {
      case "sine": {
        d = `M 0 ${baseY}`;
        const cycles = 12;
        for (let x = 0; x <= width; x += 4) {
          const y = baseY + Math.sin((x / width) * cycles * 2 * Math.PI) * amp;
          d += ` L ${x} ${y.toFixed(1)}`;
        }
        break;
      }

      case "pulse_1hz": {
        d = `M 0 ${baseY + amp}`;
        const pulseWidth = 20;
        const period = 260;
        for (let x = 0; x < width; x += period) {
          d += ` L ${x + 60} ${baseY + amp}`;
          d += ` L ${x + 60} ${baseY - amp}`;
          d += ` L ${x + 60 + pulseWidth} ${baseY - amp}`;
          d += ` L ${x + 60 + pulseWidth} ${baseY + amp}`;
        }
        d += ` L ${width} ${baseY + amp}`;
        break;
      }

      case "current_step": {
        const topY = baseY - amp;
        const midY = baseY;
        const botY = baseY + amp;
        d = `M 0 ${topY} L 240 ${topY} L 240 ${midY} L 520 ${midY} L 520 ${botY} L ${width} ${botY}`;
        break;
      }

      case "clock_72m": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${botY}`;
        const halfPeriod = 12;
        for (let x = 0; x < width; x += halfPeriod * 2) {
          d += ` L ${x} ${topY} L ${x + halfPeriod} ${topY} L ${x + halfPeriod} ${botY} L ${x + halfPeriod * 2} ${botY}`;
        }
        break;
      }

      case "clock_8m": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${botY}`;
        const halfPeriod = 80;
        for (let x = 0; x < width; x += halfPeriod * 2) {
          d += ` L ${x} ${topY} L ${x + halfPeriod} ${topY} L ${x + halfPeriod} ${botY} L ${x + halfPeriod * 2} ${botY}`;
        }
        break;
      }

      case "wwdg_ramp": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${topY} L 400 ${botY} L 400 ${topY} L 800 ${botY}`;
        break;
      }
      case "wwdg_window": {
        const lineY = baseY;
        d = `M 0 ${lineY} L ${width} ${lineY}`;
        break;
      }

      case "flash_erase_pulse": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${botY} L 180 ${botY} L 180 ${topY} L 600 ${topY} L 600 ${botY} L ${width} ${botY}`;
        break;
      }
      case "flash_bsy": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${botY} L 180 ${botY} L 180 ${topY} L 620 ${topY} L 620 ${botY} L ${width} ${botY}`;
        break;
      }

      case "flash_prog_pulse": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${botY}`;
        for (let x = 80; x < width; x += 160) {
          d += ` L ${x} ${botY} L ${x} ${topY} L ${x + 60} ${topY} L ${x + 60} ${botY}`;
        }
        d += ` L ${width} ${botY}`;
        break;
      }

      case "key_bounce": {
        const highY = baseY - amp;
        const lowY = baseY + amp;
        d = `M 0 ${highY} L 160 ${highY}`;
        d += ` L 170 ${lowY} L 178 ${highY} L 185 ${lowY} L 192 ${highY} L 200 ${lowY} L 208 ${highY} L 216 ${lowY}`;
        d += ` L ${width} ${lowY}`;
        break;
      }

      case "pwm_25": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${botY}`;
        const period = 160;
        const onTime = 40;
        for (let x = 0; x < width; x += period) {
          d += ` L ${x} ${topY} L ${x + onTime} ${topY} L ${x + onTime} ${botY} L ${x + period} ${botY}`;
        }
        break;
      }

      case "pwm_75": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${botY}`;
        const period = 160;
        const onTime = 120;
        for (let x = 0; x < width; x += period) {
          d += ` L ${x} ${topY} L ${x + onTime} ${topY} L ${x + onTime} ${botY} L ${x + period} ${botY}`;
        }
        break;
      }

      case "uart_char_a": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        const bitW = 70;
        d = `M 0 ${topY} L 70 ${topY}`;
        d += ` L 70 ${botY} L ${70 + bitW} ${botY}`;
        d += ` L ${70 + bitW} ${topY} L ${70 + bitW * 2} ${topY}`;
        d += ` L ${70 + bitW * 2} ${botY} L ${70 + bitW * 7} ${botY}`;
        d += ` L ${70 + bitW * 7} ${topY} L ${70 + bitW * 8} ${topY}`;
        d += ` L ${70 + bitW * 8} ${botY} L ${70 + bitW * 9} ${botY}`;
        d += ` L ${70 + bitW * 9} ${topY} L ${width} ${topY}`;
        break;
      }

      case "i2c_scl": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        const clockW = 35;
        d = `M 0 ${topY} L 80 ${topY}`;
        for (let x = 80; x < 80 + clockW * 18; x += clockW * 2) {
          d += ` L ${x} ${botY} L ${x + clockW} ${botY} L ${x + clockW} ${topY} L ${x + clockW * 2} ${topY}`;
        }
        d += ` L ${width} ${topY}`;
        break;
      }

      case "i2c_sda": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${topY} L 60 ${topY} L 60 ${botY} L 180 ${botY} L 180 ${topY} L 320 ${topY}`;
        d += ` L 380 ${botY} L 450 ${botY} L 450 ${topY}`;
        d += ` L 680 ${topY} L 680 ${botY} L 730 ${botY} L 730 ${topY} L ${width} ${topY}`;
        break;
      }

      case "spi_cs": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${topY} L 60 ${topY} L 60 ${botY} L 720 ${botY} L 720 ${topY} L ${width} ${topY}`;
        break;
      }
      case "spi_sck": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        const w = 38;
        d = `M 0 ${botY} L 80 ${botY}`;
        for (let x = 80; x < 80 + w * 16; x += w * 2) {
          d += ` L ${x} ${topY} L ${x + w} ${topY} L ${x + w} ${botY} L ${x + w * 2} ${botY}`;
        }
        d += ` L ${width} ${botY}`;
        break;
      }
      case "spi_mosi": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${botY} L 80 ${botY} L 80 ${topY} L 240 ${topY} L 240 ${botY} L 460 ${botY} L 460 ${topY} L 690 ${topY} L 690 ${botY} L ${width} ${botY}`;
        break;
      }
      case "spi_miso": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${botY} L 120 ${botY} L 120 ${topY} L 300 ${topY} L 300 ${botY} L 520 ${botY} L 520 ${topY} L 690 ${topY} L 690 ${botY} L ${width} ${botY}`;
        break;
      }

      case "nrst_pulse": {
        const topY = baseY - amp;
        const botY = baseY + amp;
        d = `M 0 ${topY} L 420 ${topY} L 420 ${botY} L 460 ${botY} L 460 ${topY} L ${width} ${topY}`;
        break;
      }

      default: {
        d = `M 0 ${baseY} L ${width} ${baseY}`;
      }
    }

    return d;
  }

  // ================= 1. PWR 沙盘 =================
  function createPWRSandboxHTML() {
    return `
      <div class="pwr-sandbox">
        <div class="pwr-controls">
          <button class="pwr-btn active" data-mode="run">
            <span>运行模式 (RUN)</span>
            <span class="pwr-subtext">全速 72MHz 跑分</span>
          </button>
          <button class="pwr-btn" data-mode="sleep">
            <span>睡眠模式 (SLEEP)</span>
            <span class="pwr-subtext">内核休息 外设工作</span>
          </button>
          <button class="pwr-btn" data-mode="stop">
            <span>停止模式 (STOP)</span>
            <span class="pwr-subtext">时钟冻结 内存保留</span>
          </button>
          <button class="pwr-btn" data-mode="standby">
            <span>待机模式 (STANDBY)</span>
            <span class="pwr-subtext">极限断电 微安沉睡</span>
          </button>
        </div>

        <div class="pwr-monitor-board">
          <div class="pwr-monitor-item">
            <span class="pwr-monitor-label">CPU 内核状态</span>
            <span class="pwr-monitor-val" id="pwr-cpu-state">
              <span class="pwr-status-state state-on"></span>高速运算执行中
            </span>
          </div>
          <div class="pwr-monitor-item">
            <span class="pwr-monitor-label">系统主时钟 (SYSCLK)</span>
            <span class="pwr-monitor-val" id="pwr-clk-val">72 MHz (HSE+PLL)</span>
          </div>
          <div class="pwr-monitor-item">
            <span class="pwr-monitor-label">SRAM / 变量内存</span>
            <span class="pwr-monitor-val" id="pwr-sram-state" style="color: var(--green-neon);">完整保持</span>
          </div>
          <div class="pwr-monitor-item">
            <span class="pwr-monitor-label">实测电流模拟 (3.3V)</span>
            <span class="pwr-monitor-val" id="pwr-current-val" style="color: #facc15;">~ 32.5 mA</span>
          </div>
        </div>

        <div class="pwr-desc-box" id="pwr-desc">
          <strong>【运行模式 (RUN)】</strong>全速跑满！芯片内部所有振荡器全开，PC13 指示灯可高速翻转，功耗在数十毫安级。
        </div>
      </div>
    `;
  }

  function initPWRSandbox() {
    const btns = document.querySelectorAll(".pwr-btn");
    const cpuState = document.getElementById("pwr-cpu-state");
    const clkVal = document.getElementById("pwr-clk-val");
    const sramState = document.getElementById("pwr-sram-state");
    const currentVal = document.getElementById("pwr-current-val");
    const desc = document.getElementById("pwr-desc");

    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        btns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.getAttribute("data-mode");

        if (mode === "run") {
          cpuState.innerHTML = `<span class="pwr-status-state state-on"></span>高速运算执行中`;
          clkVal.textContent = "72 MHz (HSE+PLL)";
          sramState.innerHTML = `<span style="color: var(--green-neon);">完整保持</span>`;
          currentVal.textContent = "~ 32.5 mA";
          desc.innerHTML = `<strong>【运行模式 (RUN)】</strong>全速跑满！芯片内部所有振荡器全开，PC13 指示灯可高速翻转，功耗在数十毫安级。`;
        } else if (mode === "sleep") {
          cpuState.innerHTML = `<span class="pwr-status-state state-sleep"></span>闭目养神 (等待WFI中断)`;
          clkVal.textContent = "72 MHz (仅维持外设)";
          sramState.innerHTML = `<span style="color: var(--green-neon);">完整保持</span>`;
          currentVal.textContent = "~ 11.2 mA";
          desc.innerHTML = `<strong>【睡眠模式 (SLEEP)】</strong>执行 <code>__WFI()</code> 后内核暂停取指令，外设仍在工作。外部按键或串口数据到来即可瞬间唤醒，省电约 65%！`;
        } else if (mode === "stop") {
          cpuState.innerHTML = `<span class="pwr-status-state state-off"></span>休眠冻结 (入定)`;
          clkVal.textContent = "0 Hz (所有振荡器关闭)";
          sramState.innerHTML = `<span style="color: var(--green-neon);">完整保持 (SRAM通电)</span>`;
          currentVal.textContent = "~ 24.0 µA";
          desc.innerHTML = `<strong>【停止模式 (STOP)】</strong>1.8V 域时钟全部切断，功耗直接骤降至<strong>微安级</strong>！可通过任意外部中断(EXTI)唤醒。<br><strong style="color:#ef4444;">★保命考点：被唤醒后系统默认退化为 8MHz 内部 HSI，必须立刻手动调用 SystemInit() 恢复 72MHz！</strong>`;
        } else if (mode === "standby") {
          cpuState.innerHTML = `<span class="pwr-status-state state-off"></span>完全断电假死`;
          clkVal.textContent = "0 Hz (仅留LSI/LSE走表)";
          sramState.innerHTML = `<span style="color: var(--red-alert);">数据全部丢失蒸发！(仅BKP存)</span>`;
          currentVal.textContent = "~ 2.1 µA";
          desc.innerHTML = `<strong>【待机模式 (STANDBY)】</strong>极限省电！1.8V 域完全关闭，SRAM 数据全部蒸发。只有 WKUP 引脚(PA0拉高)、RTC 闹钟或按复位键能叫醒，唤醒后相当于重新冷启动！`;
        }
      });
    });
  }

  // ================= 2. WWDG 沙盘 =================
  function createWWDGSandboxHTML() {
    return `
      <div class="wwdg-sandbox">
        <p style="font-size: 13px; color: var(--text-muted);">
          窗口看门狗 (WWDG) 拥有极其严苛的时间规则：递减计数器从 <strong>0x7F (127)</strong> 持续往下倒数。你<strong>只能在 [0x40, 0x5F] 绿色窗口内喂狗</strong>！
        </p>

        <div class="wwdg-timeline-container">
          <div class="wwdg-pointer-track">
            <div class="wwdg-pointer" id="wwdg-pointer" style="left: 0%;">
              <div class="wwdg-pointer-arrow"></div>
              <div class="wwdg-pointer-val" id="wwdg-val-disp">0x7F</div>
            </div>
          </div>

          <div class="wwdg-zones">
            <div class="zone-early">🚫 太早喂狗复位区 (&gt; 0x5F)</div>
            <div class="zone-window">✅ 安全喂狗窗口区 (0x40 ~ 0x5F)</div>
            <div class="zone-late">💀 超时未喂狗复位区 (&lt; 0x40)</div>
          </div>
        </div>

        <div class="wwdg-action-bar">
          <button class="btn-feed-dog" id="btn-feed">🦴 立即喂狗 (Feed Dog)</button>
          <div class="wwdg-msg" id="wwdg-status-msg">
            状态: 计数器正在递减... 请等待指针进入绿色安全区域后再点击喂狗！
          </div>
        </div>
      </div>
    `;
  }

  function initWWDGSandbox() {
    if (wwdgTimer) clearInterval(wwdgTimer);

    const pointer = document.getElementById("wwdg-pointer");
    const valDisp = document.getElementById("wwdg-val-disp");
    const feedBtn = document.getElementById("btn-feed");
    const msg = document.getElementById("wwdg-status-msg");

    wwdgVal = 0x7F;

    function resetWWDG(reason) {
      wwdgVal = 0x7F;
      if (reason === "early") {
        msg.innerHTML = `<span style="color: #ef4444; font-weight: bold;">💥【过早喂狗复位】太心急了！此时计数器 &gt; 0x5F，被 WWDG 判定为程序跑飞死循环乱喂狗，强制硬件复位！</span>`;
      } else if (reason === "timeout") {
        msg.innerHTML = `<span style="color: #ef4444; font-weight: bold;">💀【超时未喂复位】太晚了！计数器跌破 0x40，被 WWDG 判定为程序卡死跑飞，立即强制硬件复位！</span>`;
      } else if (reason === "success") {
        msg.innerHTML = `<span style="color: var(--green-neon); font-weight: bold;">🎉【喂狗成功】精准在黄金窗口内刷新！计数器已安全重置为 0x7F，系统平稳运行。</span>`;
      }
    }

    if (feedBtn) {
      feedBtn.addEventListener("click", () => {
        if (wwdgVal > wwdgWindow) {
          resetWWDG("early");
        } else if (wwdgVal >= wwdgResetThreshold) {
          resetWWDG("success");
        }
      });
    }

    wwdgTimer = setInterval(() => {
      wwdgVal--;
      const totalRange = 0x7F - 0x3F;
      const progress = ((0x7F - wwdgVal) / totalRange) * 100;

      if (pointer && valDisp) {
        pointer.style.left = `${Math.min(Math.max(progress, 0), 100)}%`;
        valDisp.textContent = `0x${wwdgVal.toString(16).toUpperCase()}`;
      }

      if (wwdgVal < wwdgResetThreshold) {
        resetWWDG("timeout");
      }
    }, 130);
  }

  // ================= 3. Flash 沙盘 =================
  function createFlashSandboxHTML() {
    return `
      <div class="flash-sandbox">
        <p style="font-size: 13px; color: var(--text-muted);">
          STM32F103C8T6 内部 Flash 共 <strong>64KB</strong>，切分为 <strong>64 个 1KB 页面 (Page 0 ~ Page 63)</strong>。<br>
          Flash 物理特性：<strong>只能将 1 写为 0，不能将 0 写为 1。因此写入前必须整页擦除(全0xFFFF)！</strong>
        </p>

        <div class="flash-matrix-wrap">
          <div class="flash-grid" id="flash-grid"></div>

          <div class="flash-legend">
            <div class="legend-item">
              <span class="legend-box" style="background: rgba(2, 132, 199, 0.4); border: 1px solid rgba(56, 189, 248, 0.5);"></span>
              <span>程序固件代码区 (Page 0 ~ 61)</span>
            </div>
            <div class="legend-item">
              <span class="legend-box" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);"></span>
              <span>缓冲保留页 (Page 62)</span>
            </div>
            <div class="legend-item">
              <span class="legend-box" style="background: rgba(16, 185, 129, 0.5); border: 1px solid var(--green-neon);"></span>
              <span>最后一页：掉电数据保存区 (Page 63: 0x0800FC00)</span>
            </div>
          </div>
        </div>

        <div class="flash-sim-controls">
          <button class="btn-flash-action" id="btn-flash-erase">🧹 擦除最后一页 (Erase Page 63)</button>
          <button class="btn-flash-action" id="btn-flash-write">✍️ 写入数据 0xA55A (Program HalfWord)</button>
          <button class="btn-flash-action" id="btn-read-uid">🔑 读取 96 位全球唯一 UID (防伪芯片指纹)</button>
        </div>

        <div class="pwr-desc-box" id="flash-info-disp">
          点击上方按钮，亲自体验内部 Flash 的底层擦除、写入与芯片电子签名读取过程。
        </div>
      </div>
    `;
  }

  function initFlashSandbox() {
    const grid = document.getElementById("flash-grid");
    const eraseBtn = document.getElementById("btn-flash-erase");
    const writeBtn = document.getElementById("btn-flash-write");
    const uidBtn = document.getElementById("btn-read-uid");
    const disp = document.getElementById("flash-info-disp");

    if (!grid) return;
    grid.innerHTML = "";

    for (let i = 0; i < 64; i++) {
      const cell = document.createElement("div");
      cell.className = "flash-page-cell";
      cell.textContent = i;
      cell.title = `Page ${i} (基地址: 0x0800${(i * 1024).toString(16).padStart(4, "0").toUpperCase()})`;

      if (i < 62) {
        cell.classList.add("type-code");
      } else if (i === 63) {
        cell.classList.add("type-data");
        cell.id = "page-63-cell";
      }
      grid.appendChild(cell);
    }

    const p63 = document.getElementById("page-63-cell");

    if (eraseBtn) {
      eraseBtn.addEventListener("click", () => {
        p63.style.background = "rgba(239, 68, 68, 0.45)";
        p63.style.borderColor = "#ef4444";
        disp.innerHTML = `<strong>【执行 FLASH_ErasePage(0x0800FC00)】</strong><br>
        已将最后一页 1024 字节全部格式化为 <code style="color:var(--cyan-primary);">0xFFFF</code>。现在处于就绪可写入状态！`;
      });
    }

    if (writeBtn) {
      writeBtn.addEventListener("click", () => {
        p63.style.background = "rgba(16, 185, 129, 0.7)";
        p63.style.borderColor = "var(--green-neon)";
        disp.innerHTML = `<strong>【执行 FLASH_ProgramHalfWord(0x0800FC00, 0xA55A)】</strong><br>
        成功向 0x0800FC00 写入半字数据 0xA55A！断电拔线、几年后再上电，该数据依然稳如泰山！`;
      });
    }

    if (uidBtn) {
      uidBtn.addEventListener("click", () => {
        disp.innerHTML = `<strong>【读取芯片 96 位唯一身份电子签名 (UID)】</strong><br>
        基地址 <code style="color:var(--cyan-primary);">0x1FFFF7E8</code> 读出结果：<br>
        UID = <span style="font-family:var(--font-mono); color:var(--green-neon); font-size:14px;">0x003A0019 - 0x31375102 - 0x30363832</span><br>
        <small style="color:var(--text-muted);">这是芯片出厂时激光烙印的防伪身份证。商用产品可通过加密校验此串号码，防止盗版抄板！</small>`;
      });
    }
  }

  // ================= 4. 全屏放大图片 (Lightbox) =================
  window.openLightbox = function(src, title) {
    let lightbox = document.getElementById("lightbox-modal");
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.id = "lightbox-modal";
      lightbox.className = "lightbox-modal";
      lightbox.innerHTML = `
        <button class="lightbox-close" id="lightbox-close">&times;</button>
        <img id="lightbox-img" class="lightbox-img" src="" alt="" />
      `;
      document.body.appendChild(lightbox);

      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox || e.target.id === "lightbox-close") {
          lightbox.classList.remove("open");
        }
      });
    }
    const imgEl = document.getElementById("lightbox-img");
    imgEl.src = src;
    imgEl.alt = title;
    lightbox.classList.add("open");
  };

  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 语法高亮与核心代码特殊标记渲染器
  function renderHighlightedCode(rawCode) {
    if (!rawCode) return "";
    const lines = rawCode.trim().split("\n");
    const keywords = new Set([
      "int", "char", "float", "double", "void", "long", "short", "signed", "unsigned",
      "uint8_t", "uint16_t", "uint32_t", "uint64_t", "int8_t", "int16_t", "int32_t",
      "typedef", "struct", "enum", "union", "static", "extern", "const", "volatile",
      "if", "else", "switch", "case", "default", "break", "continue", "return",
      "for", "while", "do", "goto", "sizeof"
    ]);

    const outputLines = [];

    lines.forEach((line, idx) => {
      const isCore = line.includes("[★本章核心学习重点]") || line.includes("[★本章核心]") || line.includes("[★核心安全外设]") || line.includes("[核心]") || line.includes("★");
      
      let pos = 0;
      const len = line.length;
      const parts = [];

      while (pos < len) {
        // 单行注释 //
        if (line.substr(pos, 2) === "//") {
          const commentText = line.substr(pos);
          parts.push(`<span class="c-comment">${escapeHTML(commentText)}</span>`);
          break;
        }
        // 多行注释 /* ... */
        else if (line.substr(pos, 2) === "/*") {
          const end = line.indexOf("*/", pos + 2);
          if (end !== -1) {
            parts.push(`<span class="c-comment">${escapeHTML(line.substring(pos, end + 2))}</span>`);
            pos = end + 2;
          } else {
            parts.push(`<span class="c-comment">${escapeHTML(line.substr(pos))}</span>`);
            break;
          }
        }
        // 字符串 "..."
        else if (line[pos] === '"') {
          let end = pos + 1;
          while (end < len && (line[end] !== '"' || line[end - 1] === "\\")) {
            end++;
          }
          end = Math.min(end + 1, len);
          parts.push(`<span class="c-string">${escapeHTML(line.substring(pos, end))}</span>`);
          pos = end;
        }
        // 预编译指令 #include, #define
        else if (pos === 0 && line.trim().startsWith("#")) {
          parts.push(`<span class="c-preproc">${escapeHTML(line)}</span>`);
          break;
        }
        // 单词与标识符
        else if (/[a-zA-Z_]/.test(line[pos])) {
          const match = line.substr(pos).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
          if (match) {
            const word = match[0];
            if (keywords.has(word)) {
              parts.push(`<span class="c-keyword">${escapeHTML(word)}</span>`);
            } else if (
              word.startsWith("GPIO_") || word.startsWith("RCC_") || word.startsWith("TIM_") ||
              word.startsWith("I2C_") || word.startsWith("SPI_") || word.startsWith("USART_") ||
              word.startsWith("RTC_") || word.startsWith("PWR_") || word.startsWith("IWDG_") ||
              word.startsWith("WWDG_") || word.startsWith("FLASH_") || word.startsWith("NVIC_") ||
              word.startsWith("EXTI_") || word.startsWith("BKP_") || word.startsWith("SysTick") ||
              word.startsWith("SystemInit") || word === word.toUpperCase()
            ) {
              if (isCore) {
                parts.push(`<span class="c-core-api">${escapeHTML(word)}</span>`);
              } else {
                parts.push(`<span class="c-stm32">${escapeHTML(word)}</span>`);
              }
            } else {
              parts.push(escapeHTML(word));
            }
            pos += word.length;
          } else {
            parts.push(escapeHTML(line[pos]));
            pos++;
          }
        }
        // 数字 (十六进制与十进制)
        else if (/^(0x[0-9a-fA-F]+|\d+)/.test(line.substr(pos))) {
          const match = line.substr(pos).match(/^(0x[0-9a-fA-F]+|\d+)/);
          parts.push(`<span class="c-number">${escapeHTML(match[0])}</span>`);
          pos += match[0].length;
        }
        else {
          parts.push(escapeHTML(line[pos]));
          pos++;
        }
      }

      const coreClass = isCore ? " is-core-line" : "";
      const badge = isCore ? '<span class="core-tag">★ 本章核心</span>' : "";
      outputLines.push(`<div class="code-line${coreClass}"><span class="line-num">${idx + 1}</span><span class="line-code">${parts.join("")}</span>${badge}</div>`);
    });

    return outputLines.join("");
  }

  // 搜索监听
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderNav(e.target.value);
    });
  }

  // 手机端侧边栏切换
  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      sidebarBackdrop.classList.toggle("open");
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", () => {
      sidebar.classList.remove("open");
      sidebarBackdrop.classList.remove("open");
    });
  }

  // 初始启动
  renderNav();
  selectChapter("ch12-3");
});
