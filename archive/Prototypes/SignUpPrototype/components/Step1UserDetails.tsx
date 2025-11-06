import { useState } from 'react';
import svgPaths from "../imports/svg-jaupk48cp4";
import imgImage3 from "figma:asset/49de8b74079c28c8a94ad91c4a5638d6fc7c566a.png";
import { ROLE_OPTIONS } from '../types';
import type { StepProps, FormData } from '../types';

type Props = StepProps<Pick<FormData, 'name' | 'email' | 'phoneNumber' | 'role'>>;

export default function Step1UserDetails({ formData, updateFormData, onNext }: Props) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

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
                  <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] text-[#0d1c0d] text-[16px] mb-[12px]">Step 1 of 4</p>
                  <div className="bg-[#d1e8d1] rounded-[4px] w-full">
                    <div className="bg-[#17cf17] h-[8px] rounded-[4px] w-[232px]" />
                  </div>
                </div>

                {/* Title */}
                <div className="py-[20px] px-[16px]">
                  <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[35px] text-[#0d1c0d] text-[28px] text-center">User Details</p>
                </div>

                {/* Name Field */}
                <div className="px-[16px] py-[12px] max-w-[480px]">
                  <div className="mb-[8px]">
                    <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] text-[#0d1c0d] text-[16px]">Name</p>
                  </div>
                  <div className="flex items-start rounded-[8px]">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      placeholder="Name"
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

                {/* Email Field */}
                <div className="px-[16px] py-[12px] max-w-[480px]">
                  <div className="mb-[8px]">
                    <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] text-[#0d1c0d] text-[16px]">Email</p>
                  </div>
                  <div className="flex items-start rounded-[8px]">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="Email"
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

                {/* Phone Number Field */}
                <div className="px-[16px] py-[12px] max-w-[480px]">
                  <div className="mb-[8px]">
                    <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] text-[#0d1c0d] text-[16px]">Phone Number</p>
                  </div>
                  <div className="flex items-start rounded-[8px]">
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                      placeholder="Phone Number"
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

                {/* Role Dropdown */}
                <div className="px-[16px] py-[16px] max-w-[480px]">
                  <div className="relative">
                    <button
                      onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                      className="w-full bg-[#e8f2e8] h-[56px] px-[11px] rounded-[8px] flex items-center justify-between"
                    >
                      <span className="font-['Playfair_Display:Medium',_sans-serif] font-medium text-[19px] text-[#0d1c0d]">
                        {formData.role || 'Select Role'}
                      </span>
                      <svg className="size-[35px]" fill="none" viewBox="0 0 35 35">
                        <path d={svgPaths.pb3b0100} fill="#1D1B20" />
                      </svg>
                    </button>
                    
                    {showRoleDropdown && (
                      <div className="absolute top-[60px] left-0 w-full bg-white rounded-[8px] shadow-lg z-10 overflow-hidden">
                        {ROLE_OPTIONS.map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              updateFormData('role', role);
                              setShowRoleDropdown(false);
                            }}
                            className="w-full px-[16px] py-[12px] text-left hover:bg-[#e8f2e8] font-['Inter:Regular',_sans-serif] text-[16px] text-[#0d1c0d]"
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Button */}
                <div className="flex justify-center pt-[48px] pb-[12px] px-[16px]">
                  <button
                    onClick={onNext}
                    className="bg-[#81b252] h-[48px] px-[20px] rounded-[8px] min-w-[84px]"
                  >
                    <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[24px] text-[#0d1c0d] text-[16px]">Next</p>
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
