"use client";

import { useState } from "react";

import ShipmentStepOne from "@/app/components/shipments/ShipmentStepOne";
import ShipmentStepTwo from "@/app/components/shipments/ShipmentStepTwo";
import ShipmentStepThree from "@/app/components/shipments/ShipmentStepThree";
import ShipmentStepFour from "@/app/components/shipments/ShipmentStepFour";
import ShipmentStepFive from "@/app/components/shipments/ShipmentStepFive";
import ShipmentStepSix from "@/app/components/shipments/ShipmentStepSix";
import ShipmentStepSeven from "@/app/components/shipments/ShipmentStepSeven";

export default function ShipmentsPage() {

  const [step, setStep] = useState(1);

  const [shipment, setShipment] = useState<any>({
    details: {},
    products: [],
    shippingCosts: [],
    importCharges: {},
    otherExpenses: {},
    allocation: {}
  });

  const next = () => setStep((prev) => prev + 1);
  const back = () => setStep((prev) => prev - 1);

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 p-8">

      {/* Progress */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Shipment Wizard
        </h1>

        <p className="text-gray-500">
          Step {step} of 7
        </p>

        <div className="w-full h-2 bg-gray-300 rounded mt-4">
          <div
            className="h-2 bg-green-600 rounded transition-all"
            style={{
              width: `${(step / 7) * 100}%`,
            }}
          />
        </div>

      </div>

      {step === 1 && (
        <ShipmentStepOne
          onNext={(data) => {
            setShipment((prev: any) => ({
              ...prev,
              details: data,
            }));
            next();
          }}
        />
      )}

      {step === 2 && (
        <ShipmentStepTwo
          onBack={back}
          onNext={(data) => {
            setShipment((prev: any) => ({
              ...prev,
              products: data,
            }));
            next();
          }}
        />
      )}

      {step === 3 && (
        <ShipmentStepThree
          onBack={back}
          onNext={(data) => {
            setShipment((prev: any) => ({
              ...prev,
              shippingCosts: data,
            }));
            next();
          }}
        />
      )}

      {step === 4 && (
        <ShipmentStepFour
          productTotal={0}      // Replace with calculated value
          shippingTotal={0}     // Replace with calculated value
          onBack={back}
          onNext={(data) => {
            setShipment((prev: any) => ({
              ...prev,
              importCharges: data,
            }));
            next();
          }}
        />
      )}

      {step === 5 && (
        <ShipmentStepFive
          productTotal={0}
          shippingTotal={0}
          importTotal={0}
          products={shipment.products}
          onBack={back}
          onNext={(data) => {
            setShipment((prev: any) => ({
              ...prev,
              otherExpenses: data,
            }));
            next();
          }}
        />
      )}

      {step === 6 && (
        <ShipmentStepSix
          products={shipment.products}
          shippingTotal={0}
          importTotal={0}
          otherTotal={0}
          onBack={back}
          onNext={(data) => {
            setShipment((prev: any) => ({
              ...prev,
              allocation: data,
            }));
            next();
          }}
        />
      )}

      {step === 7 && (
        <ShipmentStepSeven
          shipmentId=""
          products={shipment.allocation.products || []}
          onBack={back}
          onComplete={() => {

            console.log("FINAL SHIPMENT");

            console.log(shipment);

            alert("Shipment received successfully!");

            setStep(1);

          }}
        />
      )}

    </div>
  );
}