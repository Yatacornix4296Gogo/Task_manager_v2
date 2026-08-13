
export function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function installDateWatcher(refresh){
 let current=todayKey();
 function check(){const now=todayKey(); if(now!==current){current=now; refresh();}}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden) check();});
 window.addEventListener('focus',check);
 window.addEventListener('pageshow',check);
}
