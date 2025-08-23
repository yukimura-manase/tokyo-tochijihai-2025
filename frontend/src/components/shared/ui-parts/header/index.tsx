/**
 * ページ共通のHeader
 */
export const Header = () => {
  return (
    <header className="border-[#0CC2A3] text-gray-500 relative z-[999]">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer">
          <h1 className="text-2xl font-bold text-center">
            東京都 災害避難 Guide
          </h1>
        </div>
      </div>
    </header>
  );
};
