import { FiFileText } from "react-icons/fi";

export function FeatureCards() {
  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      {/* Common Sections Card */}
      <div className="w-full h-20 px-4 pt-4 pb-[1.58px] bg-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-[1.58px] outline-offset-[-1.58px] outline-black flex flex-col">
        <div className="w-full h-11 flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <FiFileText className="w-5 h-5 text-violet-500" />
          </div>
          <div className="flex-1 h-11 flex flex-col gap-1">
            <div className="h-5 text-neutral-950 text-sm font-medium font-['Satoshi'] leading-5">
              Common Sections
            </div>
            <div className="h-4 text-gray-600 text-xs font-normal font-['Satoshi'] leading-4">
              Explore structure options without generating
            </div>
          </div>
        </div>
      </div>

      {/* Learning-Focused Card */}
      <div className="w-full h-20 px-4 pt-4 pb-[1.58px] bg-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-[1.58px] outline-offset-[-1.58px] outline-black flex flex-col">
        <div className="w-full h-11 flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <FiFileText className="w-5 h-5 text-violet-500" />
          </div>
          <div className="flex-1 h-11 flex flex-col gap-1">
            <div className="h-5 text-neutral-950 text-sm font-medium font-['Satoshi'] leading-5">
              Learning-Focused
            </div>
            <div className="h-4 text-gray-600 text-xs font-normal font-['Satoshi'] leading-4">
              Every assignment includes learning objectives
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
