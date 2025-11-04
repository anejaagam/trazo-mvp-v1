import { useState } from 'react';
import Step1UserDetails from './components/Step1UserDetails';
import Step2CompanyDetails from './components/Step2CompanyDetails';
import Step3EmergencyContact from './components/Step3EmergencyContact';
import Step4FarmDetails from './components/Step4FarmDetails';
import Step5Success from './components/Step5Success';
import { FormData } from './types';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phoneNumber: '',
    role: '',
    companyName: '',
    companyWebsite: '',
    farmLocation: '',
    emergencyContactPerson: '',
    emergencyContactEmail: '',
    emergencyContactNumber: '',
    numberOfContainers: '',
    cropType: '',
    growingEnvironment: '',
  });

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full">
      {currentStep === 1 && (
        <Step1UserDetails
          formData={formData}
          updateFormData={updateFormData}
          onNext={nextStep}
        />
      )}
      {currentStep === 2 && (
        <Step2CompanyDetails
          formData={formData}
          updateFormData={updateFormData}
          onNext={nextStep}
        />
      )}
      {currentStep === 3 && (
        <Step3EmergencyContact
          formData={formData}
          updateFormData={updateFormData}
          onNext={nextStep}
        />
      )}
      {currentStep === 4 && (
        <Step4FarmDetails
          formData={formData}
          updateFormData={updateFormData}
          onNext={nextStep}
        />
      )}
      {currentStep === 5 && (
        <Step5Success
          formData={formData}
          onStartOver={() => setCurrentStep(1)}
        />
      )}
    </div>
  );
}
