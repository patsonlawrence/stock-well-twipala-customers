"use client";

import { useState } from "react";

interface ShipmentData {
  shipmentName: string;
  supplier: string;
  invoiceNumber: string;
  purchaseDate: string;
  arrivalDate: string;
  currency: string;
  exchangeRate: number;
  portOfEntry: string;
  notes: string;
  status: string;
}

interface Props {
  onNext: (data: ShipmentData) => void;
}

export default function ShipmentStepOne({ onNext }: Props) {

  const [formData, setFormData] = useState<ShipmentData>({
  shipmentName: "",
  supplier: "",
  invoiceNumber: "",
  purchaseDate: "",
  arrivalDate: "",
  currency: "USD",
  exchangeRate: 1,
  portOfEntry: "",
  notes: "",
  status: "Draft",
});


  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "exchangeRate"
          ? Number(value)
          : value,
    }));
  };


  const handleSubmit = () => {

    if (
      !formData.shipmentName ||
      !formData.supplier ||
      !formData.invoiceNumber
    ) {
      alert("Please fill required fields");
      return;
    }

    onNext(formData);
  };


  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">

      <h2 className="text-2xl font-bold mb-6">
        Step 1: Shipment Details
      </h2>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


        <div>
          <label className="block mb-1">
            Shipment Name *
          </label>

          <input
            name="shipmentName"
            value={formData.shipmentName}
            onChange={handleChange}
            placeholder="Example: August Rice Import"
            className="w-full p-3 border rounded-lg dark:bg-gray-700"
          />
        </div>



        <div>
          <label className="block mb-1">
            Supplier *
          </label>

          <input
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            placeholder="Supplier name"
            className="w-full p-3 border rounded-lg dark:bg-gray-700"
          />
        </div>



        <div>
          <label className="block mb-1">
            Invoice Number *
          </label>

          <input
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            placeholder="INV-001"
            className="w-full p-3 border rounded-lg dark:bg-gray-700"
          />
        </div>



        <div>
          <label className="block mb-1">
            Currency
          </label>

          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg dark:bg-gray-700"
          >
            <option value="USD">
              USD
            </option>

            <option value="UGX">
              UGX
            </option>

            <option value="CNY">
              CNY
            </option>

            <option value="EUR">
              EUR
            </option>

          </select>

        </div>




        <div>
          <label className="block mb-1">
            Purchase Date
          </label>

          <input
            type="date"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg dark:bg-gray-700"
          />

        </div>



        <div>
          <label className="block mb-1">
            Expected Arrival Date
          </label>

          <input
            type="date"
            name="arrivalDate"
            value={formData.arrivalDate}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg dark:bg-gray-700"
          />

        </div>




        <div>
          <label className="block mb-1">
            Exchange Rate
          </label>

          <input
            type="number"
            name="exchangeRate"
            value={formData.exchangeRate}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg dark:bg-gray-700"
          />

        </div>



        <div>
          <label className="block mb-1">
            Port Of Entry
          </label>

          <input
            name="portOfEntry"
            value={formData.portOfEntry}
            onChange={handleChange}
            placeholder="Example: Mombasa Port"
            className="w-full p-3 border rounded-lg dark:bg-gray-700"
          />

        </div>


      </div>



      <div className="mt-5">

        <label className="block mb-1">
          Notes
        </label>

        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="w-full p-3 border rounded-lg dark:bg-gray-700"
        />

      </div>




      <div className="flex justify-end mt-6">

        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Save & Continue →
        </button>

      </div>


    </div>
  );
}