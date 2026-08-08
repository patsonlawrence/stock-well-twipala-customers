"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";


interface Product {
  id: string;
  productName: string;
  productQty: number;
  ProductPrice: number;
}


interface ShipmentProduct {
  productId: string;
  productName: string;
  availableQty: number;
  shippedQty: number;
  purchasePrice: number;
}


interface Props {
  onNext: (products: ShipmentProduct[]) => void;
  onBack: () => void;
}


export default function ShipmentStepTwo({
  onNext,
  onBack,
}: Props) {


  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const [selectedProducts, setSelectedProducts] =
    useState<ShipmentProduct[]>([]);



  // Load inventory
  useEffect(() => {

    const q = query(
      collection(db, "products"),
      orderBy("productName", "asc")
    );


    const unsubscribe = onSnapshot(q, (snapshot) => {

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];


      setProducts(data);

    });


    return () => unsubscribe();

  }, []);





  const addProduct = (product: Product) => {


    const exists = selectedProducts.find(
      p => p.productId === product.id
    );


    if (exists) return;



    setSelectedProducts(prev => [
      ...prev,
      {
        productId: product.id,
        productName: product.productName,
        availableQty: product.productQty,
        shippedQty: 0,
        purchasePrice: 0,
      }
    ]);

  };





  const updateProduct = (
    id:string,
    field:"shippedQty" | "purchasePrice",
    value:number
  )=>{


    setSelectedProducts(prev =>
      prev.map(product =>
        product.productId === id
        ? {
            ...product,
            [field]: value
          }
        : product
      )
    );


  };





  const removeProduct = (id:string)=>{

    setSelectedProducts(prev =>
      prev.filter(
        product =>
        product.productId !== id
      )
    );

  };





  const filteredProducts =
    products.filter(product =>
      product.productName
      .toLowerCase()
      .includes(search.toLowerCase())
    );





  return (

<div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">


<h2 className="text-2xl font-bold mb-6">
  Step 2: Shipment Products
</h2>



{/* Search */}

<input

type="text"

placeholder="Search inventory..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

className="w-full p-3 mb-5 border rounded-lg dark:bg-gray-700"

/>





{/* Available products */}

<div className="grid md:grid-cols-3 gap-3 mb-8">

{
filteredProducts.map(product=>(

<button

key={product.id}

onClick={()=>addProduct(product)}

className="text-left p-4 rounded-lg border
hover:bg-green-50 dark:hover:bg-gray-700"

>

<div className="font-semibold">
{product.productName}
</div>


<div className="text-sm text-gray-500">

Available:
{product.productQty}

</div>


</button>


))

}

</div>





{/* Selected */}

<h3 className="text-xl font-semibold mb-3">
Selected Products
</h3>



{
selectedProducts.length === 0

?

<p className="text-gray-500">
No products selected
</p>


:

<div className="overflow-x-auto">

<table className="w-full">

<thead>

<tr className="border-b">

<th className="text-left p-3">
Product
</th>

<th>
Available
</th>

<th>
Shipped Qty
</th>

<th>
Purchase Price
</th>

<th>
Remove
</th>

</tr>

</thead>



<tbody>


{
selectedProducts.map(product=>(


<tr
key={product.productId}
className="border-b"
>


<td className="p-3">
{product.productName}
</td>



<td className="text-center">
{product.availableQty}
</td>




<td>

<input

type="number"

min="0"

value={product.shippedQty}

onChange={(e)=>
updateProduct(
product.productId,
"shippedQty",
Number(e.target.value)
)
}

className="w-24 p-2 border rounded dark:bg-gray-700"

/>

</td>





<td>

<input

type="number"

min="0"

value={product.purchasePrice}

onChange={(e)=>
updateProduct(
product.productId,
"purchasePrice",
Number(e.target.value)
)
}

className="w-28 p-2 border rounded dark:bg-gray-700"

/>

</td>




<td>

<button

onClick={()=>
removeProduct(product.productId)
}

className="text-red-500"

>
Remove
</button>

</td>


</tr>


))

}


</tbody>

</table>

</div>

}





<div className="flex justify-between mt-8">


<button

onClick={onBack}

className="px-6 py-3 rounded-lg bg-gray-200"

>

← Back

</button>



<button

onClick={()=>onNext(selectedProducts)}

disabled={selectedProducts.length===0}

className="px-6 py-3 rounded-lg bg-green-600 text-white"

>

Save & Continue →

</button>



</div>



</div>

  );

}