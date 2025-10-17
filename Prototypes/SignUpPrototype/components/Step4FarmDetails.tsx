import svgPaths from "../imports/svg-gwqm1awcyy";
import imgImage3 from "figma:asset/49de8b74079c28c8a94ad91c4a5638d6fc7c566a.png";
import { CROP_TYPES, GROWING_ENVIRONMENTS } from '../types';
import type { StepProps, FormData } from '../types';

type Props = StepProps<Pick<FormData, 'numberOfContainers' | 'cropType' | 'growingEnvironment'>>;

export default function Step4FarmDetails({ formData, updateFormData, onNext }: Props) {
  return (
    <div className="bg-[#f7fcf7] min-h-[800px] w-full">
      <div className="flex flex-col items-start w-full">
        {/* Header */}
        <div className="bg-[#082517] h-[64px] w-full">
          <div className="flex h-[64px] items-center justify-between px-[15px] py-[12px] w-full">
            {/* Logo */}
            <div className="flex gap-[10px] items-center">
              <div className="h-[40px] w-[37px]">
                <img alt="" className="size-full object-cover" src={imgImage3} />
              </div>
              <div className="font-['Playfair_Display:SemiBold',_sans-serif] font-semibold text-[#f5f5e7] text-[36px] tracking-[2.88px]">
                <p className="leading-[34px]">TRAZO</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-[11px] items-start justify-end">
              <div className="flex gap-[36px] items-center pr-[23px]">
                <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[21px] text-[#f5f5e7] text-[14px]">Dashboard</p>
                <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[21px] text-[#f5f5e7] text-[14px]">Rooms</p>
                <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[21px] text-[#f5f5e7] text-[14px]">Pods</p>
                <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[21px] text-[#f5f5e7] text-[14px]">Recipes</p>
                <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[21px] text-[#f5f5e7] text-[14px]">Alarms</p>
                <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[21px] text-[#f5f5e7] text-[14px]">Tasks</p>
              </div>
              
              {/* Icons */}
              <div className="size-[40px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
                  <path d={svgPaths.p36e51980} fill="#F5F5E7" />
                </svg>
              </div>
              <div className="size-[40px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
                  <path d={svgPaths.p3f376980} fill="#F5F5E7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-row justify-center w-full py-[20px]">
          <div className="px-[160px] w-full max-w-[1280px]">
            <div className="max-w-[960px] mx-auto">
              <div className="flex flex-col py-[20px]">
                
                {/* Progress */}
                <div className="p-[16px]">
                  <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] text-[#0d1c0d] text-[16px] mb-[12px]">Step 4 of 4</p>
                  <div className="bg-[#d1e8d1] rounded-[4px] w-full">
                    <div className="bg-[#17cf17] h-[8px] rounded-[4px] w-[928px]" />
                  </div>
                </div>

                {/* Title */}
                <div className="py-[20px] px-[16px] pb-[12px]">
                  <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[35px] text-[#0d1c0d] text-[28px] text-center">Farm Details</p>
                </div>

                {/* Number of Containers Field */}
                <div className="px-[16px] py-[12px] max-w-[480px]">
                  <div className="mb-[8px]">
                    <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] text-[#0d1c0d] text-[16px]">Number of Containers</p>
                  </div>
                  <div className="flex items-start rounded-[8px]">
                    <input
                      type="number"
                      value={formData.numberOfContainers}
                      onChange={(e) => updateFormData('numberOfContainers', e.target.value)}
                      placeholder="Number  of Containers"
                      className="flex-1 bg-[#e8f2e8] h-[56px] px-[16px] py-[16px] rounded-l-[8px] font-['Inter:Regular',_sans-serif] text-[16px] text-[#4f964f] placeholder:text-[#4f964f] border-none outline-none"
                    />
                    <div className="bg-[#e8f2e8] h-[56px] flex items-center justify-center pr-[16px] rounded-r-[8px]">
                      <div className="size-[24px]">
                        <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                          <path clipRule="evenodd" d={svgPaths.p3bb75200} fill="#4F964F" fillRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="px-[16px] pt-[4px] pb-[12px]">
                  <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                    Specify the total number of containers you manage. This information is crucial for resource allocation and planning.
                  </p>
                </div>

                {/* Type of Crop Section */}
                <div className="px-[16px] pt-[16px] pb-[8px]">
                  <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[23px] text-[#0d1c0d] text-[18px]">Type of Crop</p>
                </div>

                {/* Type of Crop Buttons */}
                <div className="px-[16px] py-[16px]">
                  <div className="flex flex-wrap gap-[12px] items-start">
                    {CROP_TYPES.map((cropType) => (
                      <button
                        key={cropType}
                        onClick={() => updateFormData('cropType', cropType)}
                        className={`h-[44px] px-[17px] py-px rounded-[8px] border border-[#d1e8d1] border-solid ${
                          formData.cropType === cropType ? 'bg-[#81b252] border-[#81b252]' : 'bg-white'
                        }`}
                      >
                        <p className={`font-['Inter:Medium',_sans-serif] font-medium leading-[21px] text-[14px] ${
                          formData.cropType === cropType ? 'text-white' : 'text-[#0d1c0d]'
                        }`}>
                          {cropType}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="px-[16px] pt-[4px] pb-[12px]">
                  <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                    Select the primary type of crop you cultivate. This helps us customize our tools and recommendations for your specific needs.
                  </p>
                </div>

                {/* Growing Environment Section */}
                <div className="px-[16px] pt-[16px] pb-[8px]">
                  <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[23px] text-[#0d1c0d] text-[18px]">Growing Environment</p>
                </div>

                {/* Growing Environment Buttons */}
                <div className="px-[16px] py-[16px]">
                  <div className="flex flex-wrap gap-[12px] items-start">
                    {GROWING_ENVIRONMENTS.map((environment) => (
                      <button
                        key={environment}
                        onClick={() => updateFormData('growingEnvironment', environment)}
                        className={`h-[44px] px-[17px] py-px rounded-[8px] border border-[#d1e8d1] border-solid ${
                          formData.growingEnvironment === environment ? 'bg-[#81b252] border-[#81b252]' : 'bg-white'
                        }`}
                      >
                        <p className={`font-['Inter:Medium',_sans-serif] font-medium leading-[21px] text-[14px] ${
                          formData.growingEnvironment === environment ? 'text-white' : 'text-[#0d1c0d]'
                        }`}>
                          {environment}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="px-[16px] pt-[4px] pb-[12px]">
                  <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                    Indicate whether your farm operates indoors or outdoors. This affects the types of environmental controls and monitoring systems you may require.
                  </p>
                </div>

                {/* Finish Button */}
                <div className="flex justify-center pt-[12px] px-[16px]">
                  <button
                    onClick={onNext}
                    className="bg-[#81b252] h-[48px] px-[20px] rounded-[8px] min-w-[84px]"
                  >
                    <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[24px] text-[#0d1c0d] text-[16px]">Finish</p>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
