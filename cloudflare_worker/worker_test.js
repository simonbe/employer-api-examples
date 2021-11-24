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

  function parse_path(pathname) {
      let sp = pathname.split('/')

      params = {}
      console.log(sp)

      for(let i=1; i<sp.length-1; i+=2) {
          let s = sp[i].toLowerCase()
          
          if(['orgnr', 'city', 'municipality', 'country', 'county', 'industry', 'ssyk', 'free'].indexOf(s) < 0 )
                console.log('warning: ' + s + ' not recognized.')
          else
                params[s] = sp[i+1].toLowerCase()
      }

      return params;
  }

  function intersect(list1, list2) {
      const time_start = Date.now();
      let d={}
      for(const l of list1) {
              d[l[0]] = 1
       }

      nr_found = 0
      for(let k=list2.length-1;k>-1;k--) {
            if (list2[k][0] in d)
                nr_found+=1;
            else
                list2.splice(k,1)
      }
      
      const time_end = Date.now() - time_start
      console.log('timing intersect: ' + time_end)

      return list2
  }

  function create_output(vals, page = 1, per_page = 100) {

      const page_current = (page-1)*per_page
      const result = {'employers': vals.slice(page_current, page*per_page),
                'overview': { 'nr_employers': vals.length, 'current_page': page, 'per_page': per_page } } 

      return result
  }

  function parse_returns(searchParams) {
      console.log(searchParams)
      let page = searchParams.get('page') ? searchParams.get('page'): 1
      let per_page = searchParams.get('per_page') ? Math.min(searchParams.get('per_page'),5000): 100

      return [page, per_page]
  }

  async function handleRequest(request) {
    
    const requestStartTime = Date.now();
    let result = {}
            
    const { pathname, searchParams } = new URL(request.url);
    console.log(pathname)
    console.log(searchParams)

    let params = parse_path(pathname)
    let [page, per_page] = parse_returns(searchParams)
    console.log(params)

    if (false && pathname.startsWith("/orgnr")) {

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

    let is_orgnr = false;
    if(Object.keys(params).length == 1 && Object.keys(params)[0] == 'orgnr')
        is_orgnr = true;

    if(Object.keys(params).length < 3) {
        
        let vals = [];
        const requestStartTime_kv = Date.now();
        
        for(const p of Object.keys(params)) {

            let key = ''
            
            if(is_orgnr)
                key = params[p]
            else
                key = 'new_' + p + '_' + decodeURIComponent(params[p])

            console.log('key: ' + key)
            let val = await COLLECTION.get(key, {type: "json"})

            if (val === null || val === undefined)
                return new Response(JSON.stringify({error:"key not found."}), { headers: all_headers });
            
            if(is_orgnr)
                vals.push(val)
            else
                vals.push(val['info'])
        }

        const executionTime_kv = Date.now() - requestStartTime_kv
        
        // ranking will be by second list in case of intersect
        vals = vals.length == 1 ? vals[0] : intersect(vals[0],vals[1]);
        console.log(vals)

        const response_time = Date.now() - requestStartTime
        const cpu_time = response_time - executionTime_kv
        console.log('response time = ' + response_time)
        console.log('cpu time = ' + cpu_time)

        if(is_orgnr)
            result = vals
        else {
            result = create_output(vals, page, per_page)
            result['response_time'] = response_time
            result['cpu_time'] = cpu_time
        }
    }
    
    return new Response(JSON.stringify(result), {
        headers: all_headers,
    });


    return fetch("https://welcome.developers.workers.dev");
  }