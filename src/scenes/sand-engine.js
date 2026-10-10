// Small exhibition bridge to Sandspiel's unmodified, official Rust/WASM build.
export async function createSand(bytes,width=192,height=128) {
  let wasm;
  const {instance}=await WebAssembly.instantiate(bytes,{'./sandtable_bg.js':{
    __wbg_random_0c73839ced1bb4a5:Math.random,
    __wbg___wbindgen_throw_dd24417ed36fc46e:(ptr,len)=>{throw Error(new TextDecoder().decode(new Uint8Array(wasm.memory.buffer,ptr,len)));},
    __wbindgen_init_externref_table:()=>{const table=wasm.__wbindgen_externrefs,offset=table.grow(4);table.set(0,undefined);[undefined,null,true,false].forEach((value,i)=>table.set(offset+i,value));},
  }});
  wasm=instance.exports;wasm.__wbindgen_start();
  const pointer=wasm.universe_new(width,height);
  // Upstream encodes still air at 126, not zero. We intentionally omit the
  // separate GPU pressure solver, rather than feeding a permanent headwind.
  const winds=new Uint8Array(wasm.memory.buffer,wasm.universe_winds(pointer),width*height*4);
  for(let i=0;i<winds.length;i+=4){winds[i]=126;winds[i+1]=126;}
  return {
    width,height,
    tick:()=>wasm.universe_tick(pointer),
    reset:()=>wasm.universe_reset(pointer),
    paint:(x,y,size,species)=>wasm.universe_paint(pointer,Math.round(x),Math.round(y),size,species),
    cells:()=>new Uint8Array(wasm.memory.buffer,wasm.universe_cells(pointer),width*height*4),
    dispose:()=>wasm.__wbg_universe_free(pointer,0),
  };
}

export const sandPalette={0:[24,42,52],1:[174,179,164],2:[232,194,116],3:[79,153,204],4:[143,184,167],6:[245,116,57],7:[142,108,73],8:[239,80,43],9:[180,219,226],11:[126,183,114],12:[187,211,86],13:[163,171,168],16:[166,137,174]};
export function renderSand(cells,width,height,target) {
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const source=(x*height+y)*4,index=(y*width+x)*4;
    const color=sandPalette[cells[source]]||[177,167,136], variation=cells[source] ? (cells[source+1]%17)-8 : 0;
    target[index]=color[0]+variation;target[index+1]=color[1]+variation;target[index+2]=color[2]+variation;target[index+3]=255;
  }
}
