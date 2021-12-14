const all_headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
    "content-type": "application/json;charset=UTF-8"
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

    for (let i = 1; i < sp.length - 1; i += 2) {
        let s = sp[i].toLowerCase()

        if (['orgnr', 'occupation-name', 'city', 'municipality', 'country', 'county', 'industry_group', 'ssyk', 'free'].indexOf(s) < 0) // these paths or their combinations are allowed
            console.log('warning: ' + s + ' not recognized.')
        else
            params[s] = sp[i + 1].toLowerCase()
    }

    return params;
}


function parse_returns(searchParams) {

    let page = searchParams.get('page') ? searchParams.get('page') : 1;
    let per_page = searchParams.get('per_page') ? Math.min(searchParams.get('per_page'), 5000) : 100;

    return [page, per_page]
}


// not used
function sort_by_index(arr) {

    arr.sort((item1, item2) => {
        return item2[2] - item1[2];
    })
}


function create_output(vals, page = 1, per_page = 100) {

    const page_current = (page - 1) * per_page
    return {    'employers': vals.slice(page_current, page * per_page),
                'overview': { 'nr_employers': vals.length, 'current_page': page, 'per_page': per_page } }
}

// handles combinations
function intersect(data) {
    
    // only use orgnrs (first element) after first array
    let new_data = data.slice(1,data.length).map(d=>d.map(a=>a[0]).flat(2))
    new_data.splice(0,0,data[0])

    // check intersection
    result = new_data.reduce((a, b) => a.filter(c => b.includes(c[0])));

    return result
}


async function freetext_comp_traits(words) {

    let gets = []

    for(const s of words) { // keys competencies/traits
        const key = 'new_competence_' + s;
        gets.push(EMPLOYER.get(key, { type: "json" }))
    }

    let data = await Promise.all(gets);

    // remove misses and change to proper form
    data = data.filter(item => item!=null)
    data.forEach(
        (item, index, arr) => { arr[index] = item['info'] }) // (!) remove so info not needed
    
    return data
}


async function freetext_other(words, key) {
    const gets = [EMPLOYER.get('free_search_' + key, {type: "json"})]
    let data = await Promise.all(gets);

    let arr = data[0]

    let res = []

    fetch = []

    for(const s of words) {
        slow = s.toLowerCase()

        if(arr.includes(slow)) {
            fetch.push(slow)
        }
    }

    if(fetch.length>0) {
        data = await EMPLOYER.get('free_search_names_data', {type: "json"})
        for(const k of fetch)
            if(key == 'names') // (!) make data format same
                res.push(data[k])
            else
                res.push([data[k]])
    }
    return res
}


async function get_data_freetext(params) {

    const s = decodeURIComponent(Object.values(params)[0])

    const arr = s.split(' '); // could allow more parsing (e.g. with +, -, "")
    
    if(arr.length>10) {
        console.log('Warning: too long search string, max 10 words.')
        arr = arr.slice(0, 10);
    }

    // first tries competencies/traits, company names, last org nrs
    let data = await freetext_comp_traits(arr)
    
    if(data.length==0) {
        data = await freetext_other(arr,'names')
        if(data.length == 0)
            data = await freetext_other(arr,'orgnrs')
    }

    return data
}


async function get_data_orgnr(orgnr) {
    return await EMPLOYER.get(orgnr, { type: "json" })
}


async function get_data_structured(params) {
    let gets = [];

    for (const p of Object.keys(params)) {
        const key = 'new_' + p + '_' + decodeURIComponent(params[p]) // format of keys
        gets.push(EMPLOYER.get(key, { type: "json" }))
    }

    let data = await Promise.all(gets);

    if (data.includes(null) || data.includes(undefined))
        return new Response(JSON.stringify({ error: "key not found" }), { headers: all_headers });

    data.forEach((item, index, arr) => {
        arr[index] = item['info']
    })

    return data;
}



async function handleRequest(request) {

    let result = {}
    let is_orgnr = false;
    let is_freetext = false;

    const { pathname, searchParams } = new URL(request.url);

    const params = parse_path(pathname)
    const [page, per_page] = parse_returns(searchParams)


    if (Object.keys(params).length === 0) {
        return new Response(JSON.stringify({ "message": "please specify endpoint." }), { headers: all_headers });
    }
    else if (Object.keys(params).length == 1 && Object.keys(params)[0] == 'orgnr')
        is_orgnr = true;
    else if(Object.keys(params)[0] == 'free')
        is_freetext = true;

    if (Object.keys(params).length < 3) {
        
        const requestStartTime_kv = Date.now();
        
        if(is_orgnr)
            const data = await get_data_orgnr(param.values()[0])
        else
            const data = is_freetext? await get_data_freetext(params): await get_data_structured(params);
        
        let vals = []
        if(data.length>0)
            vals = data.length == 1? data[0]: intersect(data); // combinations are intersected

        result = is_orgnr? vals: create_output(vals, page, per_page);

        const response_time_kv = Date.now() - requestStartTime_kv
        result['response_time_kv'] = response_time_kv
    }
    else
        result = { 'error': 'too many parameters.'}

    return new Response(JSON.stringify(result), {
        headers: all_headers,
    });
}