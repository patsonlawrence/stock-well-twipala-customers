'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";

export default function Home() {

  const [isMobile,setIsMobile] = useState(false);

  useEffect(()=>{

    const checkScreen = ()=>{
      setIsMobile(window.innerWidth < 768);
    };

    checkScreen();

    window.addEventListener(
      "resize",
      checkScreen
    );

    return ()=>window.removeEventListener(
      "resize",
      checkScreen
    );

  },[]);


  return (
    <>
      {isMobile 
        ? <MobileHome/> 
        : <DesktopHome/>
      }
    </>
  );
}



function MobileHome(){

const router = useRouter();


const menu=[
{
title:"BackOffice",
icon:"🧑‍💻",
path:"/login"
},
{
title:"Offers",
icon:"🏷️",
path:"/offers"
},
{
title:"Orders",
icon:"🛒",
path:"/orders"
},
{
title:"Sign Up",
icon:"👤",
path:"/signup"
}
];


return (

<div
style={{
minHeight:"100vh",
background:"#777",
padding:"15px",
display:"flex",
flexDirection:"column",
alignItems:"center"
}}
>


<img
src="/logos/twipalaicon.png"
alt="Twipala"
width={175}
height={100}
/>


<PromoCarousel/>



<div
style={{
position:"fixed",
top:"10px",
right:"10px",
display:"flex",
gap:"10px",
zIndex:1000
}}
>


<a
href="https://wa.me/256709095815"
style={contactStyle}
>
🟢 WhatsApp
</a>


<a
href="tel:0709095815"
style={contactStyle}
>
📞 Call
</a>


</div>




<div
style={{
position:"fixed",
bottom:"30px",
width:"90%",
display:"grid",
gridTemplateColumns:"repeat(4,1fr)",
gap:"8px"
}}
>


{
menu.map(item=>(

<button

key={item.title}

onClick={()=>
router.push(item.path)
}

style={{
background:"#f78e16",
color:"white",
border:"2px solid white",
borderRadius:"20px",
padding:"12px 5px",
fontSize:"12px",
fontWeight:"bold",
cursor:"pointer"
}}

>

{item.icon}
<br/>
{item.title}

</button>

))
}


</div>




<div
style={{
position:"fixed",
top:"120px",
width:"95%",
background:"#ffc107",
padding:"8px",
borderRadius:"30px",
fontWeight:"bold",
overflow:"hidden",
whiteSpace:"nowrap"
}}
>


<div
  style={{
    overflow: "hidden",
    whiteSpace: "nowrap",
    width: "100%",
  }}
>
  <div
    style={{
      display: "inline-block",
      paddingLeft: "100%",
      animation: "scrollText 12s linear infinite",
      fontWeight: "bold",
    }}
  >
    🕒 Retail Shop Open Everyday 7:00am - 11:00pm.
    Enjoy Unlimited Shopping and Stock Variety.
    Register and get discounts!
  </div>

  <style jsx>{`
    @keyframes scrollText {
      from {
        transform: translateX(0%);
      }
      to {
        transform: translateX(-100%);
      }
    }
  `}</style>
</div>

</div>


</div>

)

}




function DesktopHome(){

const router = useRouter();


return (

<div
style={{
minHeight:"100vh",
display:"flex",
flexDirection:"column",
alignItems:"center",
justifyContent:"center",
gap:"30px"
}}
>


<img
src="/logos/twipalaicon.png"
alt="Twipala"
width={250}
height={150}
/>


<h1>
© StockWell
</h1>


<p>
☎ Contact: 256709095815
</p>



<button

onClick={()=>
router.push("/login")
}

style={{
background:"#06722a",
color:"white",
padding:"15px",
width:"300px",
borderRadius:"20px",
border:"none",
fontSize:"18px",
cursor:"pointer"
}}

>

Staff Login

</button>


</div>


)

}




const contactStyle={

background:"white",
color:"green",
padding:"10px",
borderRadius:"20px",
border:"2px solid green",
fontSize:"12px",
textDecoration:"none"

};





function PromoCarousel(){

const images=[

"/promos/1.webp",
"/promos/2.webp",
"/promos/3.webp",
"/promos/4.webp"

];


const [index,setIndex]=useState(0);


useEffect(()=>{

const timer=setInterval(()=>{

setIndex(
prev=>
(prev+1)%images.length
);

},4000);


return ()=>clearInterval(timer);


},[]);



const swipe=useSwipeable({

onSwipedLeft:()=>setIndex(
(index+1)%images.length
),

onSwipedRight:()=>setIndex(
(index-1+images.length)%images.length
)

});



return (

<div

{...swipe}

style={{
marginTop:"120px",
height:"300px",
display:"flex",
alignItems:"center"
}}

>


<img

src={images[index]}

alt="promo"

style={{

width:"260px",
height:"260px",
objectFit:"cover",
borderRadius:"20px",
boxShadow:"0 5px 20px #000"

}}

/>


</div>

)

}