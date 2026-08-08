"use client";

import { useState } from "react";


interface OtherExpense {
  name: string;
  amount: number;
}


interface Props {

  productTotal: number;

  shippingTotal: number;

  importTotal: number;

  products: {
    productId: string;
    productName: string;
    shippedQty: number;
    purchasePrice: number;
  }[];

  onNext: (data:any)=>void;

  onBack: ()=>void;

}



export default function ShipmentStepFive({

  productTotal,
  shippingTotal,
  importTotal,
  products,
  onNext,
  onBack

}:Props){



const [expenses,setExpenses] = useState<OtherExpense[]>([
  {
    name:"Loading",
    amount:0
  },
  {
    name:"Offloading",
    amount:0
  },
  {
    name:"Transport",
    amount:0
  },
  {
    name:"Miscellaneous",
    amount:0
  }
]);




const updateExpense = (
 index:number,
 field:"name"|"amount",
 value:string|number
)=>{


setExpenses(prev=>

prev.map((item,i)=>

i===index

?

{
 ...item,
 [field]:value
}

:

item

)

);


};





const addExpense = ()=>{

setExpenses(prev=>[
 ...prev,
 {
  name:"",
  amount:0
 }
]);

};





const otherTotal =
expenses.reduce(
(sum,item)=>sum+Number(item.amount),
0
);





const totalShipmentCost =

productTotal
+
shippingTotal
+
importTotal
+
otherTotal;






const totalQty =

products.reduce(
(sum,item)=>sum+item.shippedQty,
0
);






const averageUnitCost =

totalQty > 0

?

totalShipmentCost / totalQty

:

0;







return (

<div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">


<h2 className="text-2xl font-bold mb-6">

Step 5: Other Expenses & Landed Cost

</h2>





<h3 className="font-semibold mb-3">

Additional Expenses

</h3>




<table className="w-full">

<thead>

<tr className="border-b">

<th className="text-left p-3">
Description
</th>


<th>
Amount
</th>


</tr>

</thead>



<tbody>


{
expenses.map((expense,index)=>(


<tr
key={index}
className="border-b"
>


<td className="p-3">

<input

value={expense.name}

onChange={(e)=>

updateExpense(
index,
"name",
e.target.value
)

}

className="w-full p-2 border rounded dark:bg-gray-700"

/>

</td>




<td className="p-3">


<input

type="number"

value={expense.amount}

onChange={(e)=>

updateExpense(
index,
"amount",
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

onClick={addExpense}

className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"

>

+ Add Expense

</button>






<div className="mt-6 bg-green-50 dark:bg-gray-700 p-5 rounded-xl">


<p>
Product Cost:

<strong>
 Ush {productTotal.toLocaleString("en-UG")}
</strong>
</p>


<p>
Shipping:

<strong>
 Ush {shippingTotal.toLocaleString("en-UG")}
</strong>
</p>



<p>
Customs & Taxes:

<strong>
 Ush {importTotal.toLocaleString("en-UG")}
</strong>
</p>



<p>
Other Expenses:

<strong>
 Ush {otherTotal.toLocaleString("en-UG")}
</strong>
</p>



<hr className="my-3"/>



<p className="text-xl font-bold">

Total Landed Cost:

<br/>

Ush {totalShipmentCost.toLocaleString("en-UG")}

</p>



<p className="text-xl font-bold text-green-700">

Average Cost Per Unit:

<br/>

Ush {averageUnitCost.toLocaleString("en-UG")}

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

 expenses,

 otherTotal,

 totalShipmentCost,

 averageUnitCost

})}

className="px-6 py-3 bg-green-600 text-white rounded"

>

Review Shipment →

</button>



</div>



</div>

);

}