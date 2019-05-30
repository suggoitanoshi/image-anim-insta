class Photo{
  constructor(src, name){
    this.next = null;
    this.src = src;
    this.name = name;
    this.img = new Image();
    this.img.onload = () => {
      this.loaded = true;
      this.ratio = this.img.width / this.img.height;
    }
    this.img.src = this.src;
    this.loaded = false;
    this.ratio = 1;
    this.ximgToCvsRatio = 1;
    this.yimgToCvsRatio = 1;
    this.scale = 1;
    this.x = 10;
    this.y = 10;
    this.margin = 40;
    this.color = `hsl(${360*Math.random()}, ${65+15*Math.random()}%, ${85+10*Math.random()}%)`;
    this.drawStatic = (ctx)=>{
      this.drawAnim(ctx, 1);
    };
    this.finishedDrawing = function(){};
  }
  changeScale(i){
    this.width = pts.photos.length()>1?(width - this.margin*2) / 1.8:width-(this.margin*2);
    this.height = height * this.width/width;
    this.ratio = this.img.width/this.img.height;
    this.imgToCvsRatio = this.img.width / width;
    switch(i%2){
      case 1:
        this.x = width - (this.margin + this.width);
        break;
      case 0:
        this.x = this.margin;
        break;
      default:
        break;
    }
    if(i > pts.photos.length()/2)
      this.y = height - ((this.margin + height/pts.photos.length())*i/2);
    else
      this.y = this.margin+height/pts.photos.length()*i;
  }
  drawAnim(ctx, percent){
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x-this.margin/4,this.y-this.margin/4, this.width+this.margin/2, (this.width/this.ratio+this.margin/2)*ease(percent));
    ctx.drawImage(this.img, 0, 0, this.img.width,
      this.img.height*ease(percent),
      this.x, this.y, this.width,
      this.width/this.ratio*ease(percent));
  }
}

class PhotoLL{
  constructor(){
    this.head = null;
  }
  add(photo){
    if(this.head == null){
      this.head = photo;
    }
    else{
      let curr = this.head;
      while(curr.next !== null){
        curr = curr.next;
      }
      curr.next = photo;
    }
  }
  get(index){
    if(index > -1){
      let curr = this.head;
      let i = 0;
      while((curr !== null) && (i<index)){
        curr = curr.next;
        i++; 
      }
      return curr !== null ? curr : undefined;
    }
  }
  remove(index){
    if(this.head === null || index < 0){ return; }
    if(index === 0){
      this.head = this.head.next;
      return;
    }
    let curr = this.head;
    let prev = null;
    let i = 0;
    while((curr !== null) && (i<index)){
      prev = curr;
      curr = curr.next;
      i++;
    }
    if(curr !== null){
      prev.next = curr.next;
    }
    return;
  }
  length(){
    let curr = this.head;
    let i = 0;
    if(curr === null){
      return 0;
    }
    while(curr !== null){
      curr = curr.next;
      i++;
    }
    return i;
  }
  *values(){
    let curr = this.head;
    let i = 0;
    while(curr !== null){
      yield {data: curr, index: i};
      curr = curr.next;
      i++;
    }
  }
  [Symbol.iterator]() {
    return this.values();
  }
}

let serverHandler = "localhost:5501";

let pts = new Vue({
  el: '#inputs',
  data: {
    photos: new PhotoLL(),
    isAnimating: false,
    finishAnimating: false,
    savename: ""
  },
  methods: {
    addPhoto(e){
      this.photos.add(new Photo(URL.createObjectURL(e.target.files[0]), e.target.files[0].name));
      this.rescale();
    },
    rmPhoto(i){
      this.photos.remove(i);
      this.rescale();
    },
    draw(){
      ctx.fillStyle = bg;
      ctx.fillRect(0,0,width,height);
      for(p of this.photos){
        p.data.drawStatic(ctx);
      }
    },
    animate(){
      this.finishAnimating = false;
      this.isAnimating = true;
      recorder.start();
      window.requestAnimationFrame(Animate);
    },
    rescale(){
      for(let p of this.photos){
        p.data.changeScale(p.index);
      }
    },
    finishAnimate(){
      this.finishAnimating = true;
      this.isAnimating = false;
      recorder.stop();
    },
    save(){
      recorder.save((this.savename == ""? "instagram.webm":`${this.savename}.webm`));
    }
  }
});
function ease(t){
  return t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1;
}

let canvas = document.getElementById("draft");
let width = window.screen.width;
let height = window.screen.height;
let screenRatio = width/height;
if(width > height){
  let temp = width;
  width = height;
  height = temp;
}
const dpr = window.devicePixelRatio || 1;
canvas.width = width*dpr;
canvas.height = height*dpr;
let ctx = canvas.getContext("2d");
ctx.scale(dpr, dpr);
let bg = "#333";
ctx.fillStyle = bg;
ctx.fillRect(0,0,width,height);

const recorder = new CanvasRecorder(canvas);

elapsed = 0;
vidLength = 10;
function Animate(){
  elapsed++;
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,width,height);
  for(let p of pts.photos){
    p.data.drawAnim(ctx, Math.min((elapsed/30)/(vidLength-4), 1));
  }
  if(elapsed/30 > vidLength){
    elapsed = 0;
    pts.finishAnimate();
    return;
  }
  window.requestAnimationFrame(Animate);
}