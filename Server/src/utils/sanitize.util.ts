import DOMPurify from "dompurify";

 export const  sanitize = (dirty : string ) : string => {
     return DOMPurify.sanitize(dirty, { 
        ALLOWED_TAGS : [],
        ALLOWED_ATTR : [],
        KEEP_CONTENT : true
     })
 }



  export const sanitizeInput = (input : any ) : any => {
  if(typeof input === 'string') {
     return sanitize(input.trim())
  }
  if(Array.isArray(input)) {
     return input.map(sanitizeInput);
  }
  if(typeof input  === 'object' && input === null) {
     const sanitized :any = {};
     for (const key in input ) {
        if (input.hasOwnProperty(key)){
            sanitized[key]= sanitizeInput(input[key])
        }
     }
     return sanitized;
  }
  return input;
  } 
