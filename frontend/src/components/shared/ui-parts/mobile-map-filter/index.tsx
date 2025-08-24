import { useAtom } from "jotai";
import { createPortal } from "react-dom";
import { mapSettingsAtom } from "@/stores/map";
import { MapSettings } from "@/types/facility";
import {
  EvacuationSiteOffIcon,
  EvacuationSiteOnIcon,
  EmergencyShelterOffIcon,
  EmergencyShelterOnIcon,
  WifiOffIcon,
  WifiOnIcon,
  WaterSupplyOffIcon,
  WaterSupplyOnIcon,
  FireExtinguisherOffIcon,
  FireExtinguisherOnIcon,
} from "@/components/shared/ui-elements/icons";

interface FilterOption {
  type: keyof MapSettings;
  label: string;
  category: string; // filter-buttonのcategory名
  color: string;
  OffIcon: React.ComponentType;
  OnIcon: React.ComponentType;
}

/**
 * Mobile版のマップフィルターコンポーネント
 * SearchBoxの下に横一列で配置
 */
export const MobileMapFilter = () => {
  const [settings, setSettings] = useAtom(mapSettingsAtom);

  const filterOptions: FilterOption[] = [
    {
      type: "showEvacuationSites",
      label: "避難場所",
      category: "避難所",
      color: "#12A364",
      OffIcon: EvacuationSiteOffIcon,
      OnIcon: EvacuationSiteOnIcon,
    },
    {
      type: "showShelters",
      label: "一時滞在施設",
      category: "緊急避難",
      color: "#E59024",
      OffIcon: EmergencyShelterOffIcon,
      OnIcon: EmergencyShelterOnIcon,
    },
    {
      type: "showWiFiSpots",
      label: "無料WiFi",
      category: "Wi-Fi",
      color: "#8964CB",
      OffIcon: WifiOffIcon,
      OnIcon: WifiOnIcon,
    },
    {
      type: "showWaterSupplies",
      label: "給水拠点",
      category: "給水所",
      color: "#32ACCA",
      OffIcon: WaterSupplyOffIcon,
      OnIcon: WaterSupplyOnIcon,
    },
    // {
    //   type: "showHydrants",
    //   label: "消火栓",
    //   category: "消火器",
    //   color: "#D54F4F",
    //   OffIcon: FireExtinguisherOffIcon,
    //   OnIcon: FireExtinguisherOnIcon,
    // },
  ];

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  // ポータルでbodyに直接レンダリング
  return createPortal(
    <div
      className="fixed z-[9999]"
      style={{
        position: "fixed",
        top: "80px", // SearchBoxの下に配置
        left: "0",
        right: "0",
        zIndex: 9999,
        padding: "0 16px",
      }}
    >
      {/* 横スクロール可能なフィルターボタン群 */}
      <div className="flex space-x-3 overflow-x-auto pb-2">
        <div
          className="flex space-x-3 min-w-max"
          style={{
            overflow: "scroll",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {filterOptions.map((option) => {
            const isActive = settings[option.type];
            const IconComponent = isActive ? option.OnIcon : option.OffIcon;

            return (
              <button
                key={option.type}
                onClick={() => handleToggle(option.type)}
                style={{
                  // display: "flex",
                  // alignItems: "center",
                  // justifyContent: "center",
                  width: "120px",
                  height: "auto", // 適切な高さに調整
                }}
                title={option.label}
              >
                <IconComponent />
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};
