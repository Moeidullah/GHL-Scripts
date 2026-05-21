(function(){
  var t = localStorage.getItem('kg-active-theme');
  var themes = {
    aurora:       { c:'#04342C', h:'#1D9E75', g:'linear-gradient(135deg,#04342C 0%,#1D9E75 100%)', b:'#0F4A3A', n:'#9FE1CB' },
    obsidian:     { c:'#0C0C14', h:'#7F77DD', g:'linear-gradient(135deg,#1A1A2E 0%,#7F77DD 100%)', b:'#1E1E2E', n:'#AFA9EC' },
    midnight_gold:{ c:'#111108', h:'#BA7517', g:'linear-gradient(135deg,#111108 0%,#BA7517 100%)', b:'#2A2408', n:'#FAC775' },
    deep_navy:    { c:'#042C53', h:'#185FA5', g:'linear-gradient(135deg,#042C53 0%,#185FA5 100%)', b:'#0C3D6B', n:'#B5D4F4' },
    crimson:      { c:'#4B1528', h:'#D4537E', g:'linear-gradient(135deg,#4B1528 0%,#D4537E 100%)', b:'#6B1F38', n:'#F4C0D1' },
  };
  if(t && themes[t]){
    var v = themes[t];
    var r = document.documentElement;
    r.style.setProperty('--kg-primary-color', v.c);
    r.style.setProperty('--kg-secondary-color', v.c);
    r.style.setProperty('--kg-highlight-color', v.h);
    r.style.setProperty('--kg-primary-gradient', v.g);
    r.style.setProperty('--kg-button-grey', v.b);
    r.style.setProperty('--kg-nav-text', v.n);
    r.style.setProperty('--kg-topbar-text', v.h);
    r.style.setProperty('--kg-topbar-active-underline', v.n);
  }
})();
