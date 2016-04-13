//////////////////全局变量///////////
var canvas=document.getElementById('canvas');
var width=canvas.width,height=canvas.height;

var pause=true;//是否暂停
var play=false;//是否游戏中
var intro=5;//控制进入游戏时的界面
var choose=false;//是否处于选择难度界面

var VN;//游戏速度参数，与难度挂钩
var mode=2;//难度选择，初始为2--中等
//预读图像
var img_out=new Image();img_out.src='outter.gif';var rad_out=width*0.079;//中央地带
var img_in=new Image();img_in.src='in.gif';var rad_in=width*0.023;//中央的装饰齿轮图片
var img_show=new Image();img_show.src='blow.gif';//炸弹
var img_jx=new Image();img_jx.src='hudie.gif';//加血ui

var upleft=width*0.08,uptop=height*0.1,upright=width*0.85;//顶部数据栏的位置
var hpleft=width*0.33,hptop=height*0.9,hpwid=width*0.4,hphgt=height*0.014;//血条位置
var blow10=width*0.2,blow50=width*0.25,blow100=width*0.35;//不同等级炸弹的半径大小
var eleft=width*0.2,nleft=width*0.45,hleft=width*0.7;//难度选择界面的文字、图像位置
var etop=height*0.65,gtop=height*0.8,chtop=height*0.67;//同上

var internal=1000;//刷新波数时间间隔参数，即1秒

var gradient;//渐变变量
var bloods=[];//存储恢复血量的‘蝴蝶’特效对象数组
var img_intro=new Image();//游戏介绍界面的图像

///////////动画//////////////////////////////////////////////////////////////////////////////
////爆炸
function Iblow(){
	var img=new Image();img.src='blow.gif';
	this.rad=50; //初始半径，小于中央的外部红色齿轮
	this.max=0;	//最大范围/半径
	this.change=0;	//每帧变大的量
	this.angle=0;	//旋转角
	this.show=false;	//标志是否触发，是否显示
	this.draw=function(){
		ctx.save();
		ctx.translate(width/2,height/2);
		ctx.rotate(this.angle);
		ctx.translate(-width/2,-height/2);
		ctx.drawImage(img,width/2-this.rad,height/2-this.rad,2*this.rad,2*this.rad);
		ctx.restore();
	}
}
var i_blow;///加血蝴蝶
function Blood(x,y){
	this.xx=x;
	this.yy=y;
	this.rad=15;
	this.vx=(hpleft-this.xx)/70;
	this.vy=(hptop-this.yy)/70;
}///奖励分数
function Bonus(){
	this.num=0;			//加分分值，不等于0时将启动动画
	this.xx=hpleft+hpwid*game.HP/200;	//起始位置
	this.yy=hptop;
	this.vx=(upright-this.xx)/50;	//飞到得分处的帧位移
	this.vy=(uptop-this.yy)/50;
	this.rad=15;	//初始半径，大小
	var img=new Image();img.src='jiafen.gif';
	this.pic=img;
	this.draw=draw;
	//恢复位置，加分值，大小，为下一次动画做准备
	this.end=function(){
		this.xx=hpleft+hpwid*game.HP/200;
		this.yy=hptop;
		this.num=0;
		this.rad=15;
	}
}
var bonus;

////血条齿轮
function Xuelun(){
	var img=new Image();img.src='xuelun.gif';
	this.pic=img;
	this.angle=0;
	this.rad=width*0.02;
	this.draw=function(){
		ctx.save();
		ctx.translate(hpleft-0.8*this.rad,hptop+6);
		ctx.rotate(this.angle);
		ctx.translate(-hpleft+0.8*this.rad,-hptop-6);
		ctx.drawImage(this.pic,hpleft-1.8*this.rad,hptop-this.rad+6,2*this.rad,2*this.rad);
		ctx.restore();
	}
}
var xuelun;

////////////////游戏参数//////////////////////////////////////////////////////////////////////
function Game(){
	this.score=0;//得分
	this.V0=Math.ceil(height/116);//子弹速度
	this.VN=VN;//数字速度系数
	this.caa=Math.PI/140;//旋转速率
	this.ca=4*this.caa;//旋转角
	this.tid=null;//主动画时间函数对象
	this.tio=null;//波数刷新间隔函数对象
	this.addnum=8;//每波最大球数
	this.gap=10;//波刷新间隔
	this.HP=200;//生命值
	this.goal=0;//目标数字
	this.goalmax=100;//产生随机goal的上限
	this.bos=0.03;//出现boss概率
	this.conse=0;//目前结果
	this.boshu=1;//波数 每五波加一个最大球
	this.bisha=1;//必杀技
	this.jishu=0;//增加必杀数目的时间计数
}
var game;//定义全局变量，在init函数中实例化

