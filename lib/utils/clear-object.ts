const clearObject = (object: any, option: number = 1) => {
  switch (option) {
    // option 1 // ES5
    case 1:
      Object.keys(object).forEach((key) => {
        delete object[key]
      })
      break
    // option 2 // ES6
    case 2:
      for (const key in object) {
        delete object[key]
      }
      break
    // option 3 // ES5: for enumerable and non-enumerable properties
    case 3:
      Object.getOwnPropertyNames(object).forEach(function (key) {
        delete object[key]
      })
      break
    // option 4 // ES6: for enumerable and non-enumerable properties
    case 4:
      for (const key of Object.getOwnPropertyNames(object)) {
        delete object[key]
      }
  }
}

export default clearObject
