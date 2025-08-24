import HouseBtn from "../../ui-elements/mobile-btn/HouseBtn";
import NowPositionBtn from "../../ui-elements/mobile-btn/NowPositionBtn";
import OfficeBtn from "../../ui-elements/mobile-btn/OfficeBtn";

/** 現在地/自宅/職場ボタンのエリア */
export const MobileBtnArea = () => {
  return (
    <div className="absolute bottom-4 right-4 z-[1001] flex flex-col">
      <NowPositionBtn />
      <HouseBtn />
      <OfficeBtn />
    </div>
  );
};