///////////boss////////////////////////////////////////////////////////////////////////
function Boss(x,y){
	this.bo=true;
	this.point=10+game.boshu;
	var img=new Image();img.src='boss.gif';
	this.pic=img;
	this.xx=x;
	this.yy=y;
	this.rad=35;
	var time=(Math.ceil(Math.random()*5)+10)*250;
	this.vx=(width/2-this.xx)/time;
	this.vy=(height/2-this.yy)/time;
	this.draw=draw;
}


////数字个体///////////////////////////////////////////////
function Numb(x,y){
	this.bo=false;
	this.point=Math.ceil(Math.random()*9);
	var img=new Image();img.src='a'+this.point+'.gif';
	this.pic=img;
	this.xx=x;
	this.yy=y;
	this.rad=15;
	var time=(Math.ceil(Math.random()*8)+12)*game.VN;
	this.vx=(width/2-this.xx)/time;
	this.vy=(height/2-this.yy)/time;
	this.draw=draw;
}
//////数字球数组///////////////////
function Numballs(){
	this.now=0;//现存的
	this.max=48;//最大数目
	this.nbs=[];
	this.add=function (){
		for(var i=0,j=0;j<game.addnum&&i<this.max;i++){
			if(!this.nbs[i]){
				this.nbs[i]=create();
				this.now++;j++}
		}
	}
	this.sub=function (i){
		this.nbs[i]=null;
		this.now--;
	}
}
///////创造新数字球/boss
function create(){
	var x,y;
	if(Math.random()>0.5){
		x=(Math.random()>0.5)?-10:(width+10);
		y=Math.random()*(height+20)-10;
	}else{
		y=(Math.random()>0.5)?-10:(height+10);
		x=Math.random()*(width+20)-10;
	}
	if(Math.random()<=game.bos)return (new Boss(x,y));
	return (new Numb(x,y));
}
var numballs;///////存储数字球数组

//////子弹/////////////////////////////////////////
///子弹球数组
function Danyao(){
	this.now=0;	//屏幕上现存的子弹数量（在飞行的子弹）
	this.num=2;	//弹药量，可同时发射的最大数量
	this.balls=[]; //存储现存子弹的数组
	this.add=function (a){	//调用时以新的子弹个体对象传入参数a
		for(var i=0;i<this.num;i++){	//限定在弹药量的范围内
		if(this.balls[i])continue;
		this.balls[i]=a;
		this.now++;break;}	//更新现存属性
}
	this.sub=function (i){this.balls[i]=null;this.now--;}	//从数组中删除
}
var danyao;///将在游戏开始前实例化
///子弹球个体
function Ball(type,angle){	//传入类型参数，以及角度参数--发射转盘现在的旋转角
	var bx,by,src,vx,vy;
	//根据转盘的旋转角以及子弹类型来确定该子弹的起始坐标，以及它x，y方向上的速度（每帧位移量）
	var si=Math.sin(zhuanpan.angle);
	var co=Math.cos(zhuanpan.angle);
	switch(type){    //1-加，2-乘，3-减，4-除
		case 1:bx=width/2-co*zhuanpan.rad;by=height/2+si*zhuanpan.rad;
			   vx=-co*game.V0;vy=si*game.V0;
			   src='1.gif';break;
		case 2:bx=width/2-si*zhuanpan.rad;by=height/2-co*zhuanpan.rad;
			   vx=-si*game.V0;vy=-co*game.V0;
			   src='2.gif';break;
		case 3:bx=width/2+co*zhuanpan.rad;by=height/2-si*zhuanpan.rad;
		       vx=co*game.V0;vy=-si*game.V0;
			   src='3.gif';break;
		case 4:bx=width/2+si*zhuanpan.rad;by=height/2+co*zhuanpan.rad;
			   vx=si*game.V0;vy=co*game.V0;
			   src='4.gif';break;
	}
	this.type=type;		//子弹类型
	this.rad=15;
	this.xx=bx;
	this.yy=by;
	this.draw=draw;
	var qiu=new Image();qiu.src=src;
	this.pic=qiu;
	this.vx=vx;
	this.vy=vy;
}

