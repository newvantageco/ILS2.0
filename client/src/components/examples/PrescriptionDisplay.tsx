import { PrescriptionDisplay } from '../PrescriptionDisplay'

export default function PrescriptionDisplayExample() {
  const prescription = {
    od: {
      sphere: "-2.50",
      cylinder: "-0.75",
      axis: "180",
      add: "+2.00",
    },
    os: {
      sphere: "-2.25",
      cylinder: "-1.00",
      axis: "175",
      add: "+2.00",
    },
    pd: "63",
  };

  return (
    <div className="max-w-2xl">
      <PrescriptionDisplay prescription={prescription} />
    </div>
  )
}
