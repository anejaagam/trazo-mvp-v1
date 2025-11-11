import { CheckCircle2 } from 'lucide-react';
import imgImage3 from "figma:asset/49de8b74079c28c8a94ad91c4a5638d6fc7c566a.png";
import type { SuccessStepProps } from '../types';

type Props = SuccessStepProps;

export default function Step5Success({ formData, onStartOver }: Props) {
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
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-row justify-center w-full py-[40px]">
          <div className="px-[160px] w-full max-w-[1280px]">
            <div className="max-w-[960px] mx-auto">
              <div className="flex flex-col py-[20px]">
                
                {/* Success Icon and Title */}
                <div className="flex flex-col items-center py-[32px] px-[16px]">
                  <div className="mb-[24px]">
                    <CheckCircle2 className="w-[80px] h-[80px] text-[#81b252]" strokeWidth={1.5} />
                  </div>
                  <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[42px] text-[#0d1c0d] text-[36px] text-center mb-[12px]">
                    Registration Complete!
                  </p>
                  <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[28px] text-[#0d1c0d] text-[18px] text-center max-w-[600px]">
                    Thank you for completing your registration. Your account has been successfully created and is ready to use.
                  </p>
                </div>

                {/* Summary Section */}
                <div className="mt-[24px] px-[16px]">
                  <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[32px] text-[#0d1c0d] text-[24px] mb-[20px] text-center">
                    Registration Summary
                  </p>

                  {/* User Details Card */}
                  <div className="bg-white rounded-[12px] p-[24px] mb-[16px] shadow-sm border border-[#d1e8d1]">
                    <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[28px] text-[#0d1c0d] text-[20px] mb-[16px]">
                      User Details
                    </p>
                    <div className="grid grid-cols-2 gap-[16px]">
                      <div>
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Name
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.name || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Email
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Phone Number
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.phoneNumber || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Role
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.role || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Company Details Card */}
                  <div className="bg-white rounded-[12px] p-[24px] mb-[16px] shadow-sm border border-[#d1e8d1]">
                    <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[28px] text-[#0d1c0d] text-[20px] mb-[16px]">
                      Company Details
                    </p>
                    <div className="grid grid-cols-2 gap-[16px]">
                      <div>
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Company Name
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.companyName || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Website
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.companyWebsite || 'Not provided'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Farm Location
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.farmLocation || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact Card */}
                  <div className="bg-white rounded-[12px] p-[24px] mb-[16px] shadow-sm border border-[#d1e8d1]">
                    <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[28px] text-[#0d1c0d] text-[20px] mb-[16px]">
                      Emergency Contact
                    </p>
                    <div className="grid grid-cols-2 gap-[16px]">
                      <div>
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Contact Person
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.emergencyContactPerson || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Contact Email
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.emergencyContactEmail || 'Not provided'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Contact Number
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.emergencyContactNumber || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Farm Details Card */}
                  <div className="bg-white rounded-[12px] p-[24px] shadow-sm border border-[#d1e8d1]">
                    <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[28px] text-[#0d1c0d] text-[20px] mb-[16px]">
                      Farm Details
                    </p>
                    <div className="grid grid-cols-2 gap-[16px]">
                      <div>
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Number of Containers
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.numberOfContainers || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Type of Crop
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.cropType || 'Not provided'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[20px] text-[#4f964f] text-[14px] mb-[4px]">
                          Growing Environment
                        </p>
                        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                          {formData.growingEnvironment || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-[16px] pt-[48px] pb-[20px] px-[16px]">
                  <button
                    onClick={onStartOver}
                    className="bg-white border-2 border-[#81b252] h-[48px] px-[32px] rounded-[8px] min-w-[140px] hover:bg-[#f7fcf7] transition-colors"
                  >
                    <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[24px] text-[#81b252] text-[16px]">
                      Start Over
                    </p>
                  </button>
                  <button
                    className="bg-[#81b252] h-[48px] px-[32px] rounded-[8px] min-w-[140px] hover:bg-[#729945] transition-colors"
                  >
                    <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[24px] text-[#0d1c0d] text-[16px]">
                      Go to Dashboard
                    </p>
                  </button>
                </div>

                {/* Next Steps Info */}
                <div className="bg-[#e8f2e8] rounded-[12px] p-[24px] mx-[16px] mt-[24px]">
                  <p className="font-['Inter:Bold',_sans-serif] font-bold leading-[28px] text-[#0d1c0d] text-[18px] mb-[12px]">
                    What's Next?
                  </p>
                  <ul className="space-y-[8px]">
                    <li className="flex items-start gap-[12px]">
                      <div className="w-[6px] h-[6px] bg-[#81b252] rounded-full mt-[8px] flex-shrink-0" />
                      <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                        You'll receive a confirmation email shortly with your account details
                      </p>
                    </li>
                    <li className="flex items-start gap-[12px]">
                      <div className="w-[6px] h-[6px] bg-[#81b252] rounded-full mt-[8px] flex-shrink-0" />
                      <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                        Access your dashboard to set up your farm's rooms and pods
                      </p>
                    </li>
                    <li className="flex items-start gap-[12px]">
                      <div className="w-[6px] h-[6px] bg-[#81b252] rounded-full mt-[8px] flex-shrink-0" />
                      <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] text-[#0d1c0d] text-[16px]">
                        Start creating recipes and monitoring your farm operations
                      </p>
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
