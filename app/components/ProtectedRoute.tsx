"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { useRouter } from "next/navigation";


interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}


export default function ProtectedRoute({
  children,
  allowedRoles
}: Props) {


const router = useRouter();

const [loading,setLoading]=useState(true);

const [authorized,setAuthorized]=useState(false);



useEffect(()=>{


const unsubscribe = onAuthStateChanged(
auth,
async(user)=>{


if(!user){

router.replace("/login");
return;

}


try{


const usersRef = collection(db,"users");


const q=query(
usersRef,
where("uid","==",user.uid)
);


const snapshot=await getDocs(q);



if(snapshot.empty){

router.replace("/login");
return;

}



const userData=snapshot.docs[0].data();


const role =
userData.role
?.toLowerCase()
?.trim();



if(!allowedRoles.includes(role)){

router.replace("/");

return;

}



setAuthorized(true);



}

catch(error){

console.error(error);
router.replace("/login");

}

finally{

setLoading(false);

}


});


return unsubscribe;


},[router,allowedRoles]);



if(loading){

return (
<div className="flex justify-center items-center h-screen">
Checking access...
</div>
);

}



if(!authorized){

return null;

}



return <>{children}</>;

}