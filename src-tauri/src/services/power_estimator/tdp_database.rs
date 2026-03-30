//! TDP データベース（主要 CPU/GPU の定格 TDP）
//! 完全なリストは不要。パターンマッチで近似値を返す。

pub(super) fn estimate_cpu_tdp(cpu_name: &str) -> u32 {
    let name = cpu_name.to_lowercase();
    // Intel 14th Gen
    if name.contains("14900") || name.contains("14700") {
        return 253;
    }
    if name.contains("14600") || name.contains("14400") {
        return 154;
    }
    // Intel 13th Gen
    if name.contains("13900") || name.contains("13700") {
        return 253;
    }
    if name.contains("13600") || name.contains("13400") {
        return 154;
    }
    // Intel 12th Gen
    if name.contains("12900") || name.contains("12700") {
        return 241;
    }
    if name.contains("12600") || name.contains("12400") {
        return 150;
    }
    // AMD Ryzen 9000
    if name.contains("9950x") || name.contains("9900x") {
        return 170;
    }
    if name.contains("9700x") || name.contains("9600x") {
        return 65;
    }
    // AMD Ryzen 7000
    if name.contains("7950x") || name.contains("7900x") {
        return 170;
    }
    if name.contains("7800x3d") || name.contains("7700x") {
        return 105;
    }
    if name.contains("7600x") || name.contains("7600") {
        return 105;
    }
    // AMD Ryzen 5000
    if name.contains("5950x") || name.contains("5900x") {
        return 140;
    }
    if name.contains("5800x") || name.contains("5700x") {
        return 105;
    }
    if name.contains("5600x") || name.contains("5600") {
        return 65;
    }
    // デフォルト
    125
}

pub(super) fn estimate_gpu_tdp(gpu_name: &str) -> u32 {
    let name = gpu_name.to_lowercase();
    // NVIDIA RTX 50 Series
    if name.contains("5090") {
        return 600;
    }
    if name.contains("5080") {
        return 400;
    }
    if name.contains("5070 ti") {
        return 350;
    }
    if name.contains("5070") {
        return 285;
    }
    // NVIDIA RTX 40 Series
    if name.contains("4090") {
        return 450;
    }
    if name.contains("4080") {
        return 320;
    }
    if name.contains("4070 ti super") {
        return 285;
    }
    if name.contains("4070 ti") {
        return 285;
    }
    if name.contains("4070 super") {
        return 220;
    }
    if name.contains("4070") {
        return 200;
    }
    if name.contains("4060 ti") {
        return 165;
    }
    if name.contains("4060") {
        return 115;
    }
    // NVIDIA RTX 30 Series
    if name.contains("3090") {
        return 350;
    }
    if name.contains("3080") {
        return 320;
    }
    if name.contains("3070") {
        return 220;
    }
    if name.contains("3060") {
        return 170;
    }
    // AMD RX 7000 Series
    if name.contains("7900 xtx") {
        return 355;
    }
    if name.contains("7900 xt") {
        return 315;
    }
    if name.contains("7800 xt") {
        return 263;
    }
    if name.contains("7700 xt") {
        return 245;
    }
    if name.contains("7600") {
        return 150;
    }
    // AMD RX 6000 Series
    if name.contains("6950 xt") {
        return 335;
    }
    if name.contains("6900 xt") {
        return 300;
    }
    if name.contains("6800") {
        return 250;
    }
    if name.contains("6700") {
        return 220;
    }
    if name.contains("6600") {
        return 132;
    }
    // デフォルト
    200
}
