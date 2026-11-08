(function(){
"use strict";
var canvas=document.getElementById("stairCanvas"),wrap=document.getElementById("canvasWrap"),errorBox=document.getElementById("canvasError");
if(!window.THREE){errorBox.hidden=false;return;}
var footprintPlanShape=document.getElementById("footprintPlanShape");
var THREE=window.THREE,scene=new THREE.Scene();var width=document.getElementById("width"),height=document.getElementById("height"),depth=document.getElementById("depth"),steps=document.getElementById("steps"),shape=document.getElementById("shape"),frame=document.getElementById("frame"),wood=document.getElementById("wood"),risers=document.getElementById("risers"),shoes=document.getElementById("shoes"),underSpace=document.getElementById("underSpace"),railing=document.getElementById("railing"),railingSide=document.getElementById("railingSide"),handrail=document.getElementById("handrail"),balusterStyle=document.getElementById("balusterStyle"),lighting=document.getElementById("lighting"),lightingMode=document.getElementById("lightingMode"),nightView=document.getElementById("nightView"),widthValue=document.getElementById("widthValue"),heightValue=document.getElementById("heightValue"),depthValue=document.getElementById("depthValue"),stepsValue=document.getElementById("stepsValue"),riseReadout=document.getElementById("riseReadout"),stepsReadout=document.getElementById("stepsReadout"),widthReadout=document.getElementById("widthReadout"),modelDimensions=document.getElementById("modelDimensions"),summaryText=document.getElementById("summaryText"),comfortNote=document.getElementById("comfortNote"),footprintDimensions=document.getElementById("footprintDimensions"),projectedArea=document.getElementById("projectedArea"),landingDimensions=document.getElementById("landingDimensions"),underSpaceMetric=document.getElementById("underSpaceMetric"),underSpaceDimensions=document.getElementById("underSpaceDimensions");scene.background=new THREE.Color(0xf1eee8);scene.fog=new THREE.Fog(0xf1eee8,13,28);
var camera=new THREE.PerspectiveCamera(37,1,.05,100),renderer;
var compactScreen=window.matchMedia("(max-width: 720px)").matches,deviceMemory=Number(navigator.deviceMemory)||0,cores=Number(navigator.hardwareConcurrency)||0,lowPowerDevice=(deviceMemory>0&&deviceMemory<=4)||(cores>0&&cores<=4),pixelRatioLimit=compactScreen?(lowPowerDevice?1.15:1.4):(lowPowerDevice?1.4:1.75);
try{renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:!lowPowerDevice,alpha:false,preserveDrawingBuffer:true});}catch(e){errorBox.hidden=false;return;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,pixelRatioLimit));renderer.shadowMap.enabled=!lowPowerDevice;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
var ambient=new THREE.HemisphereLight(0xfaf7ef,0x786d5d,1.35);scene.add(ambient);
var key=new THREE.DirectionalLight(0xfff4df,2.2);key.position.set(-4,8,6);key.castShadow=true;key.shadow.mapSize.set(compactScreen?512:1024,compactScreen?512:1024);key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;key.shadow.bias=-.0004;scene.add(key);
var fill=new THREE.DirectionalLight(0xffffff,.75);fill.position.set(4,4,-5);scene.add(fill);
var ground=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0xece8df,roughness:.95}));ground.rotation.x=-Math.PI/2;ground.position.y=-.015;ground.receiveShadow=true;scene.add(ground);
var grid=new THREE.GridHelper(20,40,0xc9c1b4,0xded9cf);grid.position.y=.002;grid.material.transparent=true;grid.material.opacity=.48;scene.add(grid);
var woods={oak:{name:"дуб",base:"#a87943",grain:"#684827"},ash:{name:"ясень",base:"#c39a69",grain:"#80603d"},larch:{name:"лиственница",base:"#ae7950",grain:"#714729"},walnut:{name:"американский орех",base:"#704b3c",grain:"#3d2c27"}},woodMats={};
Object.keys(woods).forEach(function(k){var s=woods[k],c=document.createElement("canvas");c.width=512;c.height=256;var x=c.getContext("2d");x.fillStyle=s.base;x.fillRect(0,0,c.width,c.height);if(k==="walnut"){var grad=x.createLinearGradient(0,0,0,256);grad.addColorStop(0,"#81583f");grad.addColorStop(.25,"#674431");grad.addColorStop(.52,"#8a6045");grad.addColorStop(.78,"#5b3b2e");grad.addColorStop(1,"#79533c");x.fillStyle=grad;x.fillRect(0,0,512,256);for(var band=0;band<70;band++){var a=(band*83)%512,phase=(band*29)%256;x.beginPath();x.moveTo(a,0);x.bezierCurveTo(a+18*Math.sin(phase),70,a-14*Math.cos(phase),180,a+8*Math.sin(phase+1),256);x.strokeStyle=band%5===0?"#36251f":(band%2?"#bb8b61":"#4a3026");x.globalAlpha=band%5===0?.25:.12;x.lineWidth=band%5===0?2.4:1.1;x.stroke();}[[112,86],[368,186]].forEach(function(knot){x.save();x.translate(knot[0],knot[1]);x.scale(1,.45);for(var ring=0;ring<5;ring++){x.beginPath();x.ellipse(0,0,4+ring*3,3+ring*2,.12,0,Math.PI*2);x.strokeStyle=ring%2?"#bd906a":"#40291f";x.globalAlpha=.22;x.lineWidth=1;x.stroke();}x.restore();});}else{for(var i=0;i<48;i++){var a=(i*37)%512,b=((i%5)-2)*4;x.beginPath();x.moveTo(a,0);x.bezierCurveTo(a+b,72,a-b,178,a+b*.4,256);x.strokeStyle=s.grain;x.globalAlpha=.08+(i%4)*.025;x.lineWidth=i%7===0?2:1;x.stroke();}}x.globalAlpha=1;var t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.2,1);woodMats[k]=new THREE.MeshStandardMaterial({map:t,roughness:k==="walnut"?.57:.66});});
var materialTexturePaths={oak:{src:"./assets/images/materials/oak.jpg",filter:"brightness(1.22) sepia(.12) saturate(1.05)"},ash:{src:"./assets/images/materials/yasen.jpg",filter:"brightness(1.02) saturate(.95)"},larch:{src:"./assets/images/materials/listvennitsa.jpg",filter:"brightness(.98) sepia(.08) saturate(1.1)"},walnut:{src:"./assets/images/materials/american-walnut.jpg",filter:"brightness(.58) contrast(1.16) saturate(1.08)"}};
var materialTextureState={};
function loadMaterialTexture(k){
  if(!materialTexturePaths[k]||materialTextureState[k])return;
  materialTextureState[k]="loading";
  new THREE.TextureLoader().load(materialTexturePaths[k].src,function(sourceTexture){
    var image=sourceTexture.image,texture=sourceTexture;
    if(image&&image.width&&image.height){
      var sourceWidth=image.naturalWidth||image.width,sourceHeight=image.naturalHeight||image.height;
      // Keep large material previews sharp, while reducing GPU texture memory
      // on older phones. The full-resolution source remains available in the
      // close-up material dialog.
      var textureLimit=lowPowerDevice?768:(compactScreen?1024:1254);
      var scale=Math.min(1,textureLimit/Math.max(sourceWidth,sourceHeight));
      var c=document.createElement("canvas");c.width=Math.max(1,Math.round(sourceWidth*scale));c.height=Math.max(1,Math.round(sourceHeight*scale));
      var context=c.getContext("2d");context.filter=materialTexturePaths[k].filter;context.drawImage(image,0,0,c.width,c.height);
      texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;sourceTexture.dispose();
    }
    texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1.2,1);
    var fallback=woodMats[k].map;woodMats[k].map=texture;woodMats[k].needsUpdate=true;if(fallback)fallback.dispose();
    materialTextureState[k]="loaded";render();
  },undefined,function(){materialTextureState[k]="failed";});
}
loadMaterialTexture(wood.value);
var steel=new THREE.MeshStandardMaterial({color:0x343c37,metalness:.72,roughness:.34}),riserMats={white:new THREE.MeshStandardMaterial({color:0xf2efe8,roughness:.78}),gray:new THREE.MeshStandardMaterial({color:0x858681,roughness:.72}),stone:new THREE.MeshStandardMaterial({color:0xaaa69c,roughness:.88}),marble:new THREE.MeshStandardMaterial({color:0xe4e0d8,roughness:.28})},glassMat=new THREE.MeshPhysicalMaterial({color:0xb8d2d4,transparent:true,opacity:.23,roughness:.12,metalness:.02,depthWrite:false,side:THREE.DoubleSide}),model=null,lightingStrips=[],lightingTimer=null;
var view={yaw:.72,pitch:.34,distance:7.5,fitDistance:7.5,zoom:1,target:new THREE.Vector3(0,1.3,0),drag:false,x:0,y:0};
function addBox(g,a,b,c,x,y,z,mat){var m=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);}
function addBeam(g,a,b,w,d,mat){var v=new THREE.Vector3(b.x-a.x,b.y-a.y,b.z-a.z),len=v.length();if(len<.001)return;var m=new THREE.Mesh(new THREE.BoxGeometry(w,len,d),mat);m.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());m.castShadow=true;m.receiveShadow=true;g.add(m);}
function addShoePanel(g,o,side){var profile=[],topOffset=.018,fasciaHeight=.15,thickness=.05,crossX=-o.dz,crossZ=o.dx;for(var i=0;i<o.count;i++){var topY=(o.base+i+1)*o.rise-topOffset;if(i===0)profile.push([0,topY]);profile.push([(i+1)*o.depth,topY]);if(i<o.count-1)profile.push([(i+1)*o.depth,(o.base+i+2)*o.rise-topOffset]);}var shape=new THREE.Shape();shape.moveTo(profile[0][0],profile[0][1]);for(var p=1;p<profile.length;p++)shape.lineTo(profile[p][0],profile[p][1]);for(var q=profile.length-1;q>=0;q--)shape.lineTo(profile[q][0],profile[q][1]-fasciaHeight);shape.closePath();var geometry=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false,steps:1});geometry.translate(0,0,-thickness/2);var edge=side*(o.width/2+.003),panel=new THREE.Mesh(geometry,woodMats[o.wood]);panel.position.set(o.x+crossX*edge,0,o.z+crossZ*edge);panel.rotation.y=Math.atan2(-o.dz,o.dx);panel.castShadow=true;panel.receiveShadow=true;g.add(panel);}
function addGlassPanel(g,o,side,startStep,stepCount){var fullRun=stepCount*o.depth,panelGap=.012,run=Math.max(.04,fullRun-panelGap*2),startInset=Math.min(panelGap,fullRun*.2),lowStart=(o.base+startStep)*o.rise+.08+(startInset/o.depth)*o.rise,lowEnd=(o.base+startStep+stepCount)*o.rise+.08-(startInset/o.depth)*o.rise,panelHeight=.88,crossX=-o.dz,crossZ=o.dx,edge=side*(o.width*.5+.1),startX=o.x+o.dx*(startStep*o.depth+startInset),startZ=o.z+o.dz*(startStep*o.depth+startInset),shape=new THREE.Shape();shape.moveTo(0,lowStart);shape.lineTo(run,lowEnd);shape.lineTo(run,lowEnd+panelHeight);shape.lineTo(0,lowStart+panelHeight);shape.closePath();var geometry=new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false,steps:1}),panel=new THREE.Mesh(geometry,glassMat);panel.position.set(startX+crossX*edge,0,startZ+crossZ*edge);panel.rotation.y=Math.atan2(-o.dz,o.dx);panel.castShadow=false;panel.receiveShadow=false;g.add(panel);}
function addClosedStringer(g,o,side){var profile=[],plateHeight=.14,plateThickness=.065,crossX=-o.dz,crossZ=o.dx,edge=side*(o.width*.5-.025);profile.push([0,(o.base+1)*o.rise-.028]);for(var i=0;i<o.count;i++){profile.push([(i+1)*o.depth,(o.base+i+1)*o.rise-.028]);if(i<o.count-1)profile.push([(i+1)*o.depth,(o.base+i+2)*o.rise-.028]);}var shape=new THREE.Shape();shape.moveTo(profile[0][0],profile[0][1]);for(var p=1;p<profile.length;p++)shape.lineTo(profile[p][0],profile[p][1]);for(var q=profile.length-1;q>=0;q--)shape.lineTo(profile[q][0],profile[q][1]-plateHeight);shape.closePath();var geometry=new THREE.ExtrudeGeometry(shape,{depth:plateThickness,bevelEnabled:false,steps:1});geometry.translate(0,0,-plateThickness/2);var plate=new THREE.Mesh(geometry,steel);plate.position.set(o.x+crossX*edge,0,o.z+crossZ*edge);plate.rotation.y=Math.atan2(-o.dz,o.dx);plate.castShadow=true;plate.receiveShadow=true;g.add(plate);}
function addUnderStairStorage(g,o,mode){
  if(!mode||mode==="none")return;
  // Keep the enclosure tucked just below the actual underside of the stair
  // boards at both ends. The old start/end offsets left a visible triangular
  // opening near the first tread and a larger gap below the last one.
  var run=o.count*o.depth,underBoardClearance=.004,topStart=Math.max(.035,(o.base+1)*o.rise-.055-underBoardClearance),topEnd=Math.max(topStart+.04,(o.base+o.count)*o.rise-.055-underBoardClearance),profile=[[0,0],[run,0],[run,topEnd],[0,topStart]],shape=new THREE.Shape();
  shape.moveTo(profile[0][0],profile[0][1]);for(var p=1;p<profile.length;p++)shape.lineTo(profile[p][0],profile[p][1]);shape.closePath();
  var crossX=-o.dz,crossZ=o.dx,thickness=.024,mat=woodMats[o.wood];
  [-1,1].forEach(function(side){var geometry=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false,steps:1});geometry.translate(0,0,-thickness/2);var edge=side*(o.width/2-.035),panel=new THREE.Mesh(geometry,mat);panel.position.set(o.x+crossX*edge,0,o.z+crossZ*edge);panel.rotation.y=Math.atan2(-o.dz,o.dx);panel.castShadow=true;panel.receiveShadow=true;g.add(panel);});
  if(mode==="closed")return;
  // Add real inset facade panels on both visible sides. Previously only thin
  // divider/handle lines were drawn, so the selected cabinet looked like an
  // empty frame instead of doors or drawers.
  var facadeMat=woodMats[o.wood],gap=.018,facadeThickness=.012,facadeSides=[-1,1];
  facadeSides.forEach(function(side){
    var edge=side*(o.width/2-.035),faceOffset=side*(thickness/2+facadeThickness/2+.002);
    function addFacade(points){
      if(points.length<3)return;
      var panelShape=new THREE.Shape();panelShape.moveTo(points[0][0],points[0][1]);
      for(var i=1;i<points.length;i++)panelShape.lineTo(points[i][0],points[i][1]);
      panelShape.closePath();
      var geometry=new THREE.ExtrudeGeometry(panelShape,{depth:facadeThickness,bevelEnabled:false,steps:1});
      geometry.translate(0,0,-facadeThickness/2);
      var panel=new THREE.Mesh(geometry,facadeMat);
      panel.position.set(o.x+crossX*edge+crossX*faceOffset,0,o.z+crossZ*edge+crossZ*faceOffset);
      panel.rotation.y=Math.atan2(-o.dz,o.dx);panel.castShadow=true;panel.receiveShadow=true;g.add(panel);
    }
    function roofAt(u){return topStart+(topEnd-topStart)*(u/run);}
    if(mode==="doors"){
      var cuts=[0,run/3,run*2/3,run];
      for(var door=0;door<3;door++){
        var x0=cuts[door]+(door?gap/2:0),x1=cuts[door+1]-(door<2?gap/2:0);
        var y0=Math.max(.055,roofAt(x0)-gap),y1=Math.max(.055,roofAt(x1)-gap);
        if(y1>.08){
          addFacade([[x0,.025],[x1,.025],[x1,y1],[x0,y0]]);
          var pullRun=x1-.045,pullY=(y0+y1)/2,pullCross=edge+faceOffset+side*.012;
          addBeam(g,
            {x:o.x+o.dx*pullRun+crossX*pullCross,y:pullY-.045,z:o.z+o.dz*pullRun+crossZ*pullCross},
            {x:o.x+o.dx*pullRun+crossX*pullCross,y:pullY+.045,z:o.z+o.dz*pullRun+crossZ*pullCross},
            .014,.014,steel);
        }
      }
    }else{
      // Divide drawers into bays. The top drawer in each bay follows the stair
      // slope, keeping the facade below the flight instead of cutting through it.
      var drawerGap=.018,bayCuts=[0,run/3,run*2/3,run];
      for(var bay=0;bay<3;bay++){
        var left=bayCuts[bay]+(bay?drawerGap/2:0),right=bayCuts[bay+1]-(bay<2?drawerGap/2:0);
        var roofLeft=roofAt(left)-.035,roofRight=roofAt(right)-.035;
        var usableHeight=Math.min(roofLeft,roofRight)-.025;
        if(right-left<.12||usableHeight<.16)continue;
        var drawerRows=Math.max(1,Math.min(5,Math.floor((usableHeight+drawerGap)/.38)));
        var drawerHeight=(usableHeight-(drawerRows-1)*drawerGap)/drawerRows;
        for(var row=0;row<drawerRows;row++){
          var bottom=.025+row*(drawerHeight+drawerGap),isTop=row===drawerRows-1;
          var topLeft=isTop?roofLeft:bottom+drawerHeight,topRight=isTop?roofRight:bottom+drawerHeight;
          if(Math.min(topLeft,topRight)-bottom<.11)continue;
          addFacade([[left,bottom],[right,bottom],[right,topRight],[left,topLeft]]);
          var handleX=(left+right)/2,handleY=bottom+(Math.min(topLeft,topRight)-bottom)*.55;
          addBeam(g,
            {x:o.x+o.dx*(handleX-.035)+crossX*(edge+faceOffset+side*.009),y:handleY,z:o.z+o.dz*(handleX-.035)+crossZ*(edge+faceOffset+side*.009)},
            {x:o.x+o.dx*(handleX+.035)+crossX*(edge+faceOffset+side*.009),y:handleY,z:o.z+o.dz*(handleX+.035)+crossZ*(edge+faceOffset+side*.009)},
            .012,.012,steel);
        }
      }
    }
  });
}
function addRoundBaluster(g,x,y,z,height,mat){var mesh=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,height,12),mat);mesh.position.set(x,y+height/2,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}
function addClassicBaluster(g,x,y,z,height,mat){var profile=[[.025,0],[.025,.08],[.041,.13],[.03,.19],[.026,.48],[.038,.55],[.028,.64],[.041,.7],[.025,.75],[.025,.84]],points=profile.map(function(p){return new THREE.Vector2(p[0],p[1]*(height/.84));}),mesh=new THREE.Mesh(new THREE.LatheGeometry(points,12),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}
function clearModel(){if(model){model.traverse(function(o){if(o.geometry)o.geometry.dispose();if(o.material&&o.material.userData&&o.material.userData.disposeOnRebuild)o.material.dispose();});scene.remove(model);}}
function flight(g,o){
  var crossX=-o.dz,crossZ=o.dx,board=.055,alongX=Math.abs(o.dx)>.5;
  for(var i=0;i<o.count;i++){
    var d=(i+.5)*o.depth,x=o.x+o.dx*d,z=o.z+o.dz*d,y=(o.base+i+1)*o.rise-board/2;
    addBox(g,alongX?o.depth:o.width,board,alongX?o.width:o.depth,x,y,z,woodMats[o.wood]);
    if(o.risers!=="none"){
      // Extend the riser into both neighboring treads. This closes the visible
      // seams while keeping its front face flush with the front edge of the tread.
      var riserOverlap=.006,riserHeight=Math.max(.08,o.rise-board+2*riserOverlap),riserY=(o.base+i+.5)*o.rise-board/2;
      // Place the riser at the lower/front edge of its tread. The previous
      // position used the upper/back edge, so risers appeared one tread too far
      // forward when viewed from below. Its board-thick footprint overlaps the
      // tread above and the tread below to keep the closed face continuous.
      // Give the riser a small hidden overlap into the lower tread along the
      // walking direction as well. Vertical overlap alone left a coplanar seam
      // at the tread edge, which could read as a thin gap in the 3D preview.
      var riserDepth=board+riserOverlap,riserWidth=o.width+.006,riserX=x-o.dx*(o.depth/2-board/2)-o.dx*riserOverlap/2,riserZ=z-o.dz*(o.depth/2-board/2)-o.dz*riserOverlap/2;
      addBox(g,alongX?riserDepth:riserWidth,riserHeight,alongX?riserWidth:riserDepth,riserX,riserY,riserZ,riserMats[o.risers]);
    }
  }
  if(o.shoes!=="none"){
    // One continuous wood fascia per selected side avoids visible seams between treads.
    // The side vector is the right-hand side when looking up the flight.
    // Use -1 for the visitor's left and +1 for the visitor's right.
    var shoeSides=o.shoes==="both"?[-1,1]:[o.shoes==="left"?-1:1];
    shoeSides.forEach(function(side){addShoePanel(g,o,side);});
  }
  if(o.frame==="closed")[-1,1].forEach(function(side){addClosedStringer(g,o,side);});
  else{var offsets=o.frame==="mono"?[0]:[-o.width*.42,o.width*.42];offsets.forEach(function(off){var ax=o.x+crossX*off,az=o.z+crossZ*off,bx=o.x+o.dx*o.count*o.depth+crossX*off,bz=o.z+o.dz*o.count*o.depth+crossZ*off,t=o.frame==="mono"?.105:.075;addBeam(g,{x:ax,y:o.base*o.rise-.04,z:az},{x:bx,y:(o.base+o.count)*o.rise-.09,z:bz},t,t,steel);});}
  if(o.railing!=="none"){
    var railingSides=o.railingSide==="both"?[-1,1]:[o.railingSide==="right"?1:-1];
    railingSides.forEach(function(side){
      var edge=side*(o.width*.5+.1);
      if(o.railing==="glass"){
        // Separate the long glass wall into manageable panels with slim steel joints.
        var panelSteps=3;
        for(var p=0;p<o.count;p+=panelSteps){
          var panelCount=Math.min(panelSteps,o.count-p),panelStartY=(o.base+p)*o.rise+.08,panelEndY=(o.base+p+panelCount)*o.rise+.08;
          addGlassPanel(g,o,side,p,panelCount);
          var postX=o.x+o.dx*p*o.depth+crossX*edge,postZ=o.z+o.dz*p*o.depth+crossZ*edge;
          addBeam(g,{x:postX,y:panelStartY,z:postZ},{x:postX,y:panelStartY+.88,z:postZ},.018,.018,steel);
          if(p+panelCount===o.count){var endX=o.x+o.dx*(p+panelCount)*o.depth+crossX*edge,endZ=o.z+o.dz*(p+panelCount)*o.depth+crossZ*edge;addBeam(g,{x:endX,y:panelEndY,z:endZ},{x:endX,y:panelEndY+.88,z:endZ},.018,.018,steel);}
        }
        if(o.handrail!=="none"){
          var gsx=o.x+crossX*edge,gsz=o.z+crossZ*edge,gex=o.x+o.dx*o.count*o.depth+crossX*edge,gez=o.z+o.dz*o.count*o.depth+crossZ*edge,gsy=o.base*o.rise+.96,gey=(o.base+o.count)*o.rise+.96,glassRailMat=o.handrail==="wood"?woodMats[o.wood]:steel,glassRailSize=o.handrail==="wood"?.052:.042;
          addBeam(g,{x:gsx,y:gsy,z:gsz},{x:gex,y:gey,z:gez},glassRailSize,glassRailSize,glassRailMat);
        }
      }else{
        var balusterCount=o.count*2,balusterMat=o.balusterStyle==="classic"?woodMats[o.wood]:steel;
        for(var j=0;j<=balusterCount;j++){
          var stairPosition=j/2,px=o.x+o.dx*stairPosition*o.depth+crossX*edge,pz=o.z+o.dz*stairPosition*o.depth+crossZ*edge,py=(o.base+stairPosition)*o.rise+.06,balusterHeight=.84;
          if(o.balusterStyle==="round")addRoundBaluster(g,px,py,pz,balusterHeight,balusterMat);
          else if(o.balusterStyle==="classic")addClassicBaluster(g,px,py,pz,balusterHeight,balusterMat);
          else addBox(g,.035,balusterHeight,.035,px,py+balusterHeight/2,pz,balusterMat);
        }
        if(o.handrail!=="none"){
          var sx=o.x+crossX*edge,sz=o.z+crossZ*edge,ex=o.x+o.dx*o.count*o.depth+crossX*edge,ez=o.z+o.dz*o.count*o.depth+crossZ*edge,sy=o.base*o.rise+.88,ey=(o.base+o.count)*o.rise+.88,railMat=o.handrail==="wood"?woodMats[o.wood]:steel,railSize=o.handrail==="wood"?.055:.045;
          addBeam(g,{x:sx,y:sy,z:sz},{x:ex,y:ey,z:ez},railSize,railSize,railMat);
        }
      }
    });
  }
  if(o.lighting){
    for(var li=0;li<o.count;li++){
      var lx=o.x+o.dx*(li+.5)*o.depth,lz=o.z+o.dz*(li+.5)*o.depth;
var ledMaterial=new THREE.MeshStandardMaterial({color:0xffdca0,emissive:0xff9838,emissiveIntensity:1.7,roughness:.28});ledMaterial.userData.disposeOnRebuild=true;
      // LEDs run across the tread, perpendicular to the direction of travel.
      var ledGeometry=alongX?new THREE.BoxGeometry(.022,.012,o.width*.76):new THREE.BoxGeometry(o.width*.76,.012,.022);
      var ledStrip=new THREE.Mesh(ledGeometry,ledMaterial);ledStrip.position.set(lx,(o.base+li+1)*o.rise-.065,lz);ledStrip.castShadow=false;g.add(ledStrip);lightingStrips.push(ledStrip);
    }
  }
}
function landing(g,x,z,y,sx,sz,wood){addBox(g,sx,.065,sz,x,y-.0325,z,woodMats[wood]);var yy=y-.13;addBeam(g,{x:x-sx*.43,y:yy,z:z-sz*.43},{x:x+sx*.43,y:yy,z:z-sz*.43},.065,.065,steel);addBeam(g,{x:x-sx*.43,y:yy,z:z+sz*.43},{x:x+sx*.43,y:yy,z:z+sz*.43},.065,.065,steel);}
function render(){renderer.render(scene,camera);}function updateCamera(){var h=view.distance*Math.cos(view.pitch);camera.position.set(view.target.x+h*Math.sin(view.yaw),view.target.y+view.distance*Math.sin(view.pitch),view.target.z+h*Math.cos(view.yaw));camera.lookAt(view.target);}
function fitView(){if(!model)return;var bounds=new THREE.Box3().setFromObject(model);if(bounds.isEmpty())return;var sphere=bounds.getBoundingSphere(new THREE.Sphere()),tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),aspect=Math.max(camera.aspect,.7),tanX=tanY*aspect,fit=sphere.radius/Math.sin(Math.atan(Math.min(tanX,tanY)));view.target.copy(sphere.center);view.fitDistance=Math.max(4.2,fit*(camera.aspect<.85?1.38:1.2));view.distance=Math.max(3.2,Math.min(22,view.fitDistance*view.zoom));updateCamera();}
function updateSummary(){var w=+width.value,h=+height.value,d=+depth.value,n=+steps.value,r=Math.round(h/n),names={straight:"Прямая лестница",l:"Г-образная лестница",u:"П-образная лестница"},frames={"open-double":"открытый каркас · два боковых косоура",mono:"открытый каркас · центральный косоур",closed:"закрытый каркас"},riserNames={none:"без подступенников",white:"белые подступенники",gray:"серые подступенники",stone:"светлый камень",marble:"белый мрамор"},shoeNames={none:"без боковой обшивки",left:"боковая обшивка слева при подъёме",right:"боковая обшивка справа при подъёме",both:"боковая обшивка с двух сторон"};widthValue.textContent=w+" мм";heightValue.textContent=h+" мм";depthValue.textContent=d+" мм";stepsValue.textContent=n;riseReadout.textContent=r+" мм";stepsReadout.textContent=n;widthReadout.textContent=w+" мм";modelDimensions.textContent=w+" × "+h+" мм";summaryText.textContent=names[shape.value]+" · "+woods[wood.value].name+" · "+frames[frame.value]+" · "+riserNames[risers.value]+" · "+shoeNames[shoes.value]+" · "+({none:"без ограждения",glass:"стеклянное ограждение",balusters:"балясины"}[railing.value])+" · "+(lighting.checked?"подсветка · "+(lightingMode.value==="smart"?"умный режим":"стандартный режим")+(nightView.checked?" · ночной вид":""):"без подсветки");comfortNote.textContent=r>220?"Подъём получается высоким. Проверьте число ступеней и высоту с инженером мастерской.":r<150?"Подъём получается низким. Проверьте удобство шага и проём с инженером мастерской.":d<250?"Глубина проступи небольшая. Итоговую эргономику проверит инженер на замере.":"Предварительная визуализация помогает сравнить варианты и не заменяет инженерный проект и замер.";}
var updateSummaryBase=updateSummary;
function updateSpaceReadouts(){
  var w=+width.value/1000,d=+depth.value/1000,n=+steps.value;
  var first=Math.ceil(n/2),last=n-first,gap=.18,spanX=n*d,spanZ=w,landingX=0,landingZ=0;
  if(shape.value==="l"){
    spanX=first*d+w/2;
    spanZ=last*d+w;
    landingX=w;landingZ=w;
  }else if(shape.value==="u"){
    spanX=first*d+w/2;
    spanZ=2*w+gap;
    landingX=w;landingZ=2*w+gap;
  }
  var envelopeArea=spanX*spanZ;
  footprintDimensions.textContent=Math.round(spanX*1000)+" × "+Math.round(spanZ*1000)+" мм";
  projectedArea.textContent=envelopeArea.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})+" м²";
  landingDimensions.textContent=landingX?Math.round(landingX*1000)+" × "+Math.round(landingZ*1000)+" мм":"Без площадки";
  if(underSpaceMetric&&underSpaceDimensions){
    var hasUnderSpace=underSpace&&underSpace.value!=="none";
    underSpaceMetric.hidden=!hasUnderSpace;
    if(hasUnderSpace){
      var storageSteps=shape.value==="straight"?n:first;
      var storageRun=storageSteps*d;
      var firstRise=(+height.value/1000)/n;
      var maxStorageHeight=Math.max(Math.max(.035,firstRise-.059)+.04,storageSteps*firstRise-.059);
      underSpaceDimensions.textContent=Math.round(storageRun*1000)+" × "+Math.round(w*1000)+" мм · до "+Math.round(maxStorageHeight*1000)+" мм";
    }
  }
  drawFootprintPlan(w,d,n,first,last,gap);
}
function drawFootprintPlan(w,d,n,first,last,gap){
  if(!footprintPlanShape)return;
  var parts=[],tx=first*d,side=(w+gap)/2;
  function add(x,z,sx,sz,cls){parts.push({x:x,z:z,sx:sx,sz:sz,cls:cls||"footprint-plan__tread"});}
  if(shape.value==="straight"){
    for(var i=0;i<n;i++)add(i*d,-w/2,d,w);
  }else if(shape.value==="l"){
    for(var a=0;a<first;a++)add(a*d,-w/2,d,w);
    add(tx-w/2,-w/2,w,w,"footprint-plan__landing");
    for(var b=0;b<last;b++)add(tx-w/2,w/2+b*d,w,d);
  }else{
    for(var c=0;c<first;c++)add(c*d,-side-w/2,d,w);
    add(tx-w/2,-(w+gap/2),w,2*w+gap,"footprint-plan__landing");
    for(var e=0;e<last;e++)add(tx-(e+1)*d,side-w/2,d,w);
  }
  var minX=Infinity,minZ=Infinity,maxX=-Infinity,maxZ=-Infinity;
  parts.forEach(function(p){minX=Math.min(minX,p.x);minZ=Math.min(minZ,p.z);maxX=Math.max(maxX,p.x+p.sx);maxZ=Math.max(maxZ,p.z+p.sz);});
  var worldW=Math.max(maxX-minX,.01),worldZ=Math.max(maxZ-minZ,.01),scale=Math.min(208/worldW,108/worldZ),offsetX=(240-worldW*scale)/2,offsetY=(140-worldZ*scale)/2;
  footprintPlanShape.replaceChildren();
  parts.forEach(function(p){
    var rect=document.createElementNS("http://www.w3.org/2000/svg","rect");
    rect.setAttribute("class",p.cls);
    rect.setAttribute("x",(offsetX+(p.x-minX)*scale).toFixed(2));
    rect.setAttribute("y",(offsetY+(p.z-minZ)*scale).toFixed(2));
    rect.setAttribute("width",Math.max(1,p.sx*scale).toFixed(2));
    rect.setAttribute("height",Math.max(1,p.sz*scale).toFixed(2));
    rect.setAttribute("rx","1.2");
    footprintPlanShape.appendChild(rect);
  });
  var dimensionGroup=document.getElementById("footprintPlanDimensions");
  if(!dimensionGroup)return;
  dimensionGroup.replaceChildren();
  var NS="http://www.w3.org/2000/svg";
  function addDimension(x1,y1,x2,y2,label,tx,ty,rotation){
    var line=document.createElementNS(NS,"line");
    line.setAttribute("class","footprint-plan__dimension");
    line.setAttribute("x1",x1);line.setAttribute("y1",y1);line.setAttribute("x2",x2);line.setAttribute("y2",y2);
    dimensionGroup.appendChild(line);
    var text=document.createElementNS(NS,"text");
    text.setAttribute("class","footprint-plan__dimension-label");
    text.setAttribute("text-anchor","middle");text.setAttribute("x",tx);text.setAttribute("y",ty);
    if(rotation)text.setAttribute("transform","rotate("+rotation+" "+tx+" "+ty+")");
    text.textContent=label;dimensionGroup.appendChild(text);
  }
  var planRight=offsetX+worldW*scale,planBottom=offsetY+worldZ*scale;
  var widthLabel=Math.round(worldW*1000).toLocaleString("ru-RU").replace(/\u00a0/g," ")+" мм";
  var depthLabel=Math.round(worldZ*1000).toLocaleString("ru-RU").replace(/\u00a0/g," ")+" мм";
  addDimension(offsetX,130,planRight,130,widthLabel,(offsetX+planRight)/2,127,0);
  addDimension(230,offsetY,230,planBottom,depthLabel,235,(offsetY+planBottom)/2,90);
}
function updateLightingPreview(){document.querySelectorAll(".lighting-option").forEach(function(el){el.classList.toggle("is-visible",lighting.checked);});var dark=lighting.checked&&nightView.checked;scene.background.set(dark?0x111712:0xf1eee8);scene.fog.color.set(dark?0x111712:0xf1eee8);ambient.intensity=dark?.24:1.35;key.intensity=dark?.42:2.2;fill.intensity=dark?.12:.75;ground.material.color.set(dark?0x1b211c:0xece8df);grid.material.opacity=dark?.18:.48;if(lightingTimer){clearInterval(lightingTimer);lightingTimer=null;}lightingStrips.forEach(function(strip){strip.material.emissiveIntensity=lighting.checked?1.7:0;});if(lighting.checked&&lightingMode.value==="smart"&&lightingStrips.length&&!document.hidden){var active=-1;lightingTimer=setInterval(function(){active=(active+1)%lightingStrips.length;lightingStrips.forEach(function(strip,i){strip.material.emissiveIntensity=i===active?5.2:.08;});render();},145);}render();}
document.addEventListener("visibilitychange",function(){if(lighting.checked&&lightingMode.value==="smart")updateLightingPreview();});
updateSummary=function(){var hasRailing=railing.value!=="none";railingSide.closest(".field").style.display=hasRailing?"":"none";handrail.closest(".field").style.display=hasRailing?"":"none";balusterStyle.closest(".field").style.display=railing.value==="balusters"?"":"none";updateSummaryBase();updateSpaceReadouts();var storageNames={none:"пространство под лестницей открыто",closed:"закрытая обшивка под первым маршем",doors:"шкаф с фасадами под первым маршем",drawers:"выдвижные ящики под первым маршем"};summaryText.textContent+=" · "+storageNames[underSpace.value];if(underSpace.value!=="none"&&underSpaceDimensions){summaryText.textContent+=" · ориентировочный габарит эскиза под маршем "+underSpaceDimensions.textContent;}if(hasRailing){var handrailNames={wood:"деревянный поручень",metal:"металлический поручень",none:"без поручня"};summaryText.textContent+=" · "+({left:"слева при подъёме",right:"справа при подъёме",both:"с обеих сторон"}[railingSide.value]||"")+" · "+handrailNames[handrail.value];if(railing.value==="balusters"){var balusterNames={square:"квадратные стойки",round:"круглые металлические",classic:"классические деревянные балясины"};summaryText.textContent+=" · "+balusterNames[balusterStyle.value];}}};
function rebuild(){var w=+width.value/1000,h=+height.value/1000,d=+depth.value/1000,n=+steps.value,r=h/n,s=shape.value,f=frame.value,woodKey=wood.value,riserKey=risers.value,shoeKey=shoes.value;if(lightingTimer){clearInterval(lightingTimer);lightingTimer=null;}lightingStrips=[];clearModel();model=new THREE.Group();scene.add(model);var first=Math.ceil(n/2),last=n-first,gap=.18;
if(s==="straight")flight(model,{x:0,z:0,dx:1,dz:0,base:0,count:n,width:w,depth:d,rise:r,frame:f,wood:woodKey,risers:riserKey,shoes:shoeKey,railing:railing.value,railingSide:railingSide.value,handrail:handrail.value,balusterStyle:balusterStyle.value,lighting:lighting.checked});
else if(s==="l"){flight(model,{x:0,z:0,dx:1,dz:0,base:0,count:first,width:w,depth:d,rise:r,frame:f,wood:woodKey,risers:riserKey,shoes:shoeKey,railing:railing.value,railingSide:railingSide.value,handrail:handrail.value,balusterStyle:balusterStyle.value,lighting:lighting.checked});var cx=first*d;landing(model,cx,0,first*r,w,w,woodKey);flight(model,{x:cx,z:w/2,dx:0,dz:1,base:first,count:last,width:w,depth:d,rise:r,frame:f,wood:woodKey,risers:riserKey,shoes:shoeKey,railing:railing.value,railingSide:railingSide.value,handrail:handrail.value,balusterStyle:balusterStyle.value,lighting:lighting.checked});}
else{var side=(w+gap)/2;flight(model,{x:0,z:-side,dx:1,dz:0,base:0,count:first,width:w,depth:d,rise:r,frame:f,wood:woodKey,risers:riserKey,shoes:shoeKey,railing:railing.value,railingSide:railingSide.value,handrail:handrail.value,balusterStyle:balusterStyle.value,lighting:lighting.checked});var tx=first*d;landing(model,tx,0,first*r,w,2*w+gap,woodKey);flight(model,{x:tx,z:side,dx:-1,dz:0,base:first,count:last,width:w,depth:d,rise:r,frame:f,wood:woodKey,risers:riserKey,shoes:shoeKey,railing:railing.value,railingSide:railingSide.value,handrail:handrail.value,balusterStyle:balusterStyle.value,lighting:lighting.checked});}
if(underSpace.value!=="none"){var storageCount=s==="straight"?n:first,storageZ=s==="u"?-(w+gap)/2:0;addUnderStairStorage(model,{x:0,z:storageZ,dx:1,dz:0,base:0,count:storageCount,width:w,depth:d,rise:r,wood:woodKey},underSpace.value);}
var bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3());model.position.x-=center.x;model.position.z-=center.z;fitView();updateCamera();updateSummary();updateLightingPreview();var detailedConfig=summaryText.textContent+" · ширина марша "+Math.round(w*1000)+" мм · высота этажа "+Math.round(h*1000)+" мм · глубина ступени "+Math.round(d*1000)+" мм · "+n+" подъёмов · подъём "+Math.round(r*1000)+" мм · габарит в плане "+footprintDimensions.textContent+" · площадь по внешним габаритам "+projectedArea.textContent+(landingDimensions.textContent!=="Без площадки"?" · площадка "+landingDimensions.textContent:"");var discussUrl=new URL("./index.html",window.location.href);discussUrl.searchParams.set("stair_config",detailedConfig.slice(0,500));discussUrl.hash="contact";document.querySelector(".submit-link").href=discussUrl.href;}
function resize(){var rect=wrap.getBoundingClientRect();if(rect.width<1||rect.height<1)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();render();}
var rangeRebuildTimer=0;
function scheduleRangeRebuild(){updateSummary();if(rangeRebuildTimer)return;rangeRebuildTimer=window.setTimeout(function(){rangeRebuildTimer=0;rebuild();},90);}
function flushRangeRebuild(){if(rangeRebuildTimer){window.clearTimeout(rangeRebuildTimer);rangeRebuildTimer=0;}rebuild();}
["shape","frame","wood","risers","shoes","underSpace","railing","railingSide","handrail","balusterStyle","lighting"].forEach(function(id){document.getElementById(id).addEventListener("change",rebuild);});
wood.addEventListener("change",function(){loadMaterialTexture(wood.value);});
lightingMode.addEventListener("change",function(){updateLightingPreview();updateSummary();});nightView.addEventListener("change",function(){updateLightingPreview();updateSummary();});
[width,height,depth,steps].forEach(function(input){input.addEventListener("input",scheduleRangeRebuild);input.addEventListener("change",flushRangeRebuild);});
var pointers=new Map();
canvas.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);if(pointers.size===1){view.drag=true;view.x=e.clientX;view.y=e.clientY;canvas.style.cursor="grabbing";}else{view.drag=false;var ps=Array.from(pointers.values());view.pinchDistance=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);}});
canvas.addEventListener("pointermove",function(e){if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>=2){var ps=Array.from(pointers.values()),dist=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);if(view.pinchDistance&&dist>1)view.distance=Math.max(3.2,Math.min(22,view.distance*view.pinchDistance/dist));view.zoom=view.distance/(view.fitDistance||view.distance);view.pinchDistance=dist;updateCamera();render();return;}if(!view.drag)return;var dx=e.clientX-view.x,dy=e.clientY-view.y;view.x=e.clientX;view.y=e.clientY;view.yaw-=dx*.008;view.pitch=Math.max(.12,Math.min(1.2,view.pitch+dy*.006));updateCamera();render();});
function endPointer(e){pointers.delete(e.pointerId);view.pinchDistance=null;if(pointers.size===1){var p=Array.from(pointers.values())[0];view.drag=true;view.x=p.x;view.y=p.y;}else{view.drag=false;canvas.style.cursor="grab";}}
canvas.addEventListener("pointerup",endPointer);canvas.addEventListener("pointercancel",endPointer);
canvas.addEventListener("wheel",function(e){e.preventDefault();view.distance=Math.max(3.2,Math.min(22,view.distance*Math.exp(e.deltaY*.001)));view.zoom=view.distance/(view.fitDistance||view.distance);updateCamera();render();},{passive:false});canvas.addEventListener("contextmenu",function(e){e.preventDefault();});
document.getElementById("resetView").addEventListener("click",function(){view.yaw=.72;view.pitch=.34;view.zoom=1;view.target.set(0,(+height.value/1000)*.48,0);fitView();render();});
document.getElementById("zoomIn").addEventListener("click",function(){view.distance=Math.max(3.2,view.distance*.82);view.zoom=view.distance/(view.fitDistance||view.distance);updateCamera();render();});
document.getElementById("zoomOut").addEventListener("click",function(){view.distance=Math.min(22,view.distance/.82);view.zoom=view.distance/(view.fitDistance||view.distance);updateCamera();render();});
document.getElementById("saveImage").addEventListener("click",function(){render();var a=document.createElement("a");a.download="eskiz-lestnicy.png";a.href=renderer.domElement.toDataURL("image/png");a.click();});
new ResizeObserver(resize).observe(wrap);resize();updateSummary();rebuild();
})();
