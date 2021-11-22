const all_headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
  }
  
  
  addEventListener("fetch", (event) => {
      event.respondWith(
        handleRequest(event.request).catch(
          (err) => new Response(err.stack, { status: 500 })
        )
      );
    });
  
   function parse_path_collection(pathname) {      
        let sp = pathname.split('/')
        let location = ''
        
        console.log(sp)
        
        if(sp.length>4 && sp[3]=='location')
          location = sp[4]
  
        let key = sp[1].slice(0,3) + '_' + sp[2]
  
        return [key, location]
    }
  
    function parse_returns(searchParams) {
        console.log(searchParams)
        let page = searchParams.get('page') ? searchParams.get('page'): 1
        let per_page = searchParams.get('per_page') ? searchParams.get('per_page'): 100
  
        return [page, per_page]
    }
  
    async function handleRequest(request) {
      const { pathname, searchParams } = new URL(request.url);
      console.log(pathname)
      console.log(searchParams)
  
      if (pathname.startsWith("/api")) {
        return new Response(JSON.stringify({ pathname }), {
          headers: all_headers,
        });
      }
  
      if(pathname.startsWith("/industry") || pathname.startsWith("/occupation")) {
        let result = {}
        let [key, location] = parse_path_collection(pathname) 
        let [page, per_page] = parse_returns(searchParams)
        console.log('key: ', key,', location: ', location, ', page:', page, ', per_page:', per_page)
  
        key = key.replace('occ','occupation-name')
        let val1 = await COLLECTION.get('new_' + key)
  
        if(location!='') {
            console.log('t0')
            location = decodeURIComponent(location)
            let key2 = 'new_city_' + location.toLowerCase()
            let val2 = await COLLECTION.get(key2)
            console.log('t01')
            let list1 = JSON.parse(val1)['info']
            let list2 = JSON.parse(val2)['info']
            //console.log(list1)
            //console.log(list2)
  
            // intersection
            let d={}
            for(let k=0;k<list1.length;k++)
            {
                d[list1[k][0]] = 1
            }
  
            console.log('t02')
  
            nr_found = 0
            for(let k=list2.length-1;k>-1;k--) {
                if (list2[k][0] in d)
                  nr_found+=1;
                else
                  list2.splice(k,1)
            }
  
            console.log('nr list1:' + list1.length)
            console.log('nr list2:' + list2.length)
            console.log('nr intersect:' + nr_found)
  
            result['employers'] = list2.slice((page-1)*per_page, page*per_page)
            result['overview'] = { 'nr_employers': list2.length }
  
            return new Response(JSON.stringify(result), {
              headers: all_headers,
          });
  
        }
  
        let value = await COLLECTION.get(key);
        value = JSON.parse(value)
        console.log('t1')
            
        if(location!='') {
            location = decodeURIComponent(location)
            result['employers'] = value[location]['info'].slice((page-1)*per_page, page*per_page)
            result['overview'] = { 'nr_employers': value[location]['info'].length }
        } else {
            result = 'todo'
        }
  
        console.log('t2')
  
        console.log('value: ', value)
        console.log('result: ', result)
  
        return new Response(JSON.stringify(result), {
          headers: all_headers,
        });
      }
    
      if (pathname.startsWith("/orgnr")) {
  
        let sp = pathname.split('/')
        console.log(sp)
        if(sp.length<3 || sp[2] == "" ) {
          return new Response(JSON.stringify({ "error": "no key specified" }), {
              headers: all_headers,
            });
        }
  
        let key = sp[2]
        let value = await COLLECTION.get(key);
        console.log('key: ' + key + ', value: ' + value)
    
        return new Response(value, {
          headers: all_headers,
        });
      }
    
      if (pathname.startsWith("/status")) {
        const httpStatusCode = Number(pathname.split("/")[2]);
    
        return Number.isInteger(httpStatusCode)
          ? fetch("https://http.cat/" + httpStatusCode)
          : new Response("That's not a valid HTTP status code.");
      }
    
      return fetch("https://welcome.developers.workers.dev");
    }