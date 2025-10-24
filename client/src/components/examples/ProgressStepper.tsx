import { ProgressStepper } from '../ProgressStepper'

export default function ProgressStepperExample() {
  const steps = [
    { label: "Patient Info", description: "Basic details" },
    { label: "Prescription", description: "Rx values" },
    { label: "Lens & Frame", description: "Product selection" },
    { label: "Review", description: "Confirm order" },
  ];

  return (
    <div className="max-w-4xl p-8">
      <ProgressStepper steps={steps} currentStep={1} />
    </div>
  )
}
