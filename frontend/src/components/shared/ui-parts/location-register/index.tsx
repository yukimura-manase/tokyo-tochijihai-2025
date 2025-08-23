import { useState } from "react";
import { useAtom } from "jotai";
import { registeredLocationsAtom, mapViewAtom } from "@/stores/map";
import { LocationType, RegisteredLocation } from "@/types/facility";
import { Button } from "@/components/shared/ui-elements/button";
import { Input } from "@/components/shared/ui-elements/input";
import { Textarea } from "@/components/shared/ui-elements/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shared/ui-elements/dialog";

/**
 * 地点登録コンポーネント
 */
export const LocationRegister = () => {
  const [registeredLocations, setRegisteredLocations] = useAtom(
    registeredLocationsAtom
  );
  const [mapView] = useAtom(mapViewAtom);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: LocationType.HOME,
    name: "",
    address: "",
    useCurrentLocation: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // フォームのリセット
  const resetForm = () => {
    setFormData({
      type: LocationType.HOME,
      name: "",
      address: "",
      useCurrentLocation: false,
    });
  };

  // 現在地を取得
  const getCurrentLocation = (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("位置情報がサポートされていません"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  };

  // 地点の保存
  const handleSave = async () => {
    setIsLoading(true);

    try {
      let latitude: number;
      let longitude: number;

      if (formData.useCurrentLocation) {
        // 現在地を使用
        const location = await getCurrentLocation();
        latitude = location.latitude;
        longitude = location.longitude;
      } else {
        // マップの中心座標を使用
        [latitude, longitude] = mapView.center;
      }

      const newLocation: RegisteredLocation = {
        id: `loc-${Date.now()}`,
        userId: "current-user", // TODO: 実際のユーザーIDを使用
        type: formData.type as LocationType,
        name:
          formData.name ||
          (formData.type === LocationType.HOME ? "自宅" : "会社"),
        latitude,
        longitude,
        address: formData.address,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 同じタイプの既存の地点を削除して新しいものを追加
      const updatedLocations = registeredLocations.filter(
        (loc) => loc.type !== formData.type
      );
      updatedLocations.push(newLocation);

      setRegisteredLocations(updatedLocations);

      // ローカルストレージに保存
      localStorage.setItem(
        "registeredLocations",
        JSON.stringify(updatedLocations)
      );

      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error("地点の保存エラー:", error);
      alert("地点の保存に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // 登録済み地点の削除
  const handleDelete = (locationId: string) => {
    const updatedLocations = registeredLocations.filter(
      (loc) => loc.id !== locationId
    );
    setRegisteredLocations(updatedLocations);
    localStorage.setItem(
      "registeredLocations",
      JSON.stringify(updatedLocations)
    );
  };

  // 地点タイプの日本語名を取得
  const getLocationTypeName = (type: LocationType): string => {
    const typeNames = {
      [LocationType.HOME]: "自宅",
      [LocationType.OFFICE]: "会社",
      [LocationType.CURRENT]: "現在地",
      [LocationType.LAST_ONLINE]: "最終オンライン地点",
    };
    return typeNames[type] || "地点";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="absolute top-20 right-4 z-[1001] bg-white rounded-lg shadow-lg p-3 hover:bg-gray-100 transition-colors"
          aria-label="地点を登録"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>地点を登録</DialogTitle>
          <DialogDescription>
            自宅や会社の位置を登録しておくと、最寄りの避難所を素早く確認できます
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* 地点タイプ選択 */}
          <div>
            <label className="block text-sm font-medium mb-2">地点タイプ</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={
                  formData.type === LocationType.HOME ? "default" : "outline"
                }
                onClick={() =>
                  setFormData({ ...formData, type: LocationType.HOME })
                }
                className="flex-1"
              >
                自宅
              </Button>
              <Button
                type="button"
                variant={
                  formData.type === LocationType.OFFICE ? "default" : "outline"
                }
                onClick={() =>
                  setFormData({ ...formData, type: LocationType.OFFICE })
                }
                className="flex-1"
              >
                会社
              </Button>
            </div>
          </div>

          {/* 名前入力 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              名前（オプション）
            </label>
            <Input
              id="name"
              type="text"
              placeholder={
                formData.type === LocationType.HOME ? "自宅" : "会社"
              }
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* 住所入力 */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-2">
              住所（オプション）
            </label>
            <Textarea
              id="address"
              placeholder="東京都新宿区..."
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* 位置選択 */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.useCurrentLocation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    useCurrentLocation: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm">現在地を使用する</span>
            </label>
            {!formData.useCurrentLocation && (
              <p className="text-xs text-gray-600 mt-1">
                マップの中心位置が登録されます
              </p>
            )}
          </div>

          {/* 保存ボタン */}
          <Button onClick={handleSave} disabled={isLoading} className="w-full">
            {isLoading ? "保存中..." : "地点を保存"}
          </Button>
        </div>

        {/* 登録済み地点リスト */}
        {registeredLocations.length > 0 && (
          <div className="mt-8">
            <h3 className="font-medium text-sm mb-3">登録済みの地点</h3>
            <div className="space-y-2">
              {registeredLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{location.name}</div>
                    <div className="text-xs text-gray-600">
                      {getLocationTypeName(location.type)}
                      {location.address && ` - ${location.address}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                    aria-label="削除"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
