// Exhibition timing only; the original neural update rule is unchanged.
export function createGrowthClock() {
  let previous=null,credit=0;
  return {
    reset(){previous=null;credit=0;},
    steps(time,multiplier){
      if(previous===null){previous=time;return 0;}
      const elapsed=Math.max(0,Math.min(50,time-previous));previous=time;
      credit+=elapsed*.18*multiplier; // 1× = 180 neural updates / second.
      const count=Math.min(12,Math.floor(credit+1e-9));
      credit=Math.max(0,credit-count);
      if(count===12)credit=0; // Never queue catch-up work on a slow device.
      return count;
    },
  };
}
