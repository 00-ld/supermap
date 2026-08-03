package com.at.mobile.util;

import androidx.annotation.ColorRes;
import androidx.annotation.DrawableRes;
import androidx.annotation.StringRes;

import com.at.mobile.R;

import java.util.HashSet;
import java.util.Set;

/**
 * 气体危险度分级：基于气体类型关键字判定 剧毒/易燃易爆/有害/一般 四级，
 * 驱动事故卡片色条、徽章、详情页危险等级展示。
 *
 * <p>分级依据 GB 5044-85《职业性接触毒物危害程度分级》与化工园区常见气体特性：
 * <ul>
 *   <li>剧毒（一级）：H2S、氯气、光气、氢氰酸 — 极少量即可致命</li>
 *   <li>易燃易爆（二级）：甲烷、氢气、可燃气（LEL） — 爆炸下限低</li>
 *   <li>有害（三级）：CO、氨、SO2 — 慢性或高浓度急性危害</li>
 *   <li>一般（四级）：其他 — 低风险</li>
 * </ul></p>
 *
 * <p>纯本地判定，不依赖后端字段；gasType 为 null 归一般。</p>
 */
public final class GasHazardLevel {

    public static final int LEVEL_EXTREME = 4;  // 剧毒
    public static final int LEVEL_HIGH = 3;     // 易燃易爆
    public static final int LEVEL_MEDIUM = 2;   // 有害
    public static final int LEVEL_LOW = 1;       // 一般

    private static final Set<String> EXTREME_KEYWORDS = new HashSet<>();
    private static final Set<String> HIGH_KEYWORDS = new HashSet<>();
    private static final Set<String> MEDIUM_KEYWORDS = new HashSet<>();

    static {
        // 剧毒气体
        EXTREME_KEYWORDS.add("硫化氢");
        EXTREME_KEYWORDS.add("H2S");
        EXTREME_KEYWORDS.add("氯气");
        EXTREME_KEYWORDS.add("氯");
        EXTREME_KEYWORDS.add("光气");
        EXTREME_KEYWORDS.add("氢氰酸");
        EXTREME_KEYWORDS.add("HCN");
        EXTREME_KEYWORDS.add("氟");
        EXTREME_KEYWORDS.add("氟化氢");

        // 易燃易爆气体
        HIGH_KEYWORDS.add("甲烷");
        HIGH_KEYWORDS.add("CH4");
        HIGH_KEYWORDS.add("氢气");
        HIGH_KEYWORDS.add("氢");
        HIGH_KEYWORDS.add("H2");
        HIGH_KEYWORDS.add("可燃");
        HIGH_KEYWORDS.add("LEL");
        HIGH_KEYWORDS.add("乙烷");
        HIGH_KEYWORDS.add("丙烷");
        HIGH_KEYWORDS.add("丁烷");
        HIGH_KEYWORDS.add("天然气");

        // 有害气体
        MEDIUM_KEYWORDS.add("一氧化碳");
        MEDIUM_KEYWORDS.add("CO");
        MEDIUM_KEYWORDS.add("氨");
        EXTREME_KEYWORDS.add("NH3");  // 注：高浓度氨也剧毒，但工业氨泄漏常见归有害
        MEDIUM_KEYWORDS.add("NH3");
        MEDIUM_KEYWORDS.add("二氧化硫");
        MEDIUM_KEYWORDS.add("SO2");
        MEDIUM_KEYWORDS.add("氮氧化物");
        MEDIUM_KEYWORDS.add("NOx");
    }

    private GasHazardLevel() {
    }

    /** 判定气体危险等级，gasType 为 null 或无法识别返回 LOW。 */
    public static int of(String gasType) {
        if (gasType == null || gasType.trim().isEmpty()) {
            return LEVEL_LOW;
        }
        String normalized = gasType.trim();
        for (String keyword : EXTREME_KEYWORDS) {
            if (normalized.contains(keyword)) {
                return LEVEL_EXTREME;
            }
        }
        for (String keyword : HIGH_KEYWORDS) {
            if (normalized.contains(keyword)) {
                return LEVEL_HIGH;
            }
        }
        for (String keyword : MEDIUM_KEYWORDS) {
            if (normalized.contains(keyword)) {
                return LEVEL_MEDIUM;
            }
        }
        return LEVEL_LOW;
    }

    /** 等级中文标签。 */
    @StringRes
    public static int labelRes(int level) {
        switch (level) {
            case LEVEL_EXTREME: return R.string.gas_level_extreme;
            case LEVEL_HIGH: return R.string.gas_level_high;
            case LEVEL_MEDIUM: return R.string.gas_level_medium;
            case LEVEL_LOW:
            default: return R.string.gas_level_low;
        }
    }

    /** 等级徽章背景。 */
    @DrawableRes
    public static int badgeBackground(int level) {
        switch (level) {
            case LEVEL_EXTREME: return R.drawable.bg_badge_danger;
            case LEVEL_HIGH: return R.drawable.bg_badge_danger;
            case LEVEL_MEDIUM: return R.drawable.bg_badge_warning;
            case LEVEL_LOW:
            default: return R.drawable.bg_badge_success;
        }
    }

    /** 等级色条 drawable（事故卡左侧）。 */
    @DrawableRes
    public static int severityBar(int level) {
        switch (level) {
            case LEVEL_EXTREME: return R.drawable.bg_severity_danger;
            case LEVEL_HIGH: return R.drawable.bg_severity_danger;
            case LEVEL_MEDIUM: return R.drawable.bg_severity_warning;
            case LEVEL_LOW:
            default: return R.drawable.bg_severity_success;
        }
    }

    /** 等级文字色。 */
    @ColorRes
    public static int textColor(int level) {
        switch (level) {
            case LEVEL_EXTREME:
            case LEVEL_HIGH: return R.color.dangerText;
            case LEVEL_MEDIUM: return R.color.warningText;
            case LEVEL_LOW:
            default: return R.color.successText;
        }
    }
}
