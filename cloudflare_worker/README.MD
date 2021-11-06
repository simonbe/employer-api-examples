#install wrangler
npm i @cloudflare/wrangler -g 

#login
wrangler login

# upload files to cloudflare kv

# command, given binding specified in wrangler.toml
wrangler kv:bulk put --binding=TODO data_to_upload_1.json
wrangler kv:bulk put --binding=collection data_to_upload_1.json