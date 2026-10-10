import { Scene, Cube, Sphere, Vector, Triangle, Mesh, toSVG } from '@lnjs/core';
import { random } from './shared-random';
class Tower extends Cube {
  paths() {
    const result = super.paths(), a = this.min, b = this.max;
    for (let z = a.z + .18; z < b.z; z += .18) result.push([new Vector(a.x,a.y,z),new Vector(b.x,a.y,z),new Vector(b.x,b.y,z),new Vector(a.x,b.y,z),new Vector(a.x,a.y,z)]);
    return result;
  }
}
self.onmessage = event => {
  try {
    const rand = random(event.data.seed), mode = event.data.mode || 'city';
    const scene = new Scene();
    if (mode === 'city') {
      for (let x=-5;x<=5;x++) for(let y=-5;y<=5;y++) {
        if(rand()<.22) continue;
        const height = .25 + Math.pow(rand(),1.7)*4.5*(1-Math.hypot(x,y)/12);
        const a = new Vector(x*.65,y*.65,0), b = new Vector(x*.65+.43,y*.65+.43,height);
        scene.add(new Tower(a,b));
        if(height>1.8) scene.add(new Tower(new Vector(a.x+.09,a.y+.09,height),new Vector(b.x-.09,b.y-.09,height+.25+rand()*.6)));
      }
    } else if(mode === 'orbits') {
      for(let i=0;i<14;i++) { const a=i/14*Math.PI*2; scene.add(new Sphere(new Vector(Math.cos(a)*2.2,Math.sin(a)*2.2,Math.sin(a*3)*.7+1.1),.35+rand()*.6)); }
      scene.add(new Sphere(new Vector(0,0,1.1),1.3));
    } else {
      const triangles=[], n=32, phase=rand()*6;
      const vertex=(x,y)=>{const a=(x/n-.5)*7,b=(y/n-.5)*7;return new Vector(a,b,Math.exp(-(a*a+b*b)*.09)*(1.7+Math.sin(a*2+phase)*.55+Math.cos(b*2.2)*.6));};
      for(let x=0;x<n;x++)for(let y=0;y<n;y++){ const a=vertex(x,y),b=vertex(x+1,y),c=vertex(x+1,y+1),d=vertex(x,y+1);triangles.push(new Triangle(a,b,c),new Triangle(a,c,d)); }
      scene.add(new Mesh(triangles));
    }
    const angle=.45+rand()*.8;
    const paths = scene.render(new Vector(Math.cos(angle)*12,Math.sin(angle)*12,9), new Vector(0, 0, 1), new Vector(0, 0, 1), 1000, 630, 38, .1, 100, .04);
    self.postMessage({ svg: toSVG(paths, 1000, 630) });
  } catch (error) { self.postMessage({ error: error.message }); }
};
