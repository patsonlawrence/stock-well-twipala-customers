"use client";

import { useState } from "react";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase";


interface ShipmentProduct {

  productId:string;

  productName:string;

  shippedQty:number;

  landedUnitCost:number;

}



interface Props {

  shipmentId?:string;

  products:ShipmentProduct[];

  onComplete:()=>void;

  onBack:()=>void;

}




export default function ShipmentStepSeven({

shipmentId,

products,

onComplete,

onBack

}:Props){



const [loading,setLoading] =
useState(false);



const receiveShipment = async()=>{


try {


setLoading(true);



// Update every product

for(const item of products){



const productRef =
doc(
db,
"products",
item.productId
);



const productSnap =
await getDoc(productRef);



if(!productSnap.exists()){

continue;

}



const currentQty =
productSnap.data().productQty || 0;




await updateDoc(
productRef,
{

productQty:
currentQty + item.shippedQty,


ProductPrice:
item.landedUnitCost


}

);



}





// Update shipment status

if(shipmentId){


await updateDoc(

doc(
db,
"shipments",
shipmentId
),

{

status:"Received",

receivedAt:
serverTimestamp()

}

);


}





setLoading(false);


onComplete();



}

catch(error){

console.error(
"Shipment receive error",
error
);


setLoading(false);

}



};







return (

<div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">


<h2 className="text-2xl font-bold mb-6">

Step 7: Receive Shipment

</h2>





<p className="mb-5 text-gray-600 dark:text-gray-300">

You are about to update inventory with these quantities.

This action cannot be reversed automatically.

</p>







<table className="w-full mb-6">


<thead>

<tr className="border-b">


<th className="text-left p-3">
Product
</th>


<th>
Incoming Qty
</th>


<th>
New Cost
</th>


</tr>

</thead>





<tbody>


{
products.map(product=>(


<tr

key={product.productId}

className="border-b"

>


<td className="p-3">

{product.productName}

</td>




<td className="text-center">

{product.shippedQty}

</td>




<td className="text-right">

Ush {

product.landedUnitCost.toLocaleString(
"en-UG",
{
maximumFractionDigits:2
}
)

}

</td>



</tr>


))

}


</tbody>


</table>









<div className="flex justify-between">


<button

onClick={onBack}

className="px-6 py-3 bg-gray-200 rounded"

>

← Back

</button>





<button

disabled={loading}

onClick={receiveShipment}

className="px-6 py-3 bg-green-600 text-white rounded"

>


{
loading
?
"Receiving..."
:
"Confirm Receipt"
}


</button>



</div>





</div>

);

}