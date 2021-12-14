#!/bin/bash

for filename in upload/*.json; do
   echo "upload $filename"
   wrangler kv:bulk put --binding=EMPLOYER $filename
done

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

        if (['orgnr', 'occupation-name', 'city', 'municipality', 'country', 'county', 'industry_group', 'ssyk', 'free'].indexOf(s) < 0)
            console.log('warning: ' + s + ' not recognized.')
        else
            params[s] = sp[i + 1].toLowerCase()
    }

    return params;
}

function measure_sort(arr) {

    arr.sort((item1, item2) => {
        return item2[2] - item1[2];
    })
}

function intersect_two(list1, list2) {

    //let intersection = arrA.filter(x => arrB.includes(x));
    let d = {};

    for (const l of list1)
        d[l[0]] = 1

    nr_found = 0
    for (let k = list2.length - 1; k > -1; k--) {
        if (list2[k][0] in d)
            nr_found += 1;
        else
            list2.splice(k, 1)
    }

    return list2
}

function create_output(vals, page = 1, per_page = 100) {

    const page_current = (page - 1) * per_page
    const result = {
        'employers': vals.slice(page_current, page * per_page),
        'overview': { 'nr_employers': vals.length, 'current_page': page, 'per_page': per_page }
    }

    return result
}

function parse_returns(searchParams) {
    console.log(searchParams)
    let page = searchParams.get('page') ? searchParams.get('page') : 1
    let per_page = searchParams.get('per_page') ? Math.min(searchParams.get('per_page'), 5000) : 100

    return [page, per_page]
}

function parse_freetext(s) {
    return s.split(' ')
}

async function do_freetext(params) {

    let gets = []
    const s = decodeURIComponent(Object.values(params)[0])
    console.log('free text: ' + s)

    const arr = parse_freetext(s)
    console.log(arr)

    for(const s of arr) {
        const key = 'new_competence_' + s;
        console.log('key:' + key)
        gets.push(EMPLOYER.get(key, { type: "json" }))
    }

    if(gets.length>5) {
        console.log('error, too long search string')
        gets = gets.slice(0,5);
    }
    
    let data = await Promise.all(gets);

    // remove all null
    console.log(data)

    data.forEach((item, index, arr) => {
        arr[index] = item['info']
    })

    return data

    // also search company name/orgnr manually
}

async function get_data(params, is_orgnr) {
    let gets = [];

    if(is_orgnr) {
        const key = Object.values(params)[0]
        gets.push(EMPLOYER.get(key, { type: "json" }))
    }
    else {
        for (const p of Object.keys(params)) {
            const key = 'new_' + p + '_' + decodeURIComponent(params[p])
            gets.push(EMPLOYER.get(key, { type: "json" }))
        }
    }

    let data = await Promise.all(gets);

    if (data.includes(null) || data.includes(undefined))
        return new Response(JSON.stringify({ error: "key not found" }), { headers: all_headers });

    if (!is_orgnr)
        data.forEach((item, index, arr) => {
            arr[index] = item['info']
        })

    return data;
}

function intersect(data) {
    // ranking will be by second list in case of intersect between two vals
    if(data.length==2) 
        return intersect_two(vals[0], vals[1]);
    else
        return intersect_two(vals[0], vals[1]);
}

async function handleRequest(request) {

    const requestStartTime = Date.now();
    let result = {}

    const { pathname, searchParams } = new URL(request.url);
    console.log(pathname)

    let params = parse_path(pathname)
    let [page, per_page] = parse_returns(searchParams)

    let is_orgnr = false;
    let is_freetext = false;

    if (Object.keys(params).length === 0) {
        return new Response(JSON.stringify({ "message": "please specify endpoint" }), { headers: all_headers });
    }
    else if (Object.keys(params).length == 1 && Object.keys(params)[0] == 'orgnr')
        is_orgnr = true;
    else if(Object.keys(params)[0] == 'free')
        is_freetext = true;

    if (Object.keys(params).length < 3) {
        
        const requestStartTime_kv = Date.now();
        
        let vals = []

        if(is_freetext) {
            const data = await do_freetext(params);
            vals = data.length == 1? data[0]: intersect(data);
        }
        else {
            const data = await get_data(params, is_orgnr);
            vals = data.length == 1? data[0]: intersect(data);
        }

        const response_time_kv = Date.now() - requestStartTime_kv
        console.log('response time = ' + response_time_kv)

        if (is_orgnr) {
            result = vals
            result['response_time_kv'] = response_time_kv
        }
        else {
            const start_time_sort = Date.now();
            //measure_sort(vals)
            const time_sort = Date.now() - start_time_sort;
            result = create_output(vals, page, per_page)
            result['response_time_kv'] = response_time_kv
            result['sort_time'] = time_sort
        }
    }

    return new Response(JSON.stringify(result), {
        headers: all_headers,
    });


    return fetch("https://welcome.developers.workers.dev");
}