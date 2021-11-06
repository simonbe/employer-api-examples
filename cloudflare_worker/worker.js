addEventListener("fetch", (event) => {
    event.respondWith(
      handleRequest(event.request).catch(
        (err) => new Response(err.stack, { status: 500 })
      )
    );
  });
  
  /**
   * Many more examples available at:
   *   https://developers.cloudflare.com/workers/examples
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  async function handleRequest(request) {
    const { pathname } = new URL(request.url);
  
    if (pathname.startsWith("/api")) {
      return new Response(JSON.stringify({ pathname }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  
    if (pathname.startsWith("/test")) {
      let sp = pathname.split('/')
      console.log(sp)
      if(sp.length<3 || sp[2] == "" ) {
        return new Response(JSON.stringify({ "error": "no key specified" }), {
            headers: { "Content-Type": "application/json" },
          });
      }

      let key = sp[2]
      let value = await TODO.get(key);
      console.log('key: ' + key + ', value: ' + value)
  
      return new Response(JSON.stringify({ "value": value }), {
        headers: { "Content-Type": "application/json" },
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