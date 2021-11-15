# API using cloudflare worker as endpoint and stored data in kv store  
(Note: To fetch many data points, it is better to use the data files directly.)  

0. Assumes wrangler installed and account exists:  

#install wrangler
npm i @cloudflare/wrangler -g 
  
#login
wrangler login

1. Create a kv namespace and binding (here TODO is used)  
wrangler.toml
(or generate manually)

2. Upload generated bulk data to cloudflare kv with this binding  
bash upload_cf.sh  
(which does "wrangler kv:bulk put --binding=COLLECTION data_to_upload_0.json" for all files


# Example calls

Fetch data for a single organization number:  
https://bitter-wave-4f8f.simonbe.workers.dev/orgnr/2021002114

Fetch a subset of a collection:  
https://bitter-wave-4f8f.simonbe.workers.dev/collections/?page=1&per_page=10