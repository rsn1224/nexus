//! CPU トポロジー検出サービス
//! 仕様: docs/specs/game-enhancement-spec.md Section 7.2

mod detection;
mod windows;

pub use detection::*;

#[cfg(test)]
mod tests {
    use super::*;
    use detection::{get_cpu_vendor_brand, num_cpus_logical, num_cpus_physical};

    #[test]
    fn test_detect_topology_returns_valid_structure() {
        let result = detect_topology();
        assert!(result.is_ok(), "CPU トポロジー検出に失敗");
        let topo = result.unwrap();

        assert!(topo.logical_cores > 0, "論理コア数が 0");
        assert!(topo.physical_cores > 0, "物理コア数が 0");
        assert!(
            topo.logical_cores >= topo.physical_cores,
            "論理コア < 物理コア"
        );
        assert!(!topo.p_cores.is_empty(), "P-Core リストが空");

        for &core in &topo.p_cores {
            assert!(
                core < topo.logical_cores,
                "P-Core インデックス超過: {}",
                core
            );
        }
        for &core in &topo.e_cores {
            assert!(
                core < topo.logical_cores,
                "E-Core インデックス超過: {}",
                core
            );
        }
    }

    #[test]
    fn test_detect_topology_vendor_not_empty() {
        let result = detect_topology().unwrap();
        assert!(!result.vendor_id.is_empty(), "vendor_id が空");
        assert!(!result.brand.is_empty(), "brand が空");
    }

    #[test]
    fn test_num_cpus_logical_positive() {
        assert!(num_cpus_logical() > 0);
    }

    #[test]
    fn test_num_cpus_physical_positive() {
        assert!(num_cpus_physical() > 0);
    }

    #[test]
    fn test_get_cpu_vendor_brand_non_empty() {
        let (vendor, brand) = get_cpu_vendor_brand();
        assert!(!vendor.is_empty());
        assert!(!brand.is_empty());
    }

    #[cfg(windows)]
    #[test]
    fn test_detect_amd_ccds_small_cpu() {
        let groups = windows::detect_amd_ccds(8);
        assert_eq!(groups.len(), 1);
        assert_eq!(groups[0].len(), 8);
    }

    #[cfg(windows)]
    #[test]
    fn test_detect_amd_ccds_large_cpu() {
        let groups = windows::detect_amd_ccds(16);
        assert_eq!(groups.len(), 2);
        assert_eq!(groups[0].len(), 8);
        assert_eq!(groups[1].len(), 8);
    }
}
