"use client";

import { useState } from "react";


interface ShippingCost {
  name: string;
  amount: number;
}


interface Props {
  onNext: (costs: ShippingCost[]) => void;
  onBack: () => void;
}



export default function ShipmentStepThree({
  onNext,
  onBack,
}: Props) {


  const [costs, setCosts] = useState<ShippingCost[]>([
    {
      name: "Sea Freight",
      amount: 0,
    },
    {
      name: "Air Freight",
      amount: 0,
    },
    {
      name: "Inland Transport",
      amount: 0,
    },
    {
      name: "Insurance",
      amount: 0,
    },
    {
      name: "Fuel Surcharge",
      amount: 0,
    },
    {
      name: "Port Charges",
      amount: 0,
    },
  ]);



  const updateCost = (
    index:number,
    value:number
  )=>{

    setCosts(prev =>
      prev.map((item,i)=>
        i===index
        ? {
            ...item,
            amount:value
          }
        : item
      )
    );

  };




  const addCost = ()=>{

    setCosts(prev=>[
      ...prev,
      {
        name:"",
        amount:0
      }
    ]);

  };




  const updateName = (
    index:number,
    name:string
  )=>{

    setCosts(prev =>
      prev.map((item,i)=>
        i===index
        ? {
            ...item,
            name
          }
        : item
      )
    );

  };





  const totalShipping =
    costs.reduce(
      (sum,item)=>sum+item.amount,
      0
    );




return (

<div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">


<h2 className="text-2xl font-bold mb-6">
Step 3: Shipping Costs
</h2>




<table className="w-full">

<thead>

<tr className="border-b">

<th className="text-left p-3">
Cost Description
</th>

<th>
Amount
</th>

</tr>

</thead>




<tbody>


{
costs.map((cost,index)=>(

<tr
key={index}
className="border-b"
>


<td className="p-3">


<input

value={cost.name}

onChange={(e)=>
updateName(
index,
e.target.value
)
}

className="w-full p-2 border rounded 
dark:bg-gray-700"

/>


</td>





<td className="p-3">


<input

type="number"

value={cost.amount}

onChange={(e)=>
updateCost(
index,
Number(e.target.value)
)
}

className="w-full p-2 border rounded
dark:bg-gray-700"

/>


</td>


</tr>


))

}



</tbody>

</table>





<button

onClick={addCost}

className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"

>

+ Add Cost

</button>





<div className="mt-6 p-4 bg-green-50 dark:bg-gray-700 rounded-lg">


<h3 className="font-semibold">

Shipping Total

</h3>


<p className="text-2xl font-bold text-green-700">

Ush {totalShipping.toLocaleString("en-UG")}

</p>


</div>







<div className="flex justify-between mt-8">


<button

onClick={onBack}

className="px-6 py-3 rounded-lg bg-gray-200"

>

← Back

</button>





<button

onClick={()=>onNext(costs)}

className="px-6 py-3 rounded-lg bg-green-600 text-white"

>

Save & Continue →

</button>



</div>




</div>

);

}