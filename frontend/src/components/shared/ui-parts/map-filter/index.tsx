import { useAtom } from 'jotai';
import { mapSettingsAtom } from '@/stores/map';
import { FacilityType } from '@/types/facility';

interface FilterOption {
  type: keyof typeof mapSettingsAtom;
  label: string;
  color: string;
}

/**
 * マップフィルターコンポーネント
 */
export const MapFilter = () => {
  const [settings, setSettings] = useAtom(mapSettingsAtom);

  const filterOptions: FilterOption[] = [
    { 
      type: 'showHydrants', 
      label: '消火栓',
      color: 'bg-red-500'
    },
    { 
      type: 'showWaterSupplies', 
      label: '給水拠点',
      color: 'bg-blue-500'
    },
    { 
      type: 'showWiFiSpots', 
      label: '無料WiFi',
      color: 'bg-green-500'
    },
    { 
      type: 'showEvacuationSites', 
      label: '避難場所',
      color: 'bg-orange-500'
    },
    { 
      type: 'showShelters', 
      label: '一時滞在施設',
      color: 'bg-purple-500'
    },
  ];

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-xs">
      <h3 className="font-bold text-sm mb-3">表示する施設</h3>
      <div className="space-y-2">
        {filterOptions.map((option) => (
          <label
            key={option.type}
            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
          >
            <input
              type="checkbox"
              checked={settings[option.type]}
              onChange={() => handleToggle(option.type)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className={`w-3 h-3 rounded-full ${option.color}`} />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t">
        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
          <input
            type="checkbox"
            checked={settings.showUserLocations}
            onChange={() => handleToggle('showUserLocations')}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm">登録地点を表示</span>
        </label>
      </div>
    </div>
  );
};