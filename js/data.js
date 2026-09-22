/**
 * STM32 进阶极客研习社 - 全体系深度学习知识库 (V3.0 示波器波形与江科大教学精讲版)
 * 包含：内部电路框图拆解、实物接线引脚表、标准库配置步骤、核心寄存器位解析、虚拟示波器时序图数据
 * 适配芯片: STM32F103C8T6 | 固件库: STM32F10x StdPeriph V3.5.0 | 编码: UTF-8
 */

const COURSE_DATA = {
  meta: {
    title: "STM32F103 进阶学习工作台",
    subtitle: "江科大教程进阶安全篇 (P43 ~ P50) + 经典外设回顾体系",
    mcu: "STM32F103C8T6 (64KB Flash, 20KB SRAM)",
    lib: "STM32F10x_StdPeriph_Driver V3.5.0",
    clock: "8MHz HSE 外部晶振 -> 9倍频至 72MHz",
    led_pin: "PC13 (通用推挽输出，低电平点亮)",
    swd_pins: "PA13(SWDIO) / PA14(SWCLK) - 硬件保护禁止复用"
  },

  // 课程体系分类
  categories: [
    {
      id: "cat_advanced",
      name: "🔥 系统进阶与安全外设（当前正在学）",
      desc: "第12~15章：深入单片机骨髓的电源控制、看门狗、Flash与加密防盗",
      status: "unlocked",
      chapters: ["ch12-3", "ch13-1", "ch13-2", "ch14-1", "ch14-2", "ch15-1", "ch15-2", "ch50"]
    },
    {
      id: "cat_basics",
      name: "📚 基础外设与通信总线（之前学过·随时回溯）",
      desc: "第3~11章：从点灯到 SPI 高速总线，带完整实机接线与示波器时序",
      status: "review",
      chapters: ["ch03", "ch04", "ch05", "ch06", "ch07", "ch08", "ch09", "ch10", "ch11"]
    }
  ],

  // 章节详细数据库
  chapters: [
    // ==========================================
    // 1. P43 [12-3] 读写备份寄存器 & 实时时钟
    // ==========================================
    {
      id: "ch12-3",
      num: "P43 [12-3]",
      catId: "cat_advanced",
      title: "读写备份寄存器 & 实时时钟",
      badge: "当前学习基石",
      stars: "★★★★★",
      whiteboard: {
        metaphor: "【大学宿舍拉闸断电与瑞士手表】整栋宿舍楼断电了（主供电 VDD 掉电），但桌上的机械表因为自带一颗纽扣电池（VBAT），指针依然准准地走。第二天插电开机，单片机看一眼表盘，时间一秒不差！压在表盘底下的备忘小纸条（BKP 备份寄存器）记载的密码也安然无恙。",
        whyWeNeed: "智能电表、打卡机、手环关机时时间不能归零，更不能重启就变回出厂时间。RTC 和 BKP 是单片机专用的掉电时间与数据安全黑匣子！",
        soulQuestion: "Q：为什么重启单片机绝对不能无脑调用 RTC_SetCounter()？\nA：因为一调用就把正在跑的时间重置回初值了！聪明的做法是在 BKP_DR1 写入暗号 0xA5A5。开机先读暗号：暗号在说明已在走时，直接读；不在才说明是历史上第一次开机，才初始化时间！"
      },
      summary: "运用 BKP 在 VDD 掉电后依靠纽扣电池维持数据的特性，配合 RTC 内部 32 位秒计数器与 Unix 时间戳，构建稳定不复位的时间日历系统。",
      hardware: {
        domain: "备份域供电 (VDD 掉电由 VBAT 纽扣电池维持，1.8V ~ 3.6V)",
        key_parts: [
          "BKP 备份数据寄存器：中容量 C8T6 含 10 个 16 位寄存器 (BKP_DR1 ~ DR10)，复位不丢失；连有 TAMPER 引脚（侵入检测，外壳被撬硬件自动瞬间清零）。",
          "RTC 核心单元：分频器 (RTC_PRL) + 32 位递增计数器 (RTC_CNT) + 闹钟寄存器 (RTC_ALR)。",
          "时钟源三选一：LSE (32.768kHz 外部晶振，首选且掉电可用)、LSI (40kHz 内部低速)、HSE/128 (外部高速分频，掉电不可用)。"
        ]
      },
      internalDiagram: "时钟链路: 32.768kHz LSE -> RTC 预分频器 (PRL=32767) -> 产生 1Hz (1秒) 秒脉冲 TR_CLK -> 驱动 32 位 RTC_CNT 递增 -> 转换为年月日时分秒。",
      wiring: [
        { pin: "VBAT", mcu: "VBAT 引脚 (Pin 1)", dir: "供电输入", desc: "接 3.0V CR2032 纽扣电池正极 (负极接 GND)" },
        { pin: "OSC32_IN / OUT", mcu: "PC14 / PC15", dir: "时钟输入", desc: "外接 32.768kHz 圆柱晶振与两颗 10pF 匹配电容" },
        { pin: "TAMPER", mcu: "PC13 (复用)", dir: "数字输入", desc: "侵入检测引脚 (检测到电平变化自动清空 BKP，可选)" }
      ],
      configSteps: [
        "第 1 步：开启 PWR 和 BKP 时钟 -> RCC_APB1PeriphClockCmd(RCC_APB1Periph_PWR | RCC_APB1Periph_BKP, ENABLE)",
        "第 2 步：解除备份域写保护锁 -> PWR_BackupAccessCmd(ENABLE)",
        "第 3 步：判断 BKP_DR1 暗号 -> 若未配置则启动 LSE 并等待就绪 -> RCC_LSEConfig(RCC_LSE_ON)",
        "第 4 步：选定 LSE 为 RTC 时钟源并使能 -> RCC_RTCCLKConfig(RCC_RTCCLKSource_LSE); RCC_RTCCLKCmd(ENABLE)",
        "第 5 步：等待时钟同步与写操作完成 -> RTC_WaitForSynchro(); RTC_WaitForLastTask()",
        "第 6 步：配预分频 32767 (1Hz) 并写入初始时间戳 -> RTC_SetPrescaler(32767); RTC_SetCounter(timestamp)",
        "第 7 步：在 BKP_DR1 写入暗号 0xA5A5 -> BKP_WriteBackupRegister(BKP_DR1, 0xA5A5)"
      ],
      registers: [
        { name: "RTC_CRH / CRL", desc: "控制寄存器。RTOFF (写操作完成标志位，为1才能写)、CNF (进入配置模式位)、RSF (寄存器同步标志位)。" },
        { name: "RTC_PRLH / PRLL", desc: "预分频重装载寄存器。写入 32767，实现 32768 分频。" },
        { name: "RTC_CNTH / CNTL", desc: "32 位秒计数器。当前计数值就是自 1970 年以来的 Unix 时间戳秒数！" },
        { name: "BKP_DR1 ~ DR10", desc: "10 个 16 位备份数据寄存器，用于保存掉电不丢失的密码或配置参数。" }
      ],
      scope: {
        title: "RTC 32.768kHz 晶振波形与 1Hz 秒脉冲示波器波形",
        timeBase: "CH1: 10.0 us/div | CH2: 200 ms/div",
        voltsDiv: "CH1: 1.00 V/div | CH2: 1.00 V/div",
        trigger: "CH1 边缘触发 (上升沿 1.50V)",
        signals: [
          { name: "CH1: LSE 晶振 (PC14) 32.768kHz 正弦波", color: "#facc15", type: "sine" },
          { name: "CH2: RTC 秒中断脉冲 (1Hz TR_CLK)", color: "#00f0ff", type: "pulse_1hz" }
        ],
        notes: "CH1 呈现极其精准的 32.768kHz 微弱正弦波振荡（周期约 30.5us）；CH2 经过内部 32768 分频后，每整整 1 秒产生一次宽 1 毫秒的脉冲中断！"
      },
      codeSnippet: `/**
 * @file    bsp_rtc.c
 * @brief   STM32F103C8T6 RTC 实时时钟与 BKP 备份寄存器完整驱动
 * @note    时钟源: 外部 32.768kHz LSE 晶振 | 掉电由 VBAT 纽扣电池供电
 */
#include "stm32f10x.h"
#include <time.h>

/**
 * @brief  初始化 RTC 实时时钟 (防重复配置与暗号校验)
 */
void MyRTC_Init(void) {
    // 1. 开启电源管理 (PWR) 与备份域 (BKP) 外设时钟
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_PWR | RCC_APB1Periph_BKP, ENABLE);
    
    // 2. 解除备份域写保护锁 (必须先解锁才能读写 BKP 与 RTC 寄存器)
    PWR_BackupAccessCmd(ENABLE);                               // [★本章核心学习重点] 解锁备份域访问权限

    // 3. 检查备份寄存器 BKP_DR1 中的自拟暗号 (0xA5A5)
    if (BKP_ReadBackupRegister(BKP_DR1) != 0xA5A5) {           // [★本章核心学习重点] 校验开机暗号
        // === 历史上首次上电，执行完整的初次走时初始化 ===
        
        // 4. 启动外部低速 32.768kHz 晶振 (LSE)
        RCC_LSEConfig(RCC_LSE_ON);                             // [★本章核心学习重点] 开启 32.768kHz LSE
        while (RCC_GetFlagStatus(RCC_FLAG_LSERDY) == RESET);   // 等待 LSE 晶振振荡稳定就绪
        
        // 5. 选定 LSE 为 RTC 专用时钟源，并使能 RTC 外设
        RCC_RTCCLKConfig(RCC_RTCCLKSource_LSE);                // [★本章核心学习重点] 选择 LSE 作为 RTC 时钟
        RCC_RTCCLKCmd(ENABLE);                                 // [★本章核心学习重点] 开启 RTC 时钟总闸门
        
        // 6. 等待 RTC 寄存器与 APB1 总线完成时钟同步
        RTC_WaitForSynchro();                                  // [★本章核心学习重点] 等待 RSF 标志位置 1 同步
        RTC_WaitForLastTask();                                 // 等待上一次底层写操作完成
        
        // 7. 配置预分频器：32768Hz / (32767 + 1) = 1Hz (精准 1 秒递增 1 次)
        RTC_SetPrescaler(32767);                               // [★本章核心学习重点] 设置 32768 分频产生 1Hz 秒脉冲
        RTC_WaitForLastTask();
        
        // 8. 写入初始时间戳 (Unix Timestamp 秒数计数器)
        RTC_SetCounter(1790088000);                            // [★本章核心学习重点] 写入 32 位初始秒计数初值
        RTC_WaitForLastTask();
        
        // 9. 在 BKP_DR1 写入暗号，标记系统已完成初始化！
        BKP_WriteBackupRegister(BKP_DR1, 0xA5A5);              // [★本章核心学习重点] 写入 0xA5A5 防重复初始化暗号
    } else {
        // === 非首次开机（软复位或断电但有纽扣电池维持走时）===
        // 此时绝不能调用 RTC_SetCounter()，仅需同步即可保持秒数连续递增！
        RTC_WaitForSynchro();                                  // 仅同步 APB1 时钟
        RTC_WaitForLastTask();
    }
}

/**
 * @brief  获取当前 RTC 计数值 (Unix 时间戳秒数)
 */
uint32_t MyRTC_GetCounter(void) {
    return RTC_GetCounter();                                   // [★本章核心学习重点] 读取当前 32 位 RTC 计数值
}`,
      pitfalls: [
        "写完任何 RTC 寄存器后，必须跟 RTC_WaitForLastTask()，否则 CPU 跑太快会导致下一次写操作被硬件直接吃掉！",
        "LSE 晶振外壳必须良好接地，走线严禁靠近高速信号线（如 PWM、SPI），否则容易被干扰导致走时不准或偷停。",
        "如果板载没有纽扣电池，VDD 一断电，BKP 数据和 RTC 就会重置，这是正常的硬件物理规律。"
      ]
    },

    // ==========================================
    // 2. P44 [13-1] PWR 电源控制与低功耗理论
    // ==========================================
    {
      id: "ch13-1",
      num: "P44 [13-1]",
      catId: "cat_advanced",
      title: "PWR 电源控制与三种低功耗模式原理",
      badge: "节能核心理论",
      stars: "★★★★★",
      whiteboard: {
        metaphor: "【大学生的上课作息大比喻】\n• 运行模式 (Run)：考场上全力答高数卷子，双手与大脑狂飙（72MHz，功耗约 30mA）。\n• 睡眠模式 (Sleep)：在无聊通识课上闭目养神，大脑休息（CPU停），但耳朵还听着点名（外设开着），老师一喊名字立马醒来答到（中断唤醒，节省 65% 电流）。\n• 停止模式 (Stop)：回宿舍深睡，全身时钟冻结，但记忆还在（SRAM通电保留），室友猛拍床沿（EXTI外部中断引脚）瞬间弹起，功耗直接骤降至微安级（约 20µA）！\n• 待机模式 (Standby)：彻底昏迷假死，1.8V 核心全断电，SRAM数据全部蒸发，叫醒后相当于重新复位冷启动（极限 2µA）！",
        whyWeNeed: "无线温度传感器、手环必须靠小电池跑几个月甚至几年。做好低功耗，是物联网嵌入式开发者的看家本领！",
        soulQuestion: "Q：停止模式和待机模式最本质的区别是什么？\nA：SRAM（内存）断不断电！停止模式只是冻结时钟，内存变量都在，唤醒后继续执行下一行代码；待机模式把内核电源都掐了，内存全部失忆，唤醒后从 main() 第一行重新开机！"
      },
      summary: "深入剖析 STM32 四级供电体系（VDD、VDDA、1.8V域、VBAT）、PVD 掉电可编程电压监控，以及三种低功耗模式的硬件通断电状态与唤醒机制。",
      hardware: {
        domain: "四级供电分区与低压降稳压器 (LDO)",
        key_parts: [
          "VDD 供电域 (2.0V ~ 3.6V)：为大部分 GPIO 引脚、待机电路、复位发生器供电。",
          "VDDA 模拟供电域：专为 ADC 和复位模块供电，建议串入磁珠滤波以保证采样纯净。",
          "1.8V 内核供电域：由内部 LDO 降压产生，供给 Cortex-M3 内核、SRAM 与数字外设。停止模式下 LDO 低功耗运行，待机模式下 LDO 完全切断！",
          "PVD 电压监测器：单片机随身电量报警哨，当 VDD 跌破 2.8V 等预设值时，触发 EXTI16 产生紧急中断抢救数据。"
        ]
      },
      internalDiagram: "供电拓扑: 外部 3.3V VDD -> 内部 LDO 稳压器 -> 产生 1.8V (供 CPU + SRAM)；停止模式时时钟门控切断 HSI/HSE/PLL；待机模式时 LDO 直接关闭。",
      wiring: [
        { pin: "VDD / VSS", mcu: "主电源引脚", dir: "供电输入", desc: "接 3.3V 与 GND，每个 VDD 引脚旁必须并联 100nF (0.1uF) 去耦电容" },
        { pin: "VDDA / VSSA", mcu: "模拟电源引脚", dir: "模拟供电", desc: "接 3.3V 经磁珠或 10uH 电感滤波输入，确保 ADC 精度" },
        { pin: "NRST", mcu: "复位引脚", dir: "复位输入", desc: "外接 10k 上拉电阻到 3.3V，并接 100nF 电容到地实现上电复位" }
      ],
      configSteps: [
        "第 1 步：开启 PWR 外设时钟 -> RCC_APB1PeriphClockCmd(RCC_APB1Periph_PWR, ENABLE)",
        "第 2 步：若需 PVD 监控，配置检测阈值 (如 2.8V) -> PWR_PVDLevelConfig(PWR_PVDLevel_2V8)",
        "第 3 步：开启 PVD 使能并配置 EXTI Line16 中断服务",
        "第 4 步：睡眠模式调用汇编指令 __WFI() 即可进入；停止模式调用 PWR_EnterSTOPMode()；待机模式调用 PWR_EnterSTANDBYMode()"
      ],
      registers: [
        { name: "PWR_CR (控制寄存器)", desc: "DBP (备份域访问位)、PLS (PVD 电平选择)、PVDE (PVD 使能)、PDDS (掉电深度选择: 0为停止, 1为待机)、LPDS (低功耗深睡稳压器控制)。" },
        { name: "PWR_CSR (控制/状态寄存器)", desc: "WUF (唤醒标志位)、SBF (待机标志位)、PVDO (PVD 输出标志: 当前电压是否低于阈值)、EWUP (使能 PA0/WKUP 唤醒引脚)。" }
      ],
      scope: {
        title: "系统模式切换下的工作电流阶跃变化示波器波形",
        timeBase: "500 ms/div",
        voltsDiv: "CH1: 10.0 mA/div (电流探头采样转换)",
        trigger: "CH1 下降沿触发 (15.0 mA)",
        signals: [
          { name: "CH1: 单片机总功耗电流阶跃跌落 (Run -> Sleep -> Stop)", color: "#facc15", type: "current_step" }
        ],
        notes: "运行模式下电流约为 32mA；进入 Sleep 后电流降至 11mA；进入 Stop 停止模式后电流直线俯冲至仅 24µA（示波器基线近乎贴地）！"
      },
      codeSnippet: `/**
 * @file    bsp_pvd.c
 * @brief   STM32F103 可编程电压监控 (PVD) 掉电紧急检测与抢救处理
 * @note    当 VDD 电压跌破设定阈值时触发中断，抢在系统失电前保存核心参数
 */
#include "stm32f10x.h"

/**
 * @brief  配置 PVD 掉电可编程电压监控
 * @param  None
 */
void PVD_Emergency_Config(void) {
    NVIC_InitTypeDef NVIC_InitStructure;
    EXTI_InitTypeDef EXTI_InitStructure;

    // 1. 开启电源管理外设 (PWR) 时钟
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_PWR, ENABLE);

    // 2. 设定 PVD 门限电压 (例如 2.8V，VDD 跌破 2.8V 产生中断报警)
    PWR_PVDLevelConfig(PWR_PVDLevel_2V8);                      // [★本章核心学习重点] 设定 PVD 监控阈值为 2.8V
    
    // 3. 使能 PVD 电压监测总开关
    PWR_PVDCmd(ENABLE);                                        // [★本章核心学习重点] 开启 PVD 电压监控电路

    // 4. 配置 PVD 关联的 EXTI 中断线 16
    EXTI_InitStructure.EXTI_Line = EXTI_Line16;                // [★本章核心学习重点] EXTI Line 16 专用于 PVD 监控
    EXTI_InitStructure.EXTI_Mode = EXTI_Mode_Interrupt;
    EXTI_InitStructure.EXTI_Trigger = EXTI_Trigger_Rising;     // 电压越界产生上升沿脉冲
    EXTI_InitStructure.EXTI_LineCmd = ENABLE;
    EXTI_Init(&EXTI_InitStructure);

    // 5. 配置 NVIC 中断向量优先级
    NVIC_InitStructure.NVIC_IRQChannel = PVD_IRQn;             // [★本章核心学习重点] 配置 PVD 专有中断通道
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 0;  // 设为最高抢占优先级！
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 0;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);
}

/**
 * @brief  PVD 掉电紧急抢救中断服务函数
 */
void PVD_IRQHandler(void) {
    if (EXTI_GetITStatus(EXTI_Line16) != RESET) {
        // [★本章核心学习重点] 系统检测到主供电跌落，仅剩最后几毫秒电容余电！
        // 立即执行最核心参数写入 BKP 或 Flash，关闭所有电机、高功耗外设
        
        EXTI_ClearITPendingBit(EXTI_Line16);                   // 清除中断标志位
    }
}`,
      pitfalls: [
        "睡眠模式下外设（如定时器、ADC）若还在跑，电流依然在 10mA 以上，要想真正省电必须进停止模式！",
        "在待机模式下由于芯片接近断电，ST-Link 会连不上芯片，这是正常休眠现象不是板子烧坏！按住复位键再点击烧录即可。"
      ]
    },

    // ==========================================
    // 3. P45 [13-2] 修改主频 & 睡眠/停止/待机模式实战
    // ==========================================
    {
      id: "ch13-2",
      num: "P45 [13-2]",
      catId: "cat_advanced",
      title: "修改主频 & 睡眠/停止/待机模式实战",
      badge: "低功耗实战真功夫",
      stars: "★★★★★",
      whiteboard: {
        metaphor: "【从昏睡中被泼冷水唤醒的后遗症】当你把单片机送进 Stop 停止模式（时钟全冻结，电流跌破 24 微安），外部按键把你叫醒那一刻，芯片默认是懵逼的——它不敢贸然启动娇贵的外置 72MHz 晶振，而是先拿内部 8MHz 粗糙慢时钟 (HSI) 凑合跑！如果你不手动泼冷水让它执行 SystemInit() 恢复 72MHz 倍频，后面的串口打印、OLED 刷新全都会变慢 9 倍！",
        whyWeNeed: "实机掌握进入睡眠、停止、待机的完整标准库代码与唤醒处理，彻底解决低功耗唤醒后外设速度错乱的世纪难题！",
        soulQuestion: "Q：怎么最直观地证明芯片真的休眠了？\nA：在进入低功耗函数前，把板载 PC13 LED 灭掉（一个灯吃 3~5mA）。接上 USB 电流表，亲眼看着读数从 0.032A 跌到 0.000A！"
      },
      summary: "实操演示修改系统主频、WFI 指令睡眠、按键外部中断唤醒停止模式（及其关键的时钟恢复流程），以及 PA0 引脚唤醒待机模式的完整标准库规范工程。",
      hardware: {
        domain: "时钟树唤醒恢复与外部按键触发电路",
        key_parts: [
          "睡眠指令：__WFI() (Wait For Interrupt)，CPU 停止取指令，任意中断来临立刻执行下一行。",
          "停止模式入口：PWR_EnterSTOPMode(PWR_Regulator_ON, PWR_STOPEntry_WFI)。",
          "★ 致命核心：停止模式唤醒后，时钟自动切回 8MHz HSI，必须立刻手动调用 SystemInit()！",
          "待机模式唤醒：使能 PWR_WakeUpPinCmd(ENABLE) 后，PA0 引脚产生上升沿硬件复位唤醒。"
        ]
      },
      internalDiagram: "停止模式进出流程: 正常 72MHz -> 关闭指示灯 -> PWR_EnterSTOPMode -> 时钟冻结休眠 -> 外部引脚 EXTI 脉冲 -> 唤醒 (此时为 8MHz HSI) -> 执行 SystemInit() -> 恢复 72MHz HSE 倍频。",
      wiring: [
        { pin: "PA0 (WKUP)", mcu: "PA0", dir: "数字输入", desc: "唤醒按键 (接按键到 3.3V，按下产生高电平上升沿唤醒待机模式)" },
        { pin: "PB1 / PB14", mcu: "PB1", dir: "外部中断", desc: "普通外部中断唤醒引脚 (接轻触按键到 GND，低电平触发 EXTI 唤醒停止模式)" },
        { pin: "PC13", mcu: "PC13", dir: "推挽输出", desc: "状态指示 LED (休眠前拉高灭灯，唤醒后拉低亮灯)" }
      ],
      configSteps: [
        "第 1 步：配置外部唤醒按键引脚 GPIO 与 EXTI 中断",
        "第 2 步：进入睡眠前灭灯熄灭所有高功耗外设 -> GPIO_SetBits(GPIOC, GPIO_Pin_13)",
        "第 3 步：调用 PWR_EnterSTOPMode(PWR_Regulator_ON, PWR_STOPEntry_WFI) 入定休眠",
        "第 4 步：【唤醒关键】醒来后立即执行 SystemInit() 恢复 72MHz 系统主时钟！",
        "第 5 步：点亮 PC13 LED，恢复正常业务逻辑运行"
      ],
      registers: [
        { name: "RCC_CFGR (时钟配置寄存器)", desc: "SWS[1:0] 时钟切换状态位。唤醒时该位自动变为 00 (表明当前运行在 HSI 8MHz)。" },
        { name: "SCB_SCR (系统控制寄存器)", desc: "SLEEPDEEP (深度睡眠位)、SLEEPONEXIT (退出中断时是否立刻再次休眠)。" }
      ],
      scope: {
        title: "停止模式唤醒前后系统时钟 (MCO 引脚) 波形拉长对比示波器",
        timeBase: "20.0 ns/div",
        voltsDiv: "CH1: 1.00 V/div",
        trigger: "CH1 上升沿触发 (1.65V)",
        signals: [
          { name: "CH1: 正常 72MHz HSE 方波 (周期 T = 13.8ns，密集高速)", color: "#00ff88", type: "clock_72m" },
          { name: "CH2: 唤醒未恢复时的 8MHz HSI 方波 (周期 T = 125ns，拉长 9 倍！)", color: "#ef4444", type: "clock_8m" }
        ],
        notes: "真实示波器直击痛点：正常 72MHz 方波周期仅 13.8 纳秒；唤醒后退化为 8MHz，波形周期被活生生拉长到 125 纳秒！这就是为什么延时变慢、串口乱码的根本物理原因！"
      },
      codeSnippet: `/**
 * @file    bsp_pwr_modes.c
 * @brief   STM32F103 停止模式 (Stop) 与待机模式 (Standby) 标准库驱动
 * @note    停止模式保留 SRAM 变量；待机模式功耗最低 (2uA) 由 PA0 WKUP 唤醒
 */
#include "stm32f10x.h"

/**
 * @brief  安全进入停止模式 (Stop Mode) 并在唤醒后自动恢复 72MHz 高速时钟
 */
void Enter_Stop_Safe(void) {
    // 1. 开启电源管理外设时钟
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_PWR, ENABLE);
    
    // 2. 挂起滴答定时器，防止 SysTick 中断秒级意外唤醒休眠
    SysTick->CTRL &= ~SysTick_CTRL_ENABLE_Msk;
    
    // 3. 进入停止模式 (内部 LDO 设为低功耗模式，等待 WFI 外部按键中断唤醒)
    PWR_EnterSTOPMode(PWR_Regulator_LowPower, PWR_STOPEntry_WFI); // [★本章核心学习重点] 进入 STOP 停止模式 (微安级待机)

    // =======================================================
    // ⚠️ 重点避坑：唤醒瞬间单片机时钟默认降级为内部 8MHz HSI！
    // 必须在此处立即重新激活外部 8MHz 晶振并倍频至 72MHz！
    // =======================================================
    SystemInit();                                              // [★本章核心学习重点] 唤醒后必须重配 HSE+PLL 恢复 72MHz！
    
    // 4. 恢复 SysTick 滴答计时
    SysTick->CTRL |= SysTick_CTRL_ENABLE_Msk;
}

/**
 * @brief  配置并进入深度待机模式 (Standby Mode，功耗极低 2µA)
 */
void Enter_Standby_Mode(void) {
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_PWR, ENABLE);
    
    // 开启 PA0 引脚的 WKUP 上升沿硬件唤醒功能
    PWR_WakeUpPinCmd(ENABLE);                                  // [★本章核心学习重点] 使能 PA0(WKUP) 引脚待机唤醒
    
    // 进入待机模式 (内核 1.8V 电源完全断电，内存数据不保留，唤醒等同复位冷启动)
    PWR_EnterSTANDBYMode();                                    // [★本章核心学习重点] 一键进入极限 STANDBY 待机模式
}`,
      pitfalls: [
        "从 Stop 模式被唤醒后，如果没有写 SystemInit()，串口波特率会错乱、OLED 刷新变慢将近 9 倍！",
        "唤醒引脚 PA0(WKUP) 内部没有硬件下拉，外部按键电路必须按下时输入高电平（上升沿唤醒）。"
      ]
    },

    // ==========================================
    // 4. P46 [14-1] WDG 看门狗硬件原理
    // ==========================================
    {
      id: "ch14-1",
      num: "P46 [14-1]",
      catId: "cat_advanced",
      title: "WDG 看门狗硬件原理",
      badge: "系统守护神理论",
      stars: "★★★★★",
      whiteboard: {
        metaphor: "【看门大狼狗与挑食猫咪】\n• 独立看门狗 (IWDG)：就像一条看家大狼狗。你的主程序是饲养员，必须每隔一段时间（如 1 秒）给它扔肉骨头（喂狗）。按时喂它就安静；一旦程序死循环卡死没按时喂，大狼狗立刻暴怒按下一键复位键，强制重启救活单片机！\n• 窗口看门狗 (WWDG)：就像一只挑剔傲娇的猫咪。它不仅有超时死线，还有一个【最早喂食窗口】。喂晚了它咬你（复位），如果你的程序逻辑错乱在循环里疯狂高频喂狗（喂太早），它也咬你（复位）！必须在指定窗口时间段喂它才行。",
        whyWeNeed: "在工业电磁干扰强烈的环境下，强电火花可能会把程序计数器 (PC) 打飞进入死循环。看门狗是单片机永不死机的硬件级底层兜底！",
        soulQuestion: "Q：为什么 STM32 要专门做两个不同的看门狗？\nA：IWDG 用的是芯片内部独立的低速 RC 时钟 (LSI 40kHz)，哪怕外部主晶振被震碎了依然能准时复位救活系统；而 WWDG 挂在主时钟线上，专门精确检测程序运行逻辑与时序是否错乱！"
      },
      summary: "系统掌握单片机抗干扰死机自救机理。深度对比 IWDG（独立时钟、12位计数器）与 WWDG（窗口机制、7位计数器、提前唤醒中断 EWI）的硬件结构与选型场景。",
      hardware: {
        domain: "IWDG (LSI 40kHz) vs WWDG (APB1 PCLK1分频)",
        key_parts: [
          "IWDG 独立看门狗：12 位递减计数器（0xFFF 到 0），时钟来自内部低速 LSI（约 40kHz），不受主晶振崩溃影响。",
          "IWDG 密匙寄存器 (KR)：写 0x5555（开锁允许改分频与重载值）、写 0xAAAA（喂狗，重载计数器）、写 0xCCCC（启动看门狗，一旦开启软件无法关闭！）。",
          "WWDG 计数范围：7 位递减计数器（0x40 ~ 0x7F）。最高位 T6 是使能位，从 0x40 减到 0x3F 时 T6 变 0 瞬间触发复位！",
          "WWDG 提前唤醒中断 (EWI)：当计数器减到正好 0x40 时触发中断，在复位发生前最后几十微秒完成紧急重要数据保存。"
        ]
      },
      internalDiagram: "看门狗拓扑: IWDG = 内部 LSI (40kHz) -> 8 位预分频器 -> 12位递减计数器 -> 减到 0x000 触发系统复位；WWDG = APB1 时钟 -> /4096分频 -> 7位递减计数器 -> 与窗口值比较。",
      wiring: [
        { pin: "无外设引脚", mcu: "内部全集成", dir: "内部时钟", desc: "看门狗全部在芯片内部运行，无需占用任何外部引脚" }
      ],
      configSteps: [
        "IWDG 口诀：1.写 0x5555 开锁 -> 2.设预分频 PR -> 3.设重装载 RLR -> 4.写 0xAAAA 先喂一次 -> 5.写 0xCCCC 启动守护",
        "WWDG 口诀：1.开 APB1 时钟 -> 2.设预分频 WDGTB -> 3.设窗口值 W -> 4.使能并装载计数器 T -> 5.在窗口内循环喂狗"
      ],
      registers: [
        { name: "IWDG_KR (键值寄存器)", desc: "写入 0x5555、0xAAAA、0xCCCC 触发硬件动作。" },
        { name: "IWDG_PR & IWDG_RLR", desc: "预分频寄存器与重装载寄存器，决定看门狗超时时间。" },
        { name: "WWDG_CR (控制寄存器)", desc: "WDGA (激活位)、T[6:0] (7 位递减计数器，有效值 0x40~0x7F)。" },
        { name: "WWDG_CFR (配置寄存器)", desc: "EWI (提前唤醒中断使能)、WDGTB (时基分频)、W[6:0] (7 位窗口上限值)。" }
      ],
      scope: {
        title: "WWDG 窗口看门狗计数器递减与喂狗窗口时序图",
        timeBase: "10.0 ms/div",
        voltsDiv: "CH1: 1.00 V/div (模拟计数值转换)",
        trigger: "CH1 边沿触发",
        signals: [
          { name: "CH1: 7位计数器 T 线性递减斜坡 (0x7F -> 0x5F -> 0x40)", color: "#00f0ff", type: "wwdg_ramp" },
          { name: "CH2: 窗口上限 W (0x5F 警戒红线)", color: "#facc15", type: "wwdg_window" }
        ],
        notes: "从 0x7F 减到 0x5F 为太早禁喂区；从 0x5F 减到 0x40 为绿色安全喂狗黄金窗口；跌破 0x40 立即触发硬件复位！"
      },
      codeSnippet: `/**
 * @file    bsp_iwdg.c
 * @brief   STM32 独立看门狗 (IWDG) 硬件寄存器时钟与初始化
 * @note    独立时钟源: 内部专用 LSI ~40kHz (即使主晶振损坏也能准时复位)
 */
#include "stm32f10x.h"

/**
 * @brief  初始化独立看门狗 (超时时间设定为 1000ms)
 */
void IWDG_Init_Config(void) {
    // 1. 写入 0x5555 关键字，解除对 PR 分频器和 RLR 重装载寄存器的写保护
    IWDG_WriteAccessCmd(IWDG_WriteAccess_Enable);              // [★本章核心学习重点] 解锁 IWDG_PR 与 IWDG_RLR 写保护锁
    
    // 2. 配置时钟预分频为 64 分频 (40kHz / 64 = 625Hz，即计数器每 1.6ms 减 1)
    IWDG_SetPrescaler(IWDG_Prescaler_64);                      // [★本章核心学习重点] 配置预分频器为 64 分频
    
    // 3. 配置重装载计数值为 625 (超时时间 = 625 * 1.6ms = 1000ms = 1.0秒)
    IWDG_SetReload(625);                                       // [★本章核心学习重点] 设定重装载初值 625 (1秒超时)
    
    // 4. 首次装载计数值（写入 0xAAAA 执行喂狗，重载为 625）
    IWDG_ReloadCounter();                                      // [★本章核心学习重点] 写入 0xAAAA 喂狗并载入重载值
    
    // 5. 启动看门狗计时（写入 0xCCCC 启动硬件，启动后无法通过软件关闭！）
    IWDG_Enable();                                             // [★本章核心学习重点] 启动看门狗硬件 (硬件锁死不可逆)
}

/**
 * @brief  主循环中周期性调用的喂狗函数
 */
void IWDG_Feed(void) {
    IWDG_ReloadCounter();                                      // [★本章核心学习重点] 周期性给看门狗喂骨头，重置 1000ms 倒计时
}`,
      pitfalls: [
        "IWDG 一旦启动，软件没有任何命令能把它关闭！只有系统发生硬件复位才能停止。",
        "内部 LSI 振荡器精度较低（在 30kHz ~ 60kHz 波动），算超时时间千万留足 30% 以上余量！",
        "千万不能在定时器中断里盲目喂狗！如果主程序死循环卡死了但中断还在跑，看门狗就完全失去了检测死机的作用。"
      ]
    },

    // ==========================================
    // 5. P47 [14-2] 独立看门狗 & 窗口看门狗实战
    // ==========================================
    {
      id: "ch14-2",
      num: "P47 [14-2]",
      catId: "cat_advanced",
      title: "独立看门狗 & 窗口看门狗实战",
      badge: "防死机防跑飞演练",
      stars: "★★★★★",
      whiteboard: {
        metaphor: "【制造一次死机，看芯片如何死而复生】在主循环里故意写一个阻塞死循环 while(1);，OLED 屏上的数字戛然而止，1 秒后 PC13 LED 突然一闪，系统瞬间重启恢复正常！这就是看门狗雷霆出击的威慑力。",
        whyWeNeed: "掌握超时时间公式推导与毫秒级喂狗时序规划，学会给多任务系统配置多重标志位喂狗机制。",
        soulQuestion: "Q：IWDG 超时时间怎么算？\nA：记住这句顺口溜：时钟 40K，分频除以 64，一秒计六百二十五！即：40000 / 64 = 625Hz，每计 1 个数是 1.6ms。想要 1 秒超时，RLR 填 625；想要 2 秒超时，RLR 填 1250！"
      },
      summary: "运用标准库实现 IWDG 与 WWDG 的配置，推导计算预分频与重装载数值，并通过人为构造死循环验证看门狗复位动作。",
      hardware: {
        domain: "超时时间推导计算公式",
        key_parts: [
          "IWDG 公式：Tout = (4 * 2^PR * RLR) / 40 (单位毫秒)。",
          "WWDG 窗口时间：T_window = (1 / PCLK1) * 4096 * 2^WDGTB * (T - W)。",
          "WWDG 超时时间：T_timeout = (1 / PCLK1) * 4096 * 2^WDGTB * (T - 0x3F)。"
        ]
      },
      internalDiagram: "实机测试流程: 初始化 GPIO -> 初始化 OLED/LED -> 配置 IWDG (1000ms) -> 主循环按时喂狗 -> 人为按下按键卡入 while(1) 阻塞 -> 超时 1000ms -> IWDG 触发硬件复位开机。",
      wiring: [
        { pin: "按键引脚 PB1", mcu: "PB1", dir: "数字输入", desc: "测试死机按键 (按下后执行 while(1) 阻塞不喂狗，观察芯片复位)" },
        { pin: "PC13 LED", mcu: "PC13", dir: "推挽输出", desc: "开机闪烁指示灯 (复位重启时闪烁 3 次，直观证明复位发生)" }
      ],
      configSteps: [
        "第 1 步：IWDG_WriteAccessCmd(IWDG_WriteAccess_Enable) 解锁写保护",
        "第 2 步：IWDG_SetPrescaler(IWDG_Prescaler_64) 设置 64 分频 (每计 1 个数耗时 1.6ms)",
        "第 3 步：IWDG_SetReload(625) 设置重载值 (625 * 1.6ms = 1000ms)",
        "第 4 步：IWDG_ReloadCounter() 首次喂狗刷入初值",
        "第 5 步：IWDG_Enable() 启动独立看门狗守护",
        "第 6 步：在 main() 主循环所有任务完成后，执行 IWDG_ReloadCounter()"
      ],
      registers: [
        { name: "RCC_CSR", desc: "IWDGRSTF (独立看门狗复位标志位)、WWDGRSTF (窗口看门狗复位标志位)。开机检测这几个位能知道上次是因为什么原因复位的！" }
      ],
      scope: {
        title: "IWDG 超时未喂狗导致 NRST 引脚产生复位低电平脉冲示波器",
        timeBase: "200 ms/div",
        voltsDiv: "CH1: 1.00 V/div",
        trigger: "CH1 下降沿触发 (1.50V)",
        signals: [
          { name: "CH1: 单片机 NRST 复位引脚电平", color: "#facc15", type: "nrst_pulse" }
        ],
        notes: "单片机正常运行时 NRST 为 3.3V 高电平；当 1000ms 倒计时结束未喂狗，硬件内部看门狗瞬间将 NRST 拉低约 20 微秒，强制芯片冷复位！"
      },
      codeSnippet: `/**
 * @file    bsp_wwdg.c
 * @brief   STM32 窗口看门狗 (WWDG) 规范驱动与时间窗口喂狗
 * @note    由 APB1 总线时钟分频，严格限制喂狗区间：太早喂狗或太晚喂狗均会立刻复位！
 */
#include "stm32f10x.h"

/**
 * @brief  初始化窗口看门狗 (WWDG)
 * @note   PCLK1 = 36MHz, 预分频 8, 计数器时钟 = 36MHz / 4096 / 8 = 1098.6Hz (每计数约 0.91ms)
 */
void WWDG_Config(void) {
    // 1. 开启 WWDG 外设时钟 (位于 APB1 低速总线)
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_WWDG, ENABLE);

    // 2. 配置时钟预分频 (WDGTB = 8 分频)
    WWDG_SetPrescaler(WWDG_Prescaler_8);                       // [★本章核心学习重点] 配置 WWDG 8 分频

    // 3. 设置上限时间窗口值 (例如 0x5F，当计数器高于此值时喂狗会直接引发硬件复位！)
    WWDG_SetWindowValue(0x5F);                                 // [★本章核心学习重点] 设定喂狗上限窗口值 Window = 0x5F

    // 4. 使能 WWDG 并装入 7 位计数值 0x7F (下限阈值固化在 0x40，跌破 0x40 产生复位)
    WWDG_Enable(0x7F);                                         // [★本章核心学习重点] 使能 WWDG 并将计数器置为初值 0x7F
}

/**
 * @brief  合规的窗口喂狗函数
 * @note   必须在 0x40 < 计数器 < 0x5F 的安全绿窗时间内执行！
 */
void WWDG_Safe_Feed(void) {
    // 读取当前 7 位递减计数器实时值
    uint8_t current_val = WWDG->CR & 0x7F;                     // [★本章核心学习重点] 实时检测当前 7 位计数值
    
    // 只有进入安全窗口区间才允许喂狗
    if (current_val < 0x5F && current_val > 0x40) {
        WWDG_SetCounter(0x7F);                                 // [★本章核心学习重点] 在合法窗口内将计数器重装回 0x7F
    }
}`,
      pitfalls: [
        "在 Keil 仿真打断点调试看门狗程序时，单步停顿超过 1 秒芯片会被看门狗强制复位退出调试！可在调试器设置里勾选'Freeze watchdog on halt'。",
        "WWDG 刚启动前，计数器还没减到窗口值以下，若立即第一行写喂狗会当场因过早喂狗而死循环复位！"
      ]
    },

    // ==========================================
    // 6. P48 [15-1] FLASH 闪存原理与结构解析
    // ==========================================
    {
      id: "ch15-1",
      num: "P48 [15-1]",
      catId: "cat_advanced",
      title: "FLASH 闪存原理与结构解析",
      badge: "非易失存储底层",
      stars: "★★★★★",
      whiteboard: {
        metaphor: "【写满墨水的宣纸与大白板擦】单片机内部的 Flash（闪存）不是普通的记事本。普通的 SRAM 内存就像铅笔写草稿，想改哪一个字就直接擦改；但 Flash 就像一张用特殊墨水写满的宣纸——它的物理规则是：【只能把 1 改成 0，但绝对不能凭空把 0 变成 1】！如果某一位已经是 0 了你想改成 1，对不起，不能单独改一个字，你必须拿起一把大号板擦，把整整一整页（1KB，1024个字节）全部擦成纯白底（所有位变回 1，即全为 0xFFFF），然后才能在上面下笔写新内容！这就叫【先擦后写】。",
        whyWeNeed: "单片机断电之后，代码为什么还能在？就是因为代码烧在 Flash 里。除了存代码，Flash 还有一部分空间可以留给我们自己用，把系统的校准参数、WiFi 密码、最高分记录存进去，掉电永不丢失，省下一颗昂贵的外挂 EEPROM 芯片！",
        soulQuestion: "Q：如果不擦除直接往 Flash 写入新数据会怎样？\nA：写入会出错或发生位逻辑与运算！比如原来是 0x1234，你想直接改写成 0x5678，由于只能把 1 变 0 不能把 0 变 1，最后存进去的会变成毫无规律的残缺乱码！"
      },
      summary: "掌握 STM32F103 的 64KB Flash 物理组织架构（页大小 1KB）、闪存控制器 (FPEC) 的开锁/上锁机制、先擦后写的物理法则，以及选项字节 (Option Bytes) 的防抄板保护。",
      hardware: {
        domain: "STM32F103C8T6 内部 Flash 空间规划",
        key_parts: [
          "主存储器 (Main Memory)：共 64KB (0x0800 0000 ~ 0x0800 FFFF)。属于中容量产品，分为 64 个页（Page 0 ~ Page 63），每页正好 1KB (1024 字节)。",
          "信息块 (Information Block)：内置 Bootloader（系统存储器，串口一键下载 ISP 所在）以及选项字节（Option Bytes，包含读保护 RDP，防止别人用编程器偷你的固件）。",
          "★ 物理擦写铁律：必须整页擦除（擦除后全为 0xFFFF），写入粒度为半字 (16位) 或字 (32位)。",
          "闪存开锁钥匙：写入/擦除前，必须往 FLASH_KEYR 顺序写入 KEY1 (0x45670123) 和 KEY2 (0xCDEF89AB)，操作完必须重新上锁！"
        ]
      },
      internalDiagram: "Flash 地址映射: 0x08000000(Page 0 中断向量表+main) -> Page 1~61 (用户固件代码) -> Page 62 (缓冲保留) -> Page 63 (0x0800FC00 用户掉电数据存储区)。",
      wiring: [
        { pin: "内部集成", mcu: "片上 Flash", dir: "片上总线", desc: "挂载在 ICode 和 DCode 总线上，CPU 以最高 2 个等待周期 (Wait States) 访问" }
      ],
      configSteps: [
        "第 1 步：FLASH_Unlock() 顺序写入 KEY1 和 KEY2 解除闪存写保护",
        "第 2 步：FLASH_ClearFlag(...) 清除上一次操作的各类错误标志位",
        "第 3 步：FLASH_ErasePage(0x0800FC00) 执行整页擦除，等待整页全变为 0xFFFF",
        "第 4 步：FLASH_ProgramHalfWord(addr, data) 写入 16 位半字数据",
        "第 5 步：FLASH_Lock() 重新关锁，防止程序跑飞误改写 Flash 固件"
      ],
      registers: [
        { name: "FLASH_ACR (访问控制寄存器)", desc: "LATENCY[2:0] 访问延时周期。在 72MHz 主频下必须配置为 2WS (2个等待周期)！" },
        { name: "FLASH_KEYR (密匙寄存器)", desc: "写入 KEY1 (0x45670123) 与 KEY2 (0xCDEF89AB) 解锁 FPEC 控制器。" },
        { name: "FLASH_CR (控制寄存器)", desc: "PG (编程使能)、PER (页擦除使能)、MER (全片擦除使能)、STRT (启动操作)、LOCK (上锁标志位)。" },
        { name: "FLASH_SR (状态寄存器)", desc: "BSY (忙标志位，正在擦写中)、EOP (操作结束标志位)、WRPRTERR (写保护错误)。" }
      ],
      scope: {
        title: "Flash 擦除与写入时内部电荷泵高压脉冲时序示意图",
        timeBase: "5.0 ms/div",
        voltsDiv: "CH1: 2.00 V/div (内部擦写高压等效)",
        trigger: "CH1 上升沿触发",
        signals: [
          { name: "CH1: Flash 内部高压电荷泵使能脉冲 (擦除耗时约 20~40ms)", color: "#ef4444", type: "flash_erase_pulse" },
          { name: "CH2: 状态寄存器 BSY (忙状态高电平)", color: "#facc15", type: "flash_bsy" }
        ],
        notes: "Flash 擦除需要数十毫秒的电荷释放时间，期间 BSY 位一直为 1，CPU 必须等待其完成，绝对不可断电！"
      },
      codeSnippet: `/**
 * @file    bsp_flash_erase.c
 * @brief   STM32F103 内部 Flash 物理页擦除与按半字 (16位) 编程底层操作
 * @note    物理特性：写入前必须整页擦除为 0xFFFF，只能将 1 改为 0！
 */
#include "stm32f10x.h"

#define FLASH_TEST_PAGE_ADDR  0x0800FC00  // 中容量 C8T6 最后一页 (Page 63)

/**
 * @brief  单页擦除与安全半字写入底层流程
 */
void Flash_EraseAndWrite_Demo(uint16_t data) {
    // 1. 解开 Flash 控制寄存器写保护锁 (写入 KEY1=0x45670123, KEY2=0xCDEF89AB)
    FLASH_Unlock();                                            // [★本章核心学习重点] 解锁 FPEC 闪存编程控制器

    // 2. 清除上一次操作遗留的状态标志位
    FLASH_ClearFlag(FLASH_FLAG_EOP | FLASH_FLAG_PGERR | FLASH_FLAG_WRPRTERR);

    // 3. 执行整页物理擦除 (该页 1024 字节数据全部复位为 0xFFFF)
    FLASH_Status status = FLASH_ErasePage(FLASH_TEST_PAGE_ADDR); // [★本章核心学习重点] 物理页整页擦除 (全填 0xFFFF)
    
    // 4. 若擦除成功，将数据以 16 位半字 (HalfWord) 形式烧写进指定地址
    if (status == FLASH_COMPLETE) {
        FLASH_ProgramHalfWord(FLASH_TEST_PAGE_ADDR, data);     // [★本章核心学习重点] 按 16 位半字原子烧写数据到 Flash
    }

    // 5. 重新上锁保护 Flash，防止程序指针跑飞导致代码固件被意外篡改！
    FLASH_Lock();                                              // [★本章核心学习重点] 立即加锁保护，防止意外擦写
}`,
      pitfalls: [
        "【致命大雷，必须刻在脑子里】擦除 Flash 只能擦空闲的最后一页（如第 63 页 0x0800FC00）！如果手抖擦了 0x08000000 起始的页面，你把自己正在运行的 main() 代码直接抹杀了，芯片瞬间变砖死机！",
        "【大白话避坑 2】Flash 有擦写寿命（STM32 内部 Flash 典型寿命约为 1 万次左右），绝对不能在 while(1) 循环里以几十毫秒的高频不停擦写，否则不出半天这块 Flash 扇区就被你磨损失灵了！",
        "【大白话避坑 3】Flash 写入只能按 16 位半字或 32 位字写入，不支持单独写一个 8 位 uint8_t 字节。"
      ]
    },

    // ==========================================
    // 7. P49 [15-2] 读写内部 FLASH & 读取芯片唯一 ID
    // ==========================================
    {
      id: "ch15-2",
      num: "P49 [15-2]",
      catId: "cat_advanced",
      title: "读写内部 FLASH & 读取芯片唯一 ID",
      badge: "防抄板与参数存储",
      stars: "★★★★★",
      whiteboard: {
        metaphor: "【芯片出厂时的激光刻印身份证】世界上没有两颗完全相同的 STM32 芯片。ST 意法半导体在工厂造出每颗芯片时，都在其内部的只读区用激光焊死了【96 位全球唯一的身份识别码 (UID)】。这就像每颗芯片唯一的 DNA 指纹。商业产品为了防止别人把代码从芯片里读走抄板去卖，就可以把这串 UID 算一个秘钥，开机时对暗号；暗号不对，立马自锁销毁！",
        whyWeNeed: "实战掌握内部 Flash 模拟 EEPROM 保存用户设置，学会用 C 语言指针直接定位读取芯片 96 位 UID 和 Flash 真实容量寄存器，写出具备商用安全级别的单片机固件。",
        soulQuestion: "Q：怎么找到 STM32F103C8T6 最后一页的起始地址？\nA：C8T6 是 64KB Flash。基地址是 0x08000000，每页 1024 字节 (0x400)。最后一页是第 63 页：0x08000000 + 63 * 1024 = 0x0800FC00！"
      },
      summary: "编写完整的 Flash 模拟 EEPROM 读写驱动模块，利用 C 语言内存指针直接读取基地址为 0x1FFFF7E8 的 96 位唯一 UID 电子签名与 0x1FFFF7E0 容量寄存器。",
      hardware: {
        domain: "芯片电子签名基地址与最后一页",
        key_parts: [
          "最后一页地址 (Page 63)：0x0800 FC00 ~ 0x0800 FFFF (共 1024 字节)。",
          "96 位 UID 基地址：0x1FFFF7E8 (4字节) / 0x1FFFF7EC (4字节) / 0x1FFFF7F0 (4字节)，出厂只读不可篡改。",
          "Flash 容量寄存器地址：0x1FFFF7E0 (16位半字，读出来的值就是容量 KB 数，比如 64 即代表 64KB)。"
        ]
      },
      internalDiagram: "内存指针直读架构: *(uint16_t*)(0x1FFFF7E0) 读取闪存容量；*(uint32_t*)(0x1FFFF7E8) 读取 96位 UID 第一段；通过 C 语言指针直接解引用，无需调用任何繁琐函数！",
      wiring: [
        { pin: "OLED 显示屏", mcu: "PB8(SCL) / PB9(SDA)", dir: "双线通信", desc: "用于在屏幕上直观显示读取出的 96位 UID 与 Flash 大小" }
      ],
      configSteps: [
        "第 1 步：FLASH_Unlock() 解锁闪存",
        "第 2 步：FLASH_ClearFlag(...) 清除标志位",
        "第 3 步：FLASH_ErasePage(0x0800FC00) 整页格式化",
        "第 4 步：FLASH_ProgramHalfWord(0x0800FC00, val) 写入数据",
        "第 5 步：FLASH_Lock() 上锁",
        "第 6 步：定义指针读取 0x1FFFF7E8 获取 96 位全球唯一 UID"
      ],
      registers: [
        { name: "UID 寄存器 (0x1FFFF7E8 ~ 0x1FFFF7F0)", desc: "三个 32 位寄存器，包含芯片的批次号、晶圆坐标与生产线标识。" },
        { name: "Flash 容量寄存器 (0x1FFFF7E0)", desc: "16 位只读寄存器，数值以 KB 为单位。" }
      ],
      scope: {
        title: "Flash 半字编程 (ProgramHalfWord) 过程中的总线活动波形",
        timeBase: "10.0 us/div",
        voltsDiv: "CH1: 1.00 V/div",
        trigger: "CH1 边沿触发",
        signals: [
          { name: "CH1: 闪存编程写入脉冲 (单次半字耗时约 50us)", color: "#00ff88", type: "flash_prog_pulse" }
        ],
        notes: "写入一个 16 位半字耗时约 50 微秒，写入速度极快，但写入前必须保证该扇区已被整页擦除为 0xFFFF！"
      },
      codeSnippet: `/**
 * @file    bsp_flash_uid.c
 * @brief   STM32 内部 Flash 模拟 EEPROM 掉电存储 & 读取 96 位芯片唯一身份 UID
 * @note    芯片 UID 基地址: 0x1FFFF7E8 (只读出厂序列号，可用于软件防盗防抄板)
 */
#include "stm32f10x.h"

#define USER_FLASH_ADDR   0x0800FC00 // C8T6 最后一页基地址 (Page 63)
#define UID_BASE_ADDR     0x1FFFF7E8 // 96 位芯片唯一序列号只读起始地址

/**
 * @brief  读取内部 Flash 数据 (Flash 在总线矩阵内与 RAM 统一寻址，可直接指针直读！)
 */
uint16_t Flash_ReadHalfWord(uint32_t address) {
    return *((__IO uint16_t*)address);                         // [★本章核心学习重点] 内存映射直接指针解引用读取 Flash！
}

/**
 * @brief  读取 96 位 (12 字节) 芯片独一无二的硬件 UID (防盗版核心)
 * @param  uid_buf 长度为 3 的 uint32_t 数组指针
 */
void Get_Chip_UID(uint32_t *uid_buf) {
    // 96 位 ID 连续存放在 3 个 32 位系统寄存器地址中
    uid_buf[0] = *(__IO uint32_t*)(UID_BASE_ADDR);             // [★本章核心学习重点] 读取 UID 低 32 位 [31:0]
    uid_buf[1] = *(__IO uint32_t*)(UID_BASE_ADDR + 0x04);      // [★本章核心学习重点] 读取 UID 中 32 位 [63:32]
    uid_buf[2] = *(__IO uint32_t*)(UID_BASE_ADDR + 0x08);      // [★本章核心学习重点] 读取 UID 高 32 位 [95:64]
}`,
      pitfalls: [
        "写入前如果忘记调用 FLASH_ClearFlag，若之前有报错残留，写入会直接被硬件拒绝且不报错！",
        "淘宝很多几块钱的 C8T6 芯片读取 0x1FFFF7E0 时可能会发现显示 128KB，这是厂商直接拿大容量晶圆切片卖的隐藏福利。"
      ]
    },

    // ==========================================
    // 8. P50 [结束语] 标准库大成与嵌入式高阶路线
    // ==========================================
    {
      id: "ch50",
      num: "P50 [结束语]",
      catId: "cat_advanced",
      title: "标准库大成与嵌入式高阶全景路线",
      badge: "通关进阶·全景图",
      stars: "★★★★★",
      whiteboard: {
        metaphor: "【从机械学徒到大师的蜕变】恭喜你学完了整套经典 STM32 标准库！现在的你，已经亲手把单片机里所有的齿轮（引脚电平、中断机制、定时器PWM、ADC采样、DMA搬运、USART通信、I2C协议、SPI协议、实时时钟、电源控制、看门狗、内部闪存）全部拆解并装配了一遍。你对单片机芯片的理解，已经远远超过了只会点灯、调库的新手！",
        whyWeNeed: "理清从单片机新手村通关后的下一步技能树，告别迷茫，指引大学阶段的全国电赛、毕业设计与高薪嵌入式研发就业。",
        soulQuestion: "Q：学完标准库，接下来该学什么？\nA：两大核心方向：\n1. FreeRTOS 实时操作系统：告别裸机繁重死板的 while(1) 轮询，进入任务调度与多线程并发时代！\n2. STM32CubeMX 与 HAL 库：具备了标准库底层原理后，用图形化工具开发效率翻倍，跨系列（F4/G4/H7）无缝移植！"
      },
      summary: "总结全套标准库系统知识网络，建立嵌入式高阶知识图谱：RTOS 实时多任务系统、HAL 库工具链与工业级总线通信技术路线。",
      hardware: {
        domain: "嵌入式工程师高阶全景体系",
        key_parts: [
          "裸机底层控制（已通关）：时钟树、总线架构、外设寄存器驱动、底层时序把控。",
          "RTOS 实时多任务：任务优先级抢占、信号量、互斥锁、消息队列、软件定时器。",
          "现代总线协议：CAN 总线（汽车与工业现场总线）、以太网 LWIP、USB 协议栈、Modbus 工业通信。"
        ]
      },
      internalDiagram: "进阶技能树: 裸机寄存器/标准库 -> FreeRTOS 实时多任务调度 -> STM32CubeMX/HAL 工业快速开发 -> 工业总线 (CAN/以太网) 与 Linux 驱动开发。",
      wiring: [],
      configSteps: [
        "第一阶段：把标准库的经典代码封装成自己的模块化驱动库 (如 MyI2C.c, MySPI.c)",
        "第二阶段：移植 FreeRTOS，创建 2~3 个并发任务跑跑看 (一个任务刷屏，一个任务跑通信)",
        "第三阶段：用 CubeMX 生成 HAL 库工程，体验图形化时钟树配置的飞快感觉！"
      ],
      registers: [],
      scope: {
        title: "FreeRTOS 多任务时间片轮转调度示波器引脚翻转波形 (进阶展望)",
        timeBase: "1.0 ms/div",
        voltsDiv: "CH1: 1.00 V/div | CH2: 1.00 V/div",
        trigger: "CH1 边沿触发",
        signals: [
          { name: "CH1: 任务 A 运行时间片 (Task_A 耗时 1ms)", color: "#00ff88", type: "rtos_task_a" },
          { name: "CH2: 任务 B 运行时间片 (Task_B 耗时 1ms)", color: "#00f0ff", type: "rtos_task_b" }
        ],
        notes: "在 RTOS 下，两个任务像两个独立线程一样轮流抢占执行，彻底告别裸机 while(1) 轮询卡顿！"
      },
      codeSnippet: `/**
 * @file    main_framework.c
 * @brief   工程级模块化单片机软件架构模板 (裸机时间片轮询前后台调度系统)
 * @note    江科大进阶：告别死循环延时，构建高内聚低耦合的嵌入式驱动总线
 */
#include "stm32f10x.h"

// 硬件外设初始化总调度中心
void System_Hardware_Init(void) {
    // 1. 初始化系统时钟为 72MHz
    SystemInit();                                              // 72MHz HSE PLL 时钟树就绪
    
    // 2. 依次初始化各硬件总线模块
    LED_Init();            // 板载 PC13 指示灯
    Key_Init();            // 按键输入检测
    USART1_Init(115200);   // 串口调试交互
    MyRTC_Init();          // RTC 实时时钟日历 [★核心安全外设]
    IWDG_Init_Config();    // 独立看门狗护航  [★核心安全外设]
}

int main(void) {
    System_Hardware_Init();
    
    while (1) {
        // [★本章核心学习重点] 时间片轮询调度框架：
        // 模块 1: 处理传感器采集与通信解包
        // 模块 2: 刷新 OLED 显示与按键状态机
        // 模块 3: 周期性喂狗，保障死机硬件自恢复
        IWDG_Feed();                                           // [★本章核心学习重点] 主循环安全喂狗保活
    }
}`,
      pitfalls: [
        "千万不要觉得学标准库是'无用功'：所有在 HAL 库里遇到的疑难死机 bug，底层原因全都在标准库这套时序和寄存器原理里！"
      ]
    },

    // ==========================================
    // 9. P05~P08 [第3章] GPIO 通用输入输出
    // ==========================================
    {
      id: "ch03",
      num: "P05~P08 [第3章]",
      catId: "cat_basics",
      title: "GPIO 通用输入输出端口",
      badge: "基础基石",
      stars: "★★★★☆",
      whiteboard: {
        metaphor: "【单片机的神经触手】GPIO 就是单片机通往外界世界的开关。配置成推挽输出就像用手指强力按开关（输出强高低电平点亮 LED）；配置成上拉输入就像用耳朵听外界的声音（检测按键是否被按下）。",
        whyWeNeed: "一切嵌入式控制的起点。点亮 LED、按键控制、蜂鸣器报警全靠 GPIO。",
        soulQuestion: "Q：为什么推挽输出驱动能力强，而开漏输出常用于 I2C 通信？\nA：推挽上下两个 MOS 管轮流导通，既能出大电流也能吸大电流；开漏输出只有下拉管，必须外接上拉电阻，能实现多个芯片共用一根线的'线与'功能！"
      },
      summary: "掌握 GPIO 的 8 种工作模式，熟练掌握 GPIO_Init、SetBits、ResetBits 等库函数与按键硬件消抖。",
      hardware: {
        domain: "APB2 总线 (GPIOA, GPIOB, GPIOC，时钟 72MHz)",
        key_parts: [
          "8 种模式：模拟输入、浮空输入、下拉输入、上拉输入、开漏输出、推挽输出、复用开漏、复用推挽。",
          "输出速度：2MHz、10MHz、50MHz（指引脚电平翻转斜率电磁辐射控制）。"
        ]
      },
      internalDiagram: "GPIO 内部结构: 输入端有施密特触发器 (将毛刺模拟信号整形成平整的 0 和 1)；输出端有 P-MOS 和 N-MOS 管构成推挽驱动电路。",
      wiring: [
        { pin: "PC13", mcu: "PC13", dir: "推挽输出", desc: "板载蓝色测试 LED (低电平点亮，高电平熄灭)" },
        { pin: "PA0", mcu: "PA0", dir: "上拉输入", desc: "轻触按键输入 (按键另一端接地，按下读到低电平)" }
      ],
      configSteps: [
        "第 1 步：开启对应 GPIO 的 APB2 时钟 -> RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOC, ENABLE)",
        "第 2 步：定义 GPIO_InitTypeDef 结构体并填入 Pin、Mode、Speed 参数",
        "第 3 步：调用 GPIO_Init(GPIOC, &GPIO_InitStructure) 初始化硬件",
        "第 4 步：调用 GPIO_SetBits 或 GPIO_ResetBits 翻转电平"
      ],
      registers: [
        { name: "GPIOx_CRL / CRH", desc: "端口配置低/高寄存器，每 4 位控制一个引脚的模式与速度。" },
        { name: "GPIOx_IDR / ODR", desc: "输入数据寄存器 (读引脚电平) 与输出数据寄存器 (写引脚电平)。" },
        { name: "GPIOx_BSRR / BRR", desc: "位设置/清除寄存器，支持单周期原子操作，无需读改写防中断冲突！" }
      ],
      scope: {
        title: "按键按下瞬间的机械电平抖动 (Bouncing) 示波器波形",
        timeBase: "2.0 ms/div",
        voltsDiv: "CH1: 1.00 V/div",
        trigger: "CH1 下降沿触发 (1.50V)",
        signals: [
          { name: "CH1: 按键机械触点抖动波形 (前 5~10ms 密集毛刺抖动)", color: "#facc15", type: "key_bounce" }
        ],
        notes: "真实示波器直击：机械按键按下一瞬间金属片会剧烈弹跳 5~10ms，产生大量高频毛刺，这就是为什么必须写 Delay_ms(20) 软件消抖的硬件原因！"
      },
      codeSnippet: `/**
 * @file    bsp_gpio.c
 * @brief   STM32F103 GPIO 推挽输出驱动 PC13 板载 LED 与上拉输入驱动
 * @note    板载 LED 硬件设计为低电平点亮，输出速度 50MHz
 */
#include "stm32f10x.h"

/**
 * @brief  初始化 PC13 板载 LED
 */
void LED_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;

    // 1. 开启 GPIOC 外设时钟 (挂载在 APB2 高速总线上)
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOC, ENABLE);      // [★本章核心学习重点] 开启 GPIOC APB2 总线时钟

    // 2. 配置 PC13 引脚为通用推挽输出 (Out_PP)
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_13;                 // [★本章核心学习重点] 指定 PC13 引脚
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;           // [★本章核心学习重点] 模式：通用推挽输出
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;          // 输出转换速率 50MHz
    GPIO_Init(GPIOC, &GPIO_InitStructure);                     // [★本章核心学习重点] 写入寄存器执行初始化

    // 3. 默认输出高电平（熄灭 LED）
    GPIO_SetBits(GPIOC, GPIO_Pin_13);                          // 输出高电平关灯
}

/**
 * @brief  翻转 PC13 LED 状态
 */
void LED_Toggle(void) {
    // 读出当前引脚输出锁存器电平，并取反写入
    if (GPIO_ReadOutputDataBit(GPIOC, GPIO_Pin_13) == 0) {
        GPIO_SetBits(GPIOC, GPIO_Pin_13);                      // [★本章核心学习重点] 拉高置位 (关灯)
    } else {
        GPIO_ResetBits(GPIOC, GPIO_Pin_13);                    // [★本章核心学习重点] 拉低清零 (点亮)
    }
}`,
      pitfalls: [
        "千万记得先开启 RCC 外设时钟！不给外设通时钟，写任何配置寄存器都是无效的白忙活。"
      ]
    },

    // ==========================================
    // 10. P13~P20 [第6章] TIM 定时器与 PWM 输出
    // ==========================================
    {
      id: "ch06",
      num: "P13~P20 [第6章]",
      catId: "cat_basics",
      title: "TIM 定时器与 PWM 输出/输入捕获",
      badge: "核心动力枢纽",
      stars: "★★★★★",
      whiteboard: {
        metaphor: "【芯片里的节拍器与马达油门】定时器就像一个机械齿轮秒表。给它输入 72MHz 高速时钟，它咔哒咔哒递增计数。计到设定值就敲一下钟（定时中断）；或者根据计数值高低快速翻转引脚电平（PWM脉宽调制），高频开关给电机通电调速（像给赛车踩油门），或者控制舵机旋转精准角度！",
        whyWeNeed: "精准定时、舵机角度控制、直流电机调速、超声波测距脉宽、编码器四倍频测速全靠 TIM！",
        soulQuestion: "Q：PWM 怎么算频率和占空比？\nA：频率 = 72MHz / (PSC+1) / (ARR+1)；占空比 = CCR / (ARR+1)！只要牢记这两个公式，调电机和舵机信手拈来！"
      },
      summary: "精通通用定时器 (TIM2/3/4/5) 与高级定时器 (TIM1/8)。精通定时中断、PWM 输出比较、输入捕获测频率与占空比、编码器接口测速。",
      hardware: {
        domain: "APB1 / APB2 定时器时钟域",
        key_parts: [
          "时基单元：预分频器 (PSC)、自动重装载寄存器 (ARR)、计数器 (CNT)。",
          "输出比较 (OC)：通过 CCR 寄存器控制高低电平翻转点，输出 PWM 波。",
          "输入捕获 (IC)：检测外部引脚电平跳变并锁存 CNT 值，测算外部方波频率与脉宽。"
        ]
      },
      internalDiagram: "PWM 发生机制: CNT 计数器从 0 递增到 ARR。当 CNT < CCR 时引脚输出有效电平；当 CNT >= CCR 时翻转为无效电平，以此调节占空比！",
      wiring: [
        { pin: "PA0 (TIM2_CH1)", mcu: "PA0", dir: "PWM输出", desc: "接舵机信号线 (黄色/橙色线) 或电机驱动模块 PWM 输入" },
        { pin: "PC13", mcu: "PC13", dir: "推挽输出", desc: "呼吸灯演示引脚" }
      ],
      configSteps: [
        "第 1 步：开启 TIM2 和 GPIOA 时钟 -> RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE)",
        "第 2 步：配置 TIM_TimeBaseInitTypeDef 时基结构体 (PSC, ARR, 计数模式)",
        "第 3 步：配置 TIM_OCInitTypeDef 输出比较结构体 (OCMode = PWM1, Pulse = CCR)",
        "第 4 步：使能定时器 -> TIM_Cmd(TIM2, ENABLE)"
      ],
      registers: [
        { name: "TIMx_PSC / ARR / CNT", desc: "时基核心：分频值、重装载周期值、当前计数值。" },
        { name: "TIMx_CCRx", desc: "捕获/比较寄存器，决定 PWM 占空比的黄金寄存器！" }
      ],
      scope: {
        title: "PWM 脉宽调制信号不同占空比方波对比示波器",
        timeBase: "2.0 ms/div (周期 20ms 对应 50Hz 舵机信号)",
        voltsDiv: "CH1: 1.00 V/div",
        trigger: "CH1 上升沿触发",
        signals: [
          { name: "CH1: 占空比 25% (高电平 5ms，低电平 15ms)", color: "#00ff88", type: "pwm_25" },
          { name: "CH2: 占空比 75% (高电平 15ms，低电平 5ms)", color: "#facc15", type: "pwm_75" }
        ],
        notes: "高电平持续时间越长，电机获得的平均电压越高，转速越快！舵机 0~180 度对应高电平脉宽 0.5ms~2.5ms。"
      },
      codeSnippet: `/**
 * @file    bsp_pwm.c
 * @brief   TIM2 通用定时器通道 1 (PA0) 输出 50Hz PWM 伺服信号或呼吸灯驱动
 * @note    主频 72MHz -> PSC=71 (1MHz计数频) -> ARR=19999 (周期 20ms = 50Hz)
 */
#include "stm32f10x.h"

/**
 * @brief  初始化 TIM2_CH1 (PA0) 输出比较 PWM
 */
void PWM_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    TIM_TimeBaseInitTypeDef TIM_TimeBaseInitStructure;
    TIM_OCInitTypeDef TIM_OCInitStructure;

    // 1. 开启 GPIOA 与 TIM2 定时器外设时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);

    // 2. PA0 引脚配置为复用推挽输出 (AF_PP)
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;            // [★本章核心学习重点] 定时器硬件接管引脚，必须配为复用推挽！
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // 3. 定时器时基单元配置 (ARR=20000-1, PSC=72-1)
    TIM_TimeBaseInitStructure.TIM_Period = 20000 - 1;          // [★本章核心学习重点] 自动重装载值 ARR (决定 PWM 周期)
    TIM_TimeBaseInitStructure.TIM_Prescaler = 72 - 1;          // [★本章核心学习重点] 预分频值 PSC (1MHz 计数频率)
    TIM_TimeBaseInitStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseInitStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseInit(TIM2, &TIM_TimeBaseInitStructure);

    // 4. 定时器输出比较通道 1 (PWM 模式 1) 配置
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;          // [★本章核心学习重点] 选择 PWM 模式 1 (CNT < CCR 输出有效电平)
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_Pulse = 1500;                      // 初始比较值 CCR (决定占空比)
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;  // 高电平有效
    TIM_OC1Init(TIM2, &TIM_OCInitStructure);                   // [★本章核心学习重点] 初始化通道 1 输出比较单元

    // 5. 启动定时器总开关
    TIM_Cmd(TIM2, ENABLE);                                     // [★本章核心学习重点] 使能 TIM2 开始计数
}

/**
 * @brief  动态设置 PWM 占空比 (调整比较值 CCR)
 */
void PWM_SetCompare1(uint16_t ccr) {
    TIM_SetCompare1(TIM2, ccr);                                // [★本章核心学习重点] 写入新 CCR 值动态修改占空比
}`,
      pitfalls: [
        "舵机控制的 PWM 周期必须严格为 20ms (50Hz)，高电平持续 0.5ms~2.5ms 对应舵机 0 度~180 度！"
      ]
    },

    // ==========================================
    // 11. P25~P30 [第9章] USART 串口通信
    // ==========================================
    {
      id: "ch09",
      num: "P25~P30 [第9章]",
      catId: "cat_basics",
      title: "USART 通用同步/异步收发器",
      badge: "串口通信核心",
      stars: "★★★★★",
      whiteboard: {
        metaphor: "【单片机与电脑打字聊天的电线】一根 TX（发信嘴巴）、一根 RX（收信耳朵）、一根 GND（地线作为统一电压参考）。单片机通过两根线，按照约定的打字节拍（波特率，如 9600 或 115200），把字母一个接一个发给电脑屏幕，电脑也能敲指令控制单片机。",
        whyWeNeed: "人机调试、与蓝牙/WiFi/GPS/语音模块通信的万能接口。",
        soulQuestion: "Q：为什么串口助手经常收到一堆'烫烫烫'乱码？\nA：99% 是波特率不匹配！如果单片机以 9600 发，电脑用 115200 去猜，时钟节拍完全错位，自然解出乱码！"
      },
      summary: "掌握串口数据帧格式（起始位、8位数据、停止位）、波特率发生器计算、printf 重定向、状态机收发固定包头包尾的数据包。",
      hardware: {
        domain: "USART1 (APB2 72MHz) / USART2,3 (APB1 36MHz)",
        key_parts: [
          "常用引脚：USART1_TX (PA9), USART1_RX (PA10)。",
          "发送数据寄存器 (TDR) 与接收数据寄存器 (RDR)，共用一个 USART_DR 地址。"
        ]
      },
      internalDiagram: "串口帧结构: 空闲高电平 -> 1位起始位(低电平) -> 8位数据位(低位D0先发) -> 1位停止位(高电平)。",
      wiring: [
        { pin: "PA9 (TX)", mcu: "PA9", dir: "推挽复用输出", desc: "接 USB转串口模块的 RXD 引脚 (交叉相连！)" },
        { pin: "PA10 (RX)", mcu: "PA10", dir: "浮空输入", desc: "接 USB转串口模块的 TXD 引脚 (交叉相连！)" },
        { pin: "GND", mcu: "GND", dir: "公共地", desc: "必须与 USB转串口模块的 GND 连在一起 (共地！)" }
      ],
      configSteps: [
        "第 1 步：开 USART1 和 GPIOA 时钟 -> RCC_APB2PeriphClockCmd(RCC_APB2Periph_USART1 | RCC_APB2Periph_GPIOA, ENABLE)",
        "第 2 步：配置 PA9 为复用推挽输出，PA10 为浮空输入",
        "第 3 步：配置 USART_InitStructure (波特率 9600/115200, 8位数据, 1位停止, 无校验)",
        "第 4 步：使能串口 -> USART_Cmd(USART1, ENABLE)",
        "第 5 步：重写 fputc 实现 printf 重定向"
      ],
      registers: [
        { name: "USART_SR", desc: "TXE (发送数据寄存器空标志)、RXNE (接收数据寄存器非空标志)。" },
        { name: "USART_DR", desc: "数据寄存器，写入即发送，读取即接收。" }
      ],
      scope: {
        title: "串口发送字符 'A' (0x41) 完整帧示波器波形",
        timeBase: "100 us/div (9600 波特率下 1位 = 104us)",
        voltsDiv: "CH1: 1.00 V/div",
        trigger: "CH1 下降沿触发 (起始位)",
        signals: [
          { name: "CH1: USART1_TX (PA9) 真实发送波形", color: "#00f0ff", type: "uart_char_a" }
        ],
        notes: "空闲高电平 -> 起始位拉低 104us -> 发送 0x41 (0b01000001，低位先发: 1,0,0,0,0,0,1,0) -> 停止位拉高 104us。示波器上看得一清二楚！"
      },
      codeSnippet: `/**
 * @file    bsp_usart.c
 * @brief   USART1 异步串口通信驱动 (PA9 TX, PA10 RX) 与 printf 重定向
 * @note    波特率 115200 8-N-1 格式，支持中断接收与阻塞发送
 */
#include "stm32f10x.h"
#include <stdio.h>

/**
 * @brief  初始化 USART1 串口
 */
void USART1_Init(uint32_t baudrate) {
    GPIO_InitTypeDef GPIO_InitStructure;
    USART_InitTypeDef USART_InitStructure;

    // 1. 开启 GPIOA 与 USART1 外设时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);

    // 2. 配置 PA9 (TX 发送端) 为复用推挽输出
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;            // [★本章核心学习重点] TX 引脚必须设为复用推挽
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // 3. 配置 PA10 (RX 接收端) 为浮空输入
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;      // [★本章核心学习重点] RX 引脚设为浮空输入
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // 4. 配置 USART 参数 (波特率、8位数据、1位停止位、无校验)
    USART_InitStructure.USART_BaudRate = baudrate;             // [★本章核心学习重点] 设定目标波特率
    USART_InitStructure.USART_WordLength = USART_WordLength_8b;
    USART_InitStructure.USART_StopBits = USART_StopBits_1;
    USART_InitStructure.USART_Parity = USART_Parity_No;
    USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    USART_InitStructure.USART_Mode = USART_Mode_Tx | USART_Mode_Rx;
    USART_Init(USART1, &USART_InitStructure);                  // [★本章核心学习重点] 初始化串口硬件结构

    // 5. 使能 USART1
    USART_Cmd(USART1, ENABLE);                                 // [★本章核心学习重点] 启动 USART1
}

/**
 * @brief  重定向标准库 printf 到串口发送单个字节
 */
int fputc(int ch, FILE *f) {
    USART_SendData(USART1, (uint8_t)ch);                       // [★本章核心学习重点] 将字符送入发送数据寄存器 TDR
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET); // [★本章核心学习重点] 阻塞等待发送缓冲区为空 (TXE=1)
    return ch;
}`,
      pitfalls: [
        "两个设备通信，双方的 GND 必须接在一起！不共地就没有统一的电压参考面，信号会严重乱跳。"
      ]
    },

    // ==========================================
    // 12. P31~P35 [第10章] I2C 协议 & MPU6050
    // ==========================================
    {
      id: "ch10",
      num: "P31~P35 [第10章]",
      catId: "cat_basics",
      title: "I2C 串行通信协议 & MPU6050 陀螺仪",
      badge: "两线挂载多设备",
      stars: "★★★★☆",
      whiteboard: {
        metaphor: "【走廊点名与应答】I2C 只用两根线：SCL（时钟节拍线）和 SDA（双向数据线）。就像主控在一个大走廊里喊话：'0x68 号房间听令！'，走廊里挂的十几台设备（OLED、陀螺仪、EEPROM）只有地址为 0x68 的设备会应答'在！'（从机拉低 SDA 应答 ACK），其他设备自觉闭嘴，极度节省引脚！",
        whyWeNeed: "低速传感器挂载神器。开漏输出 + 上拉电阻设计，完美支持多机挂载且绝不短路。",
        soulQuestion: "Q：软件模拟 I2C 和硬件 I2C 怎么选？\nA：在 STM32F103 上，强烈推荐软件模拟 I2C！因为 F103 芯片早期的硬件 I2C 外设存在偶发卡死死锁的硬件硅缺陷 (Errata)，而软件模拟 GPIO 翻转极其稳定、易调试、任意引脚都能用！"
      },
      summary: "掌握 I2C 起始条件、终止条件、发送接收应答位时序；实战运用软件 I2C 读写 MPU6050 六轴陀螺仪姿态传感器内部寄存器。",
      hardware: {
        domain: "SCL(时钟), SDA(双向数据) - 必须外部接 4.7k 上拉电阻",
        key_parts: [
          "起始条件：SCL 高电平期间，SDA 产生下降沿。",
          "应答机制：每发 8 位，接收方在第 9 个时钟下拉 SDA 作为 ACK。"
        ]
      },
      internalDiagram: "I2C 总线结构: 开漏输出 (Open-Drain) 结构。只能输出低电平或断开输出，必须依靠外部 4.7k 上拉电阻将总线拉高到 3.3V，实现多机线与防短路！",
      wiring: [
        { pin: "SCL", mcu: "PB10", dir: "开漏输出/通用输出", desc: "I2C 时钟线 (外接 4.7k 上拉电阻到 3.3V)" },
        { pin: "SDA", mcu: "PB11", dir: "开漏双向", desc: "I2C 数据线 (外接 4.7k 上拉电阻到 3.3V)" },
        { pin: "VCC / GND", mcu: "3.3V / GND", dir: "供电", desc: "为 MPU6050 模块供电" }
      ],
      configSteps: [
        "第 1 步：配置 SCL 和 SDA 为开漏输出模式 (GPIO_Mode_Out_OD)",
        "第 2 步：编写 MyI2C_Start() -> SCL高时SDA拉低",
        "第 3 步：编写 MyI2C_SendByte() -> 循环8次，SCL低放数据，SCL高稳定读取",
        "第 4 步：编写 MyI2C_ReceiveAck() -> 第9个时钟释放SDA，检测从机是否拉低",
        "第 5 步：编写 MyI2C_Stop() -> SCL高时SDA拉高"
      ],
      registers: [
        { name: "MPU6050_PWR_MGMT_1 (0x6B)", desc: "电源管理寄存器 1。必须先写入 0x00 解除其睡眠模式，陀螺仪才会开始测量！" },
        { name: "MPU6050_ACCEL_XOUT_H (0x3B)", desc: "加速度 X 轴高8位数据寄存器。" }
      ],
      scope: {
        title: "I2C 通信起始位与地址字节传输双通道示波器波形",
        timeBase: "5.0 us/div",
        voltsDiv: "CH1: 1.00 V/div | CH2: 1.00 V/div",
        trigger: "CH2 下降沿触发 (起始信号)",
        signals: [
          { name: "CH1: SCL 时钟线 (黄色方波脉冲)", color: "#facc15", type: "i2c_scl" },
          { name: "CH2: SDA 数据线 (青色数据 + 从机拉低 ACK)", color: "#00f0ff", type: "i2c_sda" }
        ],
        notes: "黄色 SCL 保持高电平时，青色 SDA 突然跳水产生下降沿（起始信号 Start）；随后的第 9 个时钟，SDA 被从机强力拉低产生第 9 位 ACK 应答！"
      },
      codeSnippet: `/**
 * @file    bsp_i2c.c
 * @brief   软件模拟 I2C 通信总线底层时序驱动 (SCL: PB10, SDA: PB11 开漏输出)
 * @note    支持高精度微秒延时、起始信号、停止信号、发送字节与接收 ACK 应答
 */
#include "stm32f10x.h"

// 引脚电平宏定义
#define I2C_W_SCL(x)  GPIO_WriteBit(GPIOB, GPIO_Pin_10, (BitAction)(x))
#define I2C_W_SDA(x)  GPIO_WriteBit(GPIOB, GPIO_Pin_11, (BitAction)(x))
#define I2C_R_SDA()   GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_11)

/**
 * @brief  产生 I2C 起始信号 (Start: SCL 高电平期间 SDA 产生下降沿)
 */
void MyI2C_Start(void) {
    I2C_W_SDA(1);
    I2C_W_SCL(1);                                              // [★本章核心学习重点] SCL 处于高电平时
    I2C_W_SDA(0);                                              // [★本章核心学习重点] SDA 产生从高拉低的下降沿 (触发 START)
    I2C_W_SCL(0);                                              // 拉低 SCL 钳住总线准备发数据
}

/**
 * @brief  产生 I2C 停止信号 (Stop: SCL 高电平期间 SDA 产生上升沿)
 */
void MyI2C_Stop(void) {
    I2C_W_SDA(0);
    I2C_W_SCL(1);                                              // [★本章核心学习重点] SCL 处于高电平时
    I2C_W_SDA(1);                                              // [★本章核心学习重点] SDA 产生从低放开的上升沿 (触发 STOP)
}

/**
 * @brief  I2C 发送 1 个字节 (MSB 高位先行)
 */
void MyI2C_SendByte(uint8_t byte) {
    for (uint8_t i = 0; i < 8; i++) {
        I2C_W_SDA(byte & (0x80 >> i));                         // [★本章核心学习重点] 依次输出最高位至最低位
        I2C_W_SCL(1);                                          // 拉高 SCL 告知从机采样
        I2C_W_SCL(0);                                          // 拉低 SCL 允许切换下一位数据
    }
}`,
      pitfalls: [
        "I2C 引脚如果忘了配开漏或者忘了接上拉电阻，总线电平会拉不起来导致读出全为 0xFF 或 0x00。"
      ]
    },

    // ==========================================
    // 13. P36~P40 [第11章] SPI 协议 & W25Q64
    // ==========================================
    {
      id: "ch11",
      num: "P36~P40 [第11章]",
      catId: "cat_basics",
      title: "SPI 串行外设接口 & W25Q64 存储器",
      badge: "高速四线通信",
      stars: "★★★★★",
      whiteboard: {
        metaphor: "【四车道全速狂飙的高速公路】如果说 I2C 像公交车走走停停，SPI 就是全速狂飙的跑车。它用四根线：CS（片选）、SCK（时钟）、MOSI（主发从收）、MISO（主收从发）。主从机之间像两条并排的高速传送带，时钟一敲，双方各吐出一个位并吞进对方的一个位，速度高达数十兆赫兹！",
        whyWeNeed: "用于高吞吐量外设：彩色彩屏 (TFT/LCD)、Flash 芯片 (W25Q64)、SD 卡、无线射频模块 (NRF24L01)。",
        soulQuestion: "Q：为什么 SPI 叫全双工同步移位通信？\nA：因为主机的移位寄存器和从机的移位寄存器连成了一个环！主控发送 1 个字节的同时，必定也从对方那里收回了 1 个字节，收发同步发生！"
      },
      summary: "掌握 SPI 四种工作模式（CPOL/CPHA 时钟极性与相位）、硬件 SPI 外设配置与软件 SPI 模拟、W25Q64 8MB 外置 Flash 芯片的扇区擦除与页写入。",
      hardware: {
        domain: "SPI1 (APB2 72MHz，最大 18MHz) / SPI2 (APB1 36MHz)",
        key_parts: [
          "引脚：SCK(时钟), MOSI(主机输出), MISO(主机输入), NSS/CS(片选，软件控制低电平使能)。",
          "双缓冲机制：发送数据寄存器 TDR 与移位寄存器配合，实现无缝连续收发。"
        ]
      },
      internalDiagram: "全双工移位环拓扑: 主机 8位移位寄存器 --(MOSI)--> 从机 8位移位寄存器 --(MISO)--> 主机；每一个 SCK 脉冲双方右移一位并吞入一位，8个脉冲交换完 1 个字节！",
      wiring: [
        { pin: "CS / SS", mcu: "PA4", dir: "通用推挽输出", desc: "片选引脚 (平时拉高，低电平使能选定芯片)" },
        { pin: "SCK", mcu: "PA5", dir: "复用推挽输出", desc: "SPI1 时钟线" },
        { pin: "MISO", mcu: "PA6", dir: "浮空输入", desc: "主机输入从机输出" },
        { pin: "MOSI", mcu: "PA7", dir: "复用推挽输出", desc: "主机输出从机输入" }
      ],
      configSteps: [
        "第 1 步：开启 SPI1 和 GPIOA 时钟 -> RCC_APB2PeriphClockCmd(RCC_APB2Periph_SPI1 | RCC_APB2Periph_GPIOA, ENABLE)",
        "第 2 步：配置 PA5(SCK), PA7(MOSI) 为复用推挽；PA6(MISO) 为浮空输入；PA4(CS) 为通用推挽",
        "第 3 步：配置 SPI_InitStructure (模式0: CPOL=Low, CPHA=1Edge, 主机模式, 8位帧)",
        "第 4 步：使能 SPI -> SPI_Cmd(SPI1, ENABLE)",
        "第 5 步：编写 SPI_SwapByte 函数进行字节同步交换"
      ],
      registers: [
        { name: "SPI_CR1", desc: "MSTR (主从模式选择)、SPE (SPI使能)、BR[2:0] (波特率预分频)、CPOL、CPHA。" },
        { name: "SPI_SR", desc: "TXE (发送缓冲区空)、RXNE (接收缓冲区非空)、BSY (忙标志)。" }
      ],
      scope: {
        title: "SPI 模式 0 交换一个字节数据四通道示波器波形",
        timeBase: "1.0 us/div",
        voltsDiv: "1.00 V/div",
        trigger: "CH1 下降沿触发 (CS 片选使能)",
        signals: [
          { name: "CH1: CS 片选拉低使能", color: "#38bdf8", type: "spi_cs" },
          { name: "CH2: SCK 连续 8 个时钟脉冲", color: "#facc15", type: "spi_sck" },
          { name: "CH3: MOSI 主机发送数据位", color: "#00ff88", type: "spi_mosi" },
          { name: "CH4: MISO 从机返回数据位", color: "#c084fc", type: "spi_miso" }
        ],
        notes: "CS 拉低开始通信；SCK 第 1 个上升沿捕获数据，第 2 个下降沿移出数据；8 个脉冲一气呵成，主机与从机同步完成 1 个字节的双向数据交换！"
      },
      codeSnippet: `/**
 * @file    bsp_spi.c
 * @brief   STM32 硬件 SPI1 全双工高速总线驱动 (SCK: PA5, MISO: PA6, MOSI: PA7)
 * @note    SPI Mode 0 极性与相位 (CPOL=0, CPHA=0)，全双工移位同步交换字节
 */
#include "stm32f10x.h"

/**
 * @brief  初始化硬件 SPI1 控制器 (主模式，时钟 18MHz)
 */
void SPI1_Init(void) {
    SPI_InitTypeDef SPI_InitStructure;
    GPIO_InitTypeDef GPIO_InitStructure;

    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_SPI1, ENABLE);

    // SCK (PA5) 与 MOSI (PA7) 配置为复用推挽输出
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_5 | GPIO_Pin_7;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // MISO (PA6) 配置为上拉输入
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // SPI 核心参数配置 (Mode 0: 静态低电平，奇数边缘采样)
    SPI_InitStructure.SPI_Direction = SPI_Direction_2Lines_FullDuplex; // [★本章核心学习重点] 双线全双工通信
    SPI_InitStructure.SPI_Mode = SPI_Mode_Master;                      // [★本章核心学习重点] 主机模式
    SPI_InitStructure.SPI_DataSize = SPI_DataSize_8b;
    SPI_InitStructure.SPI_CPOL = SPI_CPOL_Low;                         // [★本章核心学习重点] CPOL=0 时钟空闲低电平
    SPI_InitStructure.SPI_CPHA = SPI_CPHA_1Edge;                       // [★本章核心学习重点] CPHA=0 第 1 个跳变沿采样
    SPI_InitStructure.SPI_NSS = SPI_NSS_Soft;                          // 软件管理片选 CS
    SPI_InitStructure.SPI_BaudRatePrescaler = SPI_BaudRatePrescaler_4; // 72MHz / 4 = 18MHz
    SPI_InitStructure.SPI_FirstBit = SPI_FirstBit_MSB;                 // MSB 高位先行
    SPI_Init(SPI1, &SPI_InitStructure);

    SPI_Cmd(SPI1, ENABLE);                                             // [★本章核心学习重点] 开启 SPI1 总线
}

/**
 * @brief  硬件 SPI 发送并同步接收 1 个字节 (移位交换)
 */
uint8_t SPI1_SwapByte(uint8_t byte) {
    // 1. 等待发送缓冲区为空 (TXE=1)
    while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_TXE) == RESET);   // [★本章核心学习重点] 阻塞等待发送缓冲区空
    
    // 2. 将数据写入发送寄存器
    SPI_I2S_SendData(SPI1, byte);                                      // [★本章核心学习重点] 写入数据并启动移位时序
    
    // 3. 等待接收缓冲区非空 (RXNE=1)
    while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_RXNE) == RESET);  // [★本章核心学习重点] 阻塞等待接收缓冲区满
    
    // 4. 读取从机送回来的数据
    return SPI_I2S_ReceiveData(SPI1);                                  // [★本章核心学习重点] 返回收到的字节
}`,
      pitfalls: [
        "对 W25Q64 写入前必须先发送 0x06 (写使能)，且每次写入不得超过一页 (256 字节) 的边界，否则地址会回卷发生覆盖！"
      ]
    }
  ]
};

window.COURSE_DATA = COURSE_DATA;
