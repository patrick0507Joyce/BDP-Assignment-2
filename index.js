function asyncThing (value) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
          if (value <= 3) {
            resolve(value);
          } else {
            reject(value);
          }
      }, 100);
    });
  }
  
  async function main () {
    return Promise.all([1,2,3,4].map(async (value) => {
      return await asyncThing(value);
    }));
  }
  
  main()
    .then(v => console.log(v))
    .catch(err => console.error("err", err));