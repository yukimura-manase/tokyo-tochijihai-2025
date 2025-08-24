import { useState } from "react";
import { useAtom } from "jotai";
import { mapViewAtom, facilitiesAtom } from "@/stores/map";

/**
 * Mobile版用のSearchBoxコンポーネント
 */
export const SearchBox = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [facilities] = useAtom(facilitiesAtom);
  const [, setMapView] = useAtom(mapViewAtom);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 検索結果をフィルタリング
  const filteredResults = searchQuery.trim()
    ? facilities
        .filter(
          (facility) =>
            facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            facility.address?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5) // 最大5件まで表示
    : [];

  // 検索結果をクリックしたときの処理
  const handleResultClick = (facility: (typeof facilities)[0]) => {
    setMapView({
      center: [facility.latitude, facility.longitude],
      zoom: 16,
    });
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[1001]">
      <div className="relative">
        {/* 検索入力フィールド */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="flex items-center px-4 py-3">
            <svg
              className="w-5 h-5 text-gray-400 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="施設名や住所で検索..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(e.target.value.trim().length > 0);
              }}
              className="flex-1 outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 検索結果 */}
        {isSearchOpen && filteredResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredResults.map((facility) => (
              <button
                key={facility.id}
                onClick={() => handleResultClick(facility)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900">
                  {facility.name}
                </div>
                {facility.address && (
                  <div className="text-xs text-gray-500 mt-1">
                    {facility.address}
                  </div>
                )}
                <div className="text-xs text-blue-600 mt-1">
                  {facility.type === "hydrant" && "消火栓"}
                  {facility.type === "water_supply" && "給水拠点"}
                  {facility.type === "wifi" && "無料WiFi"}
                  {facility.type === "evacuation" && "避難場所"}
                  {facility.type === "shelter" && "一時滞在施設"}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 検索結果が見つからない場合 */}
        {isSearchOpen && searchQuery.trim() && filteredResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
            検索結果が見つかりませんでした
          </div>
        )}
      </div>
    </div>
  );
};
