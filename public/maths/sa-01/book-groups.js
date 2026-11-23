/* Group original textbook sub-parts under their printed exercise number.
   Preserve the original sub-part IDs: existing progress and saved answers remain valid. */
(function(){
'use strict';
const book=window.MATHS_BOOK_BANK||[];
const map=new Map();
const numberOf=q=>String(q.number||'').match(/^\d+\.\d+/)?.[0]||String(q.number);
for(const q of book){
 const number=numberOf(q);
 if(!map.has(number))map.set(number,{id:'group-'+number.replace('.','-'),number,category:q.category,steps:[],pages:new Set()});
 const group=map.get(number);group.steps.push(q);
 if(Number.isInteger(q.originalScreenshot))group.pages.add(q.originalScreenshot);
}
const groups=[...map.values()];
for(const group of groups){
 // Some original word problems span two screenshots; do not omit either part.
 if(group.number==='1.80')group.pages.add(11)
 if(group.number==='1.79')group.pages.add(11)
 if(group.number==='1.100')group.pages.add(13);
 group.pages=[...group.pages].sort((a,b)=>a-b);
 group.artwork=group.number==='1.79'?['book-1-79.webp']:
  group.number==='1.80'?['book-1-80.webp']:
  group.number==='1.81'?['book-1-81.webp']:
  group.number==='1.100'?['book-1-100.webp']:
  group.pages.map(n=>'book-page-'+n+'.webp');
 group.source='Buchbeispiele laut SchularbeitsStoff(1).zip';
 group.title=group.category;
 group.prompt=group.steps.map(q=>q.prompt).join(' ');
}
window.MATHS_BOOK_GROUPS=Object.freeze(groups);
})();
