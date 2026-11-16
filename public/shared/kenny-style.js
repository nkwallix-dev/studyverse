/* Kennyverse uses the SAME saved skin as Studyverse's Dino Designer.
 * Presentation only: this module never changes inventory, TT or cloud state.
 */
(function(root){
  "use strict";
  const PROFILE_KEY="studyverse_profile_v1";
  const SKINS=new Set(["blue","pink","green","red","zebra"]);

  function fromProfile(profile){
    const selected=profile?.dinoSeasons?.["kenny-2026"]?.skin;
    // Match Studyverse's kennySkin getter: non-default skins must be owned.
    if(!SKINS.has(selected)||selected==="blue")return "blue";
    return Array.isArray(profile?.inventory)&&profile.inventory.includes("kenny_skin_"+selected)
      ?selected:"blue";
  }
  function current(){
    try{return fromProfile(JSON.parse(localStorage.getItem(PROFILE_KEY)||"null"))}
    catch{return "blue"}
  }
  function apply(){
    const skin=current();
    document.documentElement.dataset.kennySkin=skin;
    document.querySelectorAll('.kenny-visual img').forEach(image=>{
      const path='../kenny/skins/kenny-'+skin+'-portrait.png';
      if(image.getAttribute('src')!==path)image.setAttribute('src',path);
    });
    const colors={blue:"#14283b",pink:"#38243d",green:"#183929",red:"#452b30",zebra:"#25252e"};
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content",colors[skin]);
    return skin;
  }
  root.STUDYVERSE_KENNY_STYLE={fromProfile,current,apply};
  apply();
  root.addEventListener?.("pageshow",apply);
  root.addEventListener?.("storage",event=>{
    if(!event||event.key===PROFILE_KEY)apply();
  });
})(window);
