API using cloudflare worker as endpoint and stored data in kv store  


0. Assumes wrangler installed and account exists:  

#install wrangler
npm i @cloudflare/wrangler -g 
  
#login
wrangler login

1. Upload files to cloudflare kv

# command, given binding specified in wrangler.toml
wrangler kv:bulk put --binding=TODO data_to_upload_1.json
wrangler kv:bulk put --binding=collection data_to_upload_1.json