///发射转盘//////////////////////////////////
function Zhuanpan(){
	this.rad=width*0.07;  //半径，控制它在画面上的大小
	this.xx=width/2-this.rad;
	this.yy=height/2-this.rad;
	this.wid=2*this.rad;
	this.hgt=2*this.rad;
	this.draw=function (){
		//绘制旋转后的图像，方法是把画布的坐标旋转后绘制，再恢复。
		ctx.save();//保存当前坐标系
		ctx.translate(this.xx+this.rad,this.yy+this.rad);//将坐标系移动到转盘的中心
		ctx.rotate(-this.angle);//旋转（由于旋转按键设置的是顺时针转角度减小，与画布的旋转相反，因此这里要加负号）
		ctx.translate(-this.xx-this.rad,-this.yy-this.rad);//将坐标系移回
		ctx.drawImage(this.pic,this.xx,this.yy,this.wid,this.hgt);//以转盘在正常参照系中的坐标绘制旋转后的转盘
		ctx.restore();//恢复坐标系
		//以下是转盘中央反着转的小齿轮的绘制，仅用于美观
		ctx.save();
		ctx.translate(this.xx+this.rad,this.yy+this.rad);
		ctx.rotate(this.angle);
		ctx.translate(-this.xx-this.rad,-this.yy-this.rad);
		ctx.drawImage(img_in,width/2-rad_in,height/2-rad_in,2*rad_in,2*rad_in);
		ctx.restore();
	}
	var fashe=new Image();fashe.src="fashe.gif";
	this.pic=fashe;
	this.angle=0;
}
var zhuanpan;

//////////绘图工具函数//////////////////////////////////////////////
function draw(){
	ctx.drawImage(this.pic,this.xx-this.rad,this.yy-this.rad,this.rad*2,this.rad*2);
}

function drawall(){
	ctx.clearRect(0,0,width,height);
	//效果动画
	if(i_blow.show)i_blow.draw();//炸弹效果
	//加血蝴蝶，加血数组不为空时绘制动画
	if(bloods.length){
		for(var i=0;i<bloods.length;i++){
			ctx.drawImage(img_jx,bloods[i].xx-15,bloods[i].yy-15,30,30);
		}
	}
	//加分动画，蝴蝶动画结束（加血数组为空）且加分不为0时绘制
	if(!bloods.length&&bonus.num){
		bonus.draw();
		bonus.xx+=bonus.vx;bonus.yy+=bonus.vy;
		if(bonus.yy<=uptop){game.score+=Math.ceil(bonus.num*(1+game.boshu/40))*10*mode;bonus.end();}//动画结束，还原bonus
	}
	//主要内容
	ctx.drawImage(img_out,width/2-rad_out,height/2-rad_out,2*rad_out,2*rad_out);
	zhuanpan.draw();
	for(i=0;i<danyao.num;i++){
		if(danyao.balls[i])danyao.balls[i].draw();
	}
	for(i=0;i<numballs.max;i++){
		if(numballs.nbs[i])numballs.nbs[i].draw();
	}
	//界面
	ctx.fillText('Level:'+game.boshu+'   Bullet:'+(danyao.num-danyao.now)+'   Goal:'+game.goal+'  Now:'+game.conse+'   Boom:'+game.bisha+'   Score:'+game.score/100,upleft,uptop);
	ctx.fillRect(hpleft,hptop,hpwid/200*game.HP,hphgt);
	xuelun.draw();//血条左边的小齿轮
}

///////////初始化//////////////////////////////////////////////////////////////
function init(){
	ctx=canvas.getContext('2d');
	gradient=ctx.createLinearGradient(hpleft,hptop,hpleft+hpwid,hptop+hphgt);//创建渐变
	gradient.addColorStop("0","#000000");
	gradient.addColorStop("0.5","#931a21");
	ctx.fillStyle=gradient;
	ctx.font="15px Verdana";
	ctx.fillText('press any key to skip',width*0.51,height*0.55);
	ctx.font="30px Verdana";
	ctx.fillText('N u m b e r   P a n i c.',width*0.35,height*0.5);
}

function start(){
	setting();	//重置参数
	drawall();	
	play=!play;//标志游戏开始
	game.tid=setInterval(motion,20);	//游戏开始
	game.tio=setTimeout(next,internal*game.gap);//控制数字来袭间隔
	newgoal();//产生新goal
}

