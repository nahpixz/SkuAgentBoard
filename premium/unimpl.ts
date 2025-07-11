const createUnimplProxy = (ret:any)=> {
  return new Proxy({}, {
    get(_, method) {
      console.warn(`Feature Only Available On Permium Version.`);
      return ret;
    }
  });
};

export default {
    OPT:createUnimplProxy(''),
    COMP:createUnimplProxy(()=>null),
    ok:false
} 