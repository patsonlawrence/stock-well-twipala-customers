"use client";

interface ShipmentProduct {
  productId: string;
  productName: string;
  shippedQty: number;
  purchasePrice: number;
}


interface AllocatedProduct extends ShipmentProduct {

  purchaseTotal:number;

  allocationPercent:number;

  allocatedShipping:number;

  allocatedTaxes:number;

  allocatedOther:number;

  landedCostTotal:number;

  landedUnitCost:number;

}



interface Props {

  products: ShipmentProduct[];

  shippingTotal:number;

  importTotal:number;

  otherTotal:number;

  onNext:(data:any)=>void;

  onBack:()=>void;

}




export default function ShipmentStepSix({

products,

shippingTotal,

importTotal,

otherTotal,

onNext,

onBack

}:Props){



// Total purchase value

const totalPurchaseValue =

products.reduce(

(sum,item)=>

sum +

(item.shippedQty * item.purchasePrice),

0

);





const allocatedProducts:AllocatedProduct[] =

products.map(product=>{


const purchaseTotal =

product.shippedQty *

product.purchasePrice;



const allocationPercent =

totalPurchaseValue > 0

?

purchaseTotal / totalPurchaseValue

:

0;





const allocatedShipping =

shippingTotal *

allocationPercent;



const allocatedTaxes =

importTotal *

allocationPercent;



const allocatedOther =

otherTotal *

allocationPercent;





const landedCostTotal =

purchaseTotal

+

allocatedShipping

+

allocatedTaxes

+

allocatedOther;





const landedUnitCost =

product.shippedQty > 0

?

landedCostTotal / product.shippedQty

:

0;





return {

...product,

purchaseTotal,

allocationPercent,

allocatedShipping,

allocatedTaxes,

allocatedOther,

landedCostTotal,

landedUnitCost

};



});







const finalShipmentCost =

allocatedProducts.reduce(

(sum,item)=>

sum + item.landedCostTotal,

0

);






return (

<div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">


<h2 className="text-2xl font-bold mb-6">

Step 6: Final Cost Allocation Review

</h2>





<div className="overflow-x-auto">


<table className="w-full">


<thead>

<tr className="border-b">


<th className="text-left p-3">
Product
</th>


<th>
Qty
</th>


<th>
Purchase
</th>


<th>
Allocated Cost
</th>


<th>
Landed Unit Cost
</th>


</tr>

</thead>




<tbody>


{
allocatedProducts.map(product=>(


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

Ush {product.purchaseTotal.toLocaleString("en-UG")}

</td>





<td className="text-right">


Ush {

(

product.allocatedShipping

+

product.allocatedTaxes

+

product.allocatedOther

)

.toLocaleString("en-UG")

}


</td>





<td className="text-right font-bold text-green-700">


Ush {

product.landedUnitCost

.toLocaleString(
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


</div>







<div className="mt-6 bg-green-50 dark:bg-gray-700 rounded-xl p-5">


<h3 className="font-bold text-xl">

Shipment Total

</h3>


<p>

Total Landed Cost:

<strong>

Ush {finalShipmentCost.toLocaleString("en-UG")}

</strong>

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

products:allocatedProducts,

finalShipmentCost

})}

className="px-6 py-3 bg-green-600 text-white rounded"

>

Approve & Continue →

</button>




</div>






</div>

);


}