function owinHeight(){//当前窗口的height
  var winHeight;
  if (window.innerHeight){
      winHeight = window.innerHeight
  }else if ((document.body) && (document.body.clientHeight)){
      winHeight = document.body.clientHeight
  }
  else	if (document.documentElement  && document.documentElement.clientHeight){
      winHeight = document.documentElement.clientHeight;
  }
  return winHeight; 
}

	var ww;
	var wh=owinHeight();
	wh=Math.ceil(wh*0.9385);ww=Math.ceil(wh*1.8965);
	var canvas=document.getElementById('canvas');
	canvas.width=ww;
	canvas.height=wh;