function setting(){
	game=new Game();	//游戏参数对象重置
	i_blow=new Iblow();	//炸弹效果
	zhuanpan=new Zhuanpan();//发射转盘
	bloods=[];//加血特效
	bonus=new Bonus();	
	xuelun=new Xuelun();
	danyao=new Danyao();///对象化
	numballs=new Numballs();
	numballs.add();
}
///////////////////游戏过程控制//////////////////////
////////下一波数字球
function next(){
	if(++game.boshu%5==0){game.addnum++;if(game.V0<12)game.V0+=1;if(game.bos<0.07)game.bos+=0.005;}//增加每波数字与子弹速度,boss出现概率
	if(game.boshu%7==0){game.goalmax*=1.5;if(danyao.num<5)danyao.num++;}//增加goal上限
	numballs.add();
	if(game.gap>7)game.gap-=0.2;
	if(play)game.tio=setTimeout(next,internal*game.gap);
}

///////产生goal
function newgoal(){
	game.goal=Math.ceil(Math.random()*game.goalmax);
	if(Math.random()<=0.3)game.goal*=-1;
}
///////////按键响应
function key(e){
	var code=String.fromCharCode(e.which);
	if(!play){
		if(choose){
			switch(code){
				case 'J':VN=150;mode=1;break;
				case 'K':VN=100;mode=2;break;
				case 'L':VN=70;mode=5;break;
				case 'G':intro--;choose=false;break;
				default:break;
			}
		}
		switch(intro){
			case 5:ctx.clearRect(0,0,width,height);img_intro.src='i1.gif';ctx.drawImage(img_intro,150,90,800,400);intro--;break;
			case 4:ctx.clearRect(0,0,width,height);img_intro.src='i2.gif';ctx.drawImage(img_intro,150,90,800,400);intro--;break;
			case 3:ctx.clearRect(0,0,width,height);img_intro.src='i3.gif';ctx.drawImage(img_intro,150,90,800,400);intro--;choose=true;break;
			case 2:ctx.clearRect(0,0,width,height);ctx.fillStyle="#000000";
				   ctx.drawImage(img_show,width*0.42,height*0.1,width*0.2,width*0.2);
				   ctx.fillText('Easy(J)',eleft,etop);
				   ctx.fillText('Normal(K)',nleft,etop);
				   ctx.fillText('Hard(L)',hleft,etop);
				   ctx.fillText('Start(G)',nleft,gtop);ctx.fillStyle="#ad2028";
				   if(mode==1){
				   		ctx.fillRect(eleft,chtop,110,7);
				   }else{
				   		if(mode==2){
				   			ctx.fillRect(nleft,chtop,155,7);
				   		}else ctx.fillRect(hleft,chtop,115,7);
				   }
				   break;
			case 1:ctx.clearRect(0,0,width,height);ctx.fillStyle=gradient;ctx.fillText('press any key to start.',500,330);intro--;break;
			case 0:ctx.clearRect(0,0,width,height);intro=2;choose=true;start();break;
		}
	}else{
	switch(code){
		case 'G':if(pause){clearInterval(game.tid);clearTimeout(game.tio);pause=!pause;
					ctx.font="120px Verdana";ctx.fillText('P A U S E',width*0.25,height*0.55);ctx.font="30px Verdana";}
				 else{game.tid=setInterval(motion,20);game.tio=setTimeout(next,internal*game.gap);pause=!pause;}break;
		case 'A':if(!pause)break;if(Math.abs(zhuanpan.angle+=game.ca)>6.28)zhuanpan.angle%=2*Math.PI;drawall();if(game.ca<0.18)game.ca+=game.ca;break;
		case 'D':if(!pause)break;if(Math.abs(zhuanpan.angle-=game.ca)>6.28)zhuanpan.angle%=2*Math.PI;drawall();if(game.ca<0.18)game.ca+=game.ca;break;
		case 'J':if(!pause)break;if(danyao.now<danyao.num){danyao.add(new Ball(1,zhuanpan.angle));drawall();}break;
		case 'I':if(!pause)break;if(danyao.now<danyao.num){danyao.add(new Ball(2,zhuanpan.angle));drawall();}break;
		case 'L':if(!pause)break;if(danyao.now<danyao.num){danyao.add(new Ball(3,zhuanpan.angle));drawall();}break;
		case 'K':if(!pause)break;if(danyao.now<danyao.num){danyao.add(new Ball(4,zhuanpan.angle));drawall();}break;
		case 'H':if(!pause)break;if(game.bisha){blowup(30);game.bisha--;}break;
		default:break;
	}}
}

//////////////////////////////动画、过程/////////////////////////
function motion(){
	//是否死亡
	if(game.HP<=0){
		clearInterval(game.tid);
		clearTimeout(game.tio);
		play=!play;
		ctx.clearRect(0,0,width,height);
		ctx.fillText('GAME OVER,PRESS any key to Restart.',width*0.25,height*0.4);
		ctx.fillStyle="#000000";
		ctx.fillText('Your score:'+game.score/100,width*0.4,height*0.6);
		ctx.fillStyle=gradient;
		return;
	}
	game.score++;
	if(++game.jishu%10000==0)game.bisha++;
	//效果动画
	//爆炸
	if(i_blow.show){
		i_blow.rad+=i_blow.change;
		i_blow.angle+=0.2;
	}	//加血飞行
	if(bloods.length){
		for(var i=0;i<bloods.length;i++){
			bloods[i].xx+=bloods[i].vx;
			bloods[i].yy+=bloods[i].vy;
		}
		if(Math.abs(bloods[0].xx-hpleft)<3&&Math.abs(bloods[0].yy-hptop)<3)bloods=[];
	}
	
	var nb=numballs.nbs;
	var db=danyao.balls;
	if(danyao.now){
		///////子弹移动
	for(var i=0;i<danyao.num;i++){
		//出界
		if(!db[i])continue;
		if((db[i].xx+=db[i].vx)<0||db[i].xx>width){
			danyao.sub(i);
			continue;
		}
		if((db[i].yy+=db[i].vy)<0||db[i].yy>height){
			danyao.sub(i);	
			continue;
		}
	}}
	//////////所有球移动
	for(var i=0;i<numballs.max;i++){
		if(!nb[i])continue;
		nb[i].xx+=nb[i].vx;
		nb[i].yy+=nb[i].vy;
		if(nb[i].xx<width*0.6&&nb[i].xx>width*0.4&&nb[i].yy<height*0.65&&nb[i].yy>height*0.35){
			game.HP-=nb[i].point;
			xuelun.angle-=0.2;
			numballs.sub(i);
			continue;
		}
		if(danyao.now&&(!nb[i].bo)){
			encounter(nb[i],i,db);////////碰撞检测
		}
	}
	drawall();
}
///////碰撞
function encounter(a,j,b){
	for(var i=0;i<b.length;i++){
		if(!b[i])continue;
		var dis=(a.xx-b[i].xx)*(a.xx-b[i].xx)+(a.yy-b[i].yy)*(a.yy-b[i].yy);
		if(dis<(a.rad+b[i].rad)*(a.rad+b[i].rad)){////////碰撞
			//计算当前game.conse
			switch(b[i].type){/////1,2,3,4;+,X,-,/
				case 1:game.conse+=a.point;break;
				case 2:game.conse*=a.point;break;
				case 3:game.conse-=a.point;break;
				case 4:game.conse=Math.floor(game.conse/a.point);break;
			}//达到goal数值--爆炸，加血，清零，产生新goal
			if(game.conse==game.goal){
				blowup(Math.abs(game.goal));//爆炸
				game.conse=0;
				newgoal();
			}
			danyao.sub(i);				
			numballs.sub(j);
			break;
		}
	}
}
////爆炸
function blowup(a){
	var rad=(a<10)?blow10:((a<50)?blow50:blow100);
	i_blow.show=true;
	i_blow.max=rad;
	i_blow.change=(rad-i_blow.rad)/25;//25帧--0.5秒
	rad*=rad;
	this.end=function(){
		i_blow.show=false;
		i_blow.rad=50;
	}
	this.clear=function(){
		var nb=numballs.nbs;
		for(var i=0;i<numballs.max;i++){
		if(!nb[i])continue;
		var dis=Math.pow((nb[i].xx-width/2),2)+Math.pow((nb[i].yy-height/2),2);
		if(dis<rad){//清除，爆炸加血
			if(nb[i].bo)game.HP+=nb[i].point;
			game.HP++;
			xuelun.angle+=0.2;
			bloods.push(new Blood(nb[i].xx,nb[i].yy));
			numballs.sub(i);
		}
	}
	if(game.HP>=200){
		bonus.num=(game.HP-200)*2;//增加奖励分数的bonus对象
		bonus.rad=(bonus.num<15)?15:((bonus.num>35)?35:bonus.num);
		game.HP=200;
	}
	i_blow.change*=-0.5;//炸弹圈儿回收，速度/2，即花费1秒
	setTimeout(this.end,1000);
	}
	setTimeout(this.clear,500);
}

//////键盘事件
onkeydown=key;
onkeyup=function(){
	if(play)game.ca=4*game.caa;////////////按键松开后箭头旋转速度归为初始值
}