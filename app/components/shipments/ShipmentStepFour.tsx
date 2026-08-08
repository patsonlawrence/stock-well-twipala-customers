"use client";

import { useState } from "react";


interface ImportCharge {
  name: string;
  amount: number;
}


interface TaxSettings {
  importDuty: number;
  vat: number;
  otherTax: number;
}


interface Props {
  productTotal: number;
  shippingTotal: number;

  onNext: (
    data: {
      charges: ImportCharge[];
      taxes: TaxSettings;
      totalTax: number;
      totalImportCost: number;
    }
  ) => void;

  onBack: () => void;
}



export default function ShipmentStepFour({
  productTotal,
  shippingTotal,
  onNext,
  onBack,
}: Props) {


const [charges,setCharges] = useState<ImportCharge[]>([
 {
  name:"Clearing Agent",
  amount:0
 },
 {
  name:"Documentation",
  amount:0
 },
 {
  name:"Inspection",
  amount:0
 },
 {
  name:"Port Handling",
  amount:0
 }
]);



const [taxes,setTaxes] = useState<TaxSettings>({
 importDuty:0,
 vat:0,
 otherTax:0
});





const taxableAmount =
 productTotal + shippingTotal;





const updateCharge = (
 index:number,
 amount:number
)=>{

setCharges(prev=>
 prev.map((item,i)=>
 i===index
 ?
 {
   ...item,
   amount
 }
 :
 item
 )
);

};





const updateTax = (
 field:keyof TaxSettings,
 value:number
)=>{

setTaxes(prev=>({
 ...prev,
 [field]:value
}));

};






const addCharge = ()=>{

setCharges(prev=>[
 ...prev,
 {
  name:"",
  amount:0
 }
]);

};





const fixedCharges =
 charges.reduce(
  (sum,item)=>sum+item.amount,
  0
 );





const importDutyAmount = taxes.importDuty;

const vatAmount = taxes.vat;

const otherTaxAmount = taxes.otherTax;




const totalTax =
 importDutyAmount +
 vatAmount +
 otherTaxAmount;





const totalImportCost =
 fixedCharges +
 totalTax;







return (

<div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">


<h2 className="text-2xl font-bold mb-6">
Step 4: Customs & Taxes Paid
</h2>





<h3 className="font-semibold mb-3">
Import Charges
</h3>




<table className="w-full mb-5">

<tbody>


{
charges.map((charge,index)=>(

<tr
key={index}
className="border-b"
>


<td className="p-3">


<input

value={charge.name}

onChange={(e)=>
setCharges(prev=>
prev.map((item,i)=>
i===index
?
{
...item,
name:e.target.value
}
:
item
)
)
}

className="w-full p-2 border rounded dark:bg-gray-700"

/>

</td>



<td className="p-3">

<input

type="number"

value={charge.amount}

onChange={(e)=>
updateCharge(
index,
Number(e.target.value)
)
}

className="w-full p-2 border rounded dark:bg-gray-700"

/>

</td>


</tr>

))

}


</tbody>

</table>




<button

onClick={addCharge}

className="px-4 py-2 bg-blue-500 text-white rounded"

>
+ Add Charge
</button>







<hr className="my-6"/>





<h3 className="font-semibold mb-3">
Tax Amounts (Ush)
</h3>




<div className="grid md:grid-cols-3 gap-4">


<div>

<label>
Import Duty Amount
</label>

<input
type="number"
value={taxes.importDuty}
onChange={(e)=>
 updateTax(
  "importDuty",
  Number(e.target.value)
 )
}
/>

</div>





<div>

<label>
VAT Amount
</label>

<input
type="number"
value={taxes.vat}
onChange={(e)=>
 updateTax(
  "vat",
  Number(e.target.value)
 )
}
/>

</div>





<div>

<label>
Other Tax Amount
</label>

<input
type="number"
value={taxes.otherTax}
onChange={(e)=>
 updateTax(
  "otherTax",
  Number(e.target.value)
 )
}
/>

</div>



</div>







<div className="mt-6 bg-green-50 dark:bg-gray-700 rounded-lg p-4">


<p>
Taxable Amount:
<strong>
 Ush {taxableAmount.toLocaleString("en-UG")}
</strong>
</p>


<p>
Import Duty:
<strong>
 Ush {importDutyAmount.toLocaleString("en-UG")}
</strong>
</p>


<p>
VAT:
<strong>
 Ush {vatAmount.toLocaleString("en-UG")}
</strong>
</p>


<p className="text-xl font-bold mt-3">

Total Import Cost:

Ush {totalImportCost.toLocaleString("en-UG")}

</p>


</div>






<div className="flex justify-between mt-8">


<button

onClick={onBack}

className="px-6 py-3 bg-gray-200 rounded"

>
← Back
</button>





<button

onClick={()=>onNext({
 charges,
 taxes,
 totalTax,
 totalImportCost
})}

className="px-6 py-3 bg-green-600 text-white rounded"

>

Save & Continue →

</button>



</div>




</div>

);

}