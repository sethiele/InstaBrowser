OAuth2.adapter('instagram', {
  /**
   * @return {URL} URL to the page that returns the authorization code
   */
  authorizationCodeURL: function(config) {
    return 'https://api.instagram.com/oauth/authorize/?\
client_id={{CLIENT_ID}}&\
redirect_uri={{REDIRECT_URI}}&\
scope={{API_SCOPE}}&\
response_type=code'
        .replace('{{CLIENT_ID}}', config.clientId)
        .replace('{{REDIRECT_URI}}', this.redirectURL(config))
        .replace('{{API_SCOPE}}', config.apiScope);;
  },

  /**
   * @return {URL} URL to the page that we use to inject the content
   * script into
   */
  redirectURL: function(config) {
    return 'http://instagram.com/robots.txt';
  },

  /**
   * @return {String} Authorization code for fetching the access token
   */
  parseAuthorizationCode: function(url) {
      var error = url.match(/\?error=(.+)/);
         if (error) {
           throw 'Error getting authorization code: ' + error[1];
         }
         return url.match(/\?code=([\w\/\-]+)/)[1];
  },

  /**
   * @return {URL} URL to the access token providing endpoint
   */
  accessTokenURL: function() {
    return 'https://api.instagram.com/oauth/access_token';
  },

  /**
   * @return {String} HTTP method to use to get access tokens
   */
  accessTokenMethod: function() {
    return 'POST';
  },

  /**
   * @return {Object} The payload to use when getting the access token
   */
  accessTokenParams: function(authorizationCode, config) {
      return {
        code: authorizationCode,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: this.redirectURL(config),
        grant_type: 'authorization_code'
      };
  },

  /**
   * @return {Object} Object containing accessToken {String},
   * refreshToken {String} and expiresIn {Int}
   */
  parseAccessToken: function(response) {
      var parsedResponse = JSON.parse(response);
      return {
        accessToken: parsedResponse.access_token,
        refreshToken: parsedResponse.refresh_token,
        expiresIn: parsedResponse.expires_in
      };
  }
